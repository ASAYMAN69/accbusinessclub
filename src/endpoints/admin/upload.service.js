const sharp = require("sharp");
const s3 = require("../../storage/s3");

const ACCEPTED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
]);

/**
 * Compresses an image to optimized WebP and uploads it to S3.
 * @param {Express.Multer.File} file
 * @returns {Promise<{ key: string, url: string, size: number }>}
 */
async function processAndUploadImage(file) {
  if (!file || !file.buffer) {
    const err = new Error("No image file uploaded.");
    err.status = 400;
    err.errors = [{ field: "file", err: "Please choose an image file to upload." }];
    throw err;
  }

  if (file.mimetype && !ACCEPTED_MIMES.has(file.mimetype.toLowerCase())) {
    const err = new Error("Unsupported image format.");
    err.status = 400;
    err.errors = [{ field: "file", err: "Supported image formats: JPEG, PNG, WebP, AVIF, GIF." }];
    throw err;
  }

  let webpBuffer;
  try {
    webpBuffer = await sharp(file.buffer)
      .rotate() // Auto-orient based on EXIF
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  } catch (err) {
    console.error("Image compression error:", err);
    const e = new Error("Failed to process image.");
    e.status = 400;
    e.errors = [{ field: "file", err: "The uploaded file is not a valid image." }];
    throw e;
  }

  const key = await s3.putImage(webpBuffer, "image/webp");
  const filename = key.replace(/^members\//, "");

  return {
    key,
    url: `/api/images/members/${filename}`,
    size: webpBuffer.length,
  };
}

module.exports = {
  processAndUploadImage,
  ACCEPTED_MIMES,
};
