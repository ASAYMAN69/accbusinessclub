const http = require("http");
const sharp = require("sharp");
const { createApp } = require("../app");
const { ADMIN_TOKEN } = require("../config/env");
const s3 = require("../storage/s3");

let passed = 0;
let failed = 0;

function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`  ok ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function createTestImageBuffer(format = "png") {
  return sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 34, g: 197, b: 94, alpha: 1 },
    },
  })[format]()
    .toBuffer();
}

async function main() {
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  let createdMemberId = null;
  let firstImageKey = null;
  let secondImageKey = null;

  try {
    // 1. GET /admin -> 200 HTML
    let res = await fetch(`${base}/admin`);
    check("GET /admin → 200", res.status === 200, `got ${res.status}`);
    const html = await res.text();
    check("Admin HTML contains dashboard title", html.includes("ACCBC Dashboard"), html.slice(0, 100));

    // 2. POST /api/admin/upload auth checks
    const testPng = await createTestImageBuffer("png");

    res = await fetch(`${base}/api/admin/upload`, {
      method: "POST",
    });
    check("Upload without auth header → 401", res.status === 401, `got ${res.status}`);

    res = await fetch(`${base}/api/admin/upload`, {
      method: "POST",
      headers: { Authorization: "Bearer wrong-token" },
    });
    check("Upload with wrong token → 401", res.status === 401, `got ${res.status}`);

    // 3. POST /api/admin/upload happy path (PNG -> WebP conversion)
    const form1 = new FormData();
    form1.append("file", new Blob([testPng], { type: "image/png" }), "test-photo.png");

    res = await fetch(`${base}/api/admin/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: form1,
    });
    check("Upload PNG with valid token → 200", res.status === 200, `got ${res.status}`);
    const uploadData1 = await res.json();
    firstImageKey = uploadData1.key;
    check("Upload returns members/*.webp key", Boolean(firstImageKey && /^members\/[0-9a-f-]+\.webp$/i.test(firstImageKey)), firstImageKey);
    check("Upload returns valid image url", Boolean(uploadData1.url && uploadData1.url.startsWith("/api/images/")), uploadData1.url);

    // 4. Verify the uploaded image is accessible via /api/images/
    res = await fetch(`${base}${uploadData1.url}`);
    check("GET uploaded image via URL → 200", res.status === 200, `got ${res.status}`);
    check("Uploaded image Content-Type is image/webp", res.headers.get("content-type") === "image/webp", res.headers.get("content-type"));

    // 5. Create member using the uploaded image key
    res = await fetch(`${base}/api/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        panel: "executive",
        name: "Admin Test Executive",
        role: "Head of QA",
        sort_order: 1,
        image: firstImageKey,
      }),
    });
    check("POST /api/members with image key → 201", res.status === 201, `got ${res.status}`);
    const memberData = await res.json();
    createdMemberId = memberData.id;
    check("Created member has correct image key", memberData.image === firstImageKey, memberData.image);

    // 6. Upload a second image (JPEG) and update member
    const testJpeg = await createTestImageBuffer("jpeg");
    const form2 = new FormData();
    form2.append("file", new Blob([testJpeg], { type: "image/jpeg" }), "second-photo.jpg");

    res = await fetch(`${base}/api/admin/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: form2,
    });
    check("Upload second JPEG photo → 200", res.status === 200, `got ${res.status}`);
    const uploadData2 = await res.json();
    secondImageKey = uploadData2.key;

    // Update member with second image key
    res = await fetch(`${base}/api/members/${createdMemberId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        image: secondImageKey,
        role: "Director of QA",
      }),
    });
    check("PUT /api/members/:id with new image key → 200", res.status === 200, `got ${res.status}`);

    // Verify first image was cleaned up from S3
    const firstStream = await s3.getImageStream(firstImageKey);
    check("Replaced first image was removed from S3", firstStream === null);

    // 7. Delete member and verify second image cleanup
    res = await fetch(`${base}/api/members/${createdMemberId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    check("DELETE member → 204", res.status === 204, `got ${res.status}`);
    createdMemberId = null;

    const secondStream = await s3.getImageStream(secondImageKey);
    check("Deleted member image was removed from S3", secondStream === null);
    secondImageKey = null;
  } finally {
    if (createdMemberId) {
      await fetch(`${base}/api/members/${createdMemberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }).catch(() => {});
    }
    if (firstImageKey) await s3.removeImage(firstImageKey).catch(() => {});
    if (secondImageKey) await s3.removeImage(secondImageKey).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nverify-admin: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("verify-admin failed:", err);
  process.exit(1);
});
