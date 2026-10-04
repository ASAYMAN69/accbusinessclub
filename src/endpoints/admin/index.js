const path = require("path");
const express = require("express");
const multer = require("multer");
const { requireAdmin } = require("../../middleware/auth.middleware");
const { processAndUploadImage } = require("./upload.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB limit for raw admin uploads
});

// Admin image upload endpoint: compresses to WebP via Sharp and uploads to S3
router.post("/api/admin/upload", requireAdmin, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 10 MB or smaller."
        : "Invalid upload — please send a valid multipart file field 'file'.";
      return res.status(400).json({ errors: [{ field: "file", err: msg }] });
    }

    try {
      const result = await processAndUploadImage(req.file);
      return res.status(200).json(result);
    } catch (e) {
      if (e.errors) {
        return res.status(e.status || 400).json({ errors: e.errors });
      }
      console.error("Admin upload error:", e);
      return res.status(typeof e.status === "number" ? e.status : 500).end();
    }
  });
});

// Admin Panel Dashboard Frontend
router.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

module.exports = router;
