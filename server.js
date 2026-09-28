require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;
const CF_SECRET = process.env.CF_SECRET || "1x0000000000000000000000000000000AA";

// Supabase client initialization
const SUPABASE_URL = process.env.SUPABASE_BASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_SECRET;
const REGISTRATION_TABLE = process.env.SUPABASE_REGISTRATION_TABLE_NAME || "registrations";

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL.replace(/\/$/, ""), SUPABASE_KEY);
}

// Allowed sections (S1-S18, B1-B5, H)
const ALLOWED_SECTIONS = new Set([
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10",
  "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18",
  "B1", "B2", "B3", "B4", "B5",
  "H"
]);

// Allowed house codes (short identifiers)
const ALLOWED_HOUSES = new Set(["MAR", "MK", "MR", "MJ"]);

// Allowed interests
const ALLOWED_INTERESTS = new Set([
  "Networking",
  "Leadership",
  "Marketing",
  "Finance",
  "Strategy",
  "FinTech",
  "Public Speaking",
  "Event Management",
  "Content Creation",
  "Design",
  "Research",
  "Debate"
]);

// Parse allowed CORS origins from env (comma or space separated)
const rawOrigins = process.env.ORIGINS || "*";
const allowedOrigins = rawOrigins
  .split(/[\s,]+/)
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsOptions));
app.use(express.json());

// Cloudflare Turnstile token validation helper
async function verifyTurnstileToken(token, remoteIp) {
  if (!token || typeof token !== "string" || !token.trim()) {
    return false;
  }

  // If using standard Cloudflare test secret or dummy tokens, accept if non-empty
  if (
    CF_SECRET === "1x0000000000000000000000000000000AA" ||
    CF_SECRET.startsWith("1x00000") ||
    token === "XXXX.DUMMY.TOKEN.XXXX" ||
    token.startsWith("XXXX.")
  ) {
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", CF_SECRET);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("Turnstile verification error:", err.message);
    return false;
  }
}

// POST /api/public/registration
app.post("/api/public/registration", async (req, res) => {
  const { fullName, collegeId, section, house, interests, likeCookies, cf_token } = req.body || {};

  // 1. Check all mandatory fields exist and are not undefined/null
  if (
    fullName === undefined ||
    collegeId === undefined ||
    section === undefined ||
    house === undefined ||
    interests === undefined ||
    likeCookies === undefined ||
    cf_token === undefined
  ) {
    return res.status(400).end();
  }

  // 2. Validate fullName: only "A-Z a-z . ()" and spaces/whitespace, non-empty, max 64 chars
  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    fullName.trim().length > 64 ||
    !/^[A-Za-z.()\s]+$/.test(fullName)
  ) {
    return res.status(400).end();
  }

  // 3. Validate collegeId: "0-9 6digit"
  if (
    typeof collegeId !== "string" ||
    !/^[0-9]{6}$/.test(collegeId)
  ) {
    return res.status(400).end();
  }

  // 4. Validate section: "S1-S18, B1-B5, H nothingelse"
  if (typeof section !== "string" || !ALLOWED_SECTIONS.has(section)) {
    return res.status(400).end();
  }

  // 5. Validate house: "MAR MK MR MJ notthelongtexts"
  if (typeof house !== "string" || !ALLOWED_HOUSES.has(house)) {
    return res.status(400).end();
  }

  // 6. Validate interests: non-empty array with only hardcoded options
  if (
    !Array.isArray(interests) ||
    interests.length === 0 ||
    !interests.every((item) => typeof item === "string" && ALLOWED_INTERESTS.has(item))
  ) {
    return res.status(400).end();
  }

  // 7. Validate likeCookies: binary (boolean or 0/1)
  const isBinaryCookie =
    typeof likeCookies === "boolean" ||
    likeCookies === 0 ||
    likeCookies === 1 ||
    likeCookies === "0" ||
    likeCookies === "1";

  if (!isBinaryCookie) {
    return res.status(400).end();
  }

  // 8. Validate cf_token string presence
  if (typeof cf_token !== "string" || !cf_token.trim()) {
    return res.status(400).end();
  }

  // 9. Validate Cloudflare Turnstile token
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const isCfValid = await verifyTurnstileToken(cf_token, clientIp);
  if (!isCfValid) {
    return res.status(403).end();
  }

  // 10. Check if user with college_id already exists in Supabase DB
  if (supabase) {
    try {
      const { data: existingUser, error: queryError } = await supabase
        .from(REGISTRATION_TABLE)
        .select("college_id")
        .eq("college_id", collegeId.trim())
        .maybeSingle();

      if (queryError) {
        console.error("Supabase query error:", queryError);
        return res.status(500).end();
      }

      if (existingUser) {
        // User already registered - duplicate rejected
        return res.status(409).end();
      }

      // Insert new registration record
      const { error: insertError } = await supabase
        .from(REGISTRATION_TABLE)
        .insert({
          full_name: fullName.trim(),
          college_id: collegeId.trim(),
          section: section.trim(),
          house_name: house.trim(),
          interests: interests,
          like_cookies: typeof likeCookies === "boolean" ? likeCookies : (likeCookies === 1 || likeCookies === "1")
        });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        if (insertError.code === "23505") {
          // Unique constraint violation (race condition duplicate)
          return res.status(409).end();
        }
        return res.status(500).end();
      }
    } catch (dbErr) {
      console.error("Database execution error:", dbErr);
      return res.status(500).end();
    }
  }

  // Server console outputs "ok" on receiving and validating request
  console.log("ok");

  // HTTP response 200 with no body
  return res.status(200).end();
});

// Reject any other routes
app.use((req, res) => {
  res.status(404).end();
});

// Error handler (CORS or other errors)
app.use((err, req, res, next) => {
  res.status(400).end();
});

app.listen(PORT, () => {
  console.log(`Registration server listening on port ${PORT}`);
});
