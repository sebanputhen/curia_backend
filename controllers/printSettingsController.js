// controllers/printSettingsController.js
//
// Routes:
//   GET    /print-settings/:collectionName          → return settings doc (404 if none)
//   PUT    /print-settings/:collectionName          → upsert settings, return { message, settings }
//   DELETE /print-settings/:collectionName          → delete doc (reset), return { message }
//   POST   /upload/logo/:collectionName             → upload logo file, return { logoUrl }

const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");
const PrintSettings = require("../models/printSettingsModel");

// ── Multer — logo file upload ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/logos");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `logo_${req.params.collectionName}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("Only image files are allowed (PNG, JPEG, WebP, SVG)"));
  },
});

// Export the multer middleware so the router can use it
const uploadLogoMiddleware = upload.single("logo");

// ── GET settings ──────────────────────────────────────────────────────────────
// logoUrl is just a short string now — no need to exclude it
async function getSettings(req, res) {
  try {
    const { collectionName = "marriage" } = req.params;
    const settings = await PrintSettings.findOne({ collectionName });
    if (!settings) return res.status(404).json({ message: "No print settings found." });
    res.status(200).json(settings);
  } catch (err) {
    console.error("getSettings:", err);
    res.status(500).json({ message: "Failed to fetch print settings." });
  }
}

// ── POST logo upload ──────────────────────────────────────────────────────────
// Saves file to /uploads/logos/, deletes the old logo file if one existed,
// and updates the logoUrl field in the DB doc immediately.
async function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  const { collectionName = "marriage" } = req.params;
  const logoUrl = `/uploads/logos/${req.file.filename}`;

  try {
    // Delete previous logo file from disk (keep uploads folder clean)
    const existing = await PrintSettings.findOne({ collectionName }, { logoUrl: 1 });
    if (existing?.logoUrl) {
      const oldPath = path.join(__dirname, "..", existing.logoUrl);
      if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {}); // non-blocking
    }

    // Persist the new URL in the settings doc
    await PrintSettings.findOneAndUpdate(
      { collectionName },
      { logoUrl },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ logoUrl });
  } catch (err) {
    console.error("uploadLogo:", err);
    // Clean up uploaded file if DB update failed
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: "Failed to save logo URL." });
  }
}

// ── PUT settings ──────────────────────────────────────────────────────────────
// Single-step upsert — no logo base64 to split out any more
async function saveSettings(req, res) {
  try {
    const { collectionName = "marriage" } = req.params;

    // Strip any legacy / accidental base64 fields from the payload
    const { logoDataUrl, ...rest } = req.body;

    // If client sends a blob: URL (upload still in progress), ignore it
    if (rest.logoUrl?.startsWith("blob:")) delete rest.logoUrl;

    const settings = await PrintSettings.findOneAndUpdate(
      { collectionName },
      { ...rest, collectionName },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Print settings saved.", settings });
  } catch (err) {
    console.error("saveSettings:", err);
    res.status(500).json({ message: "Failed to save print settings." });
  }
}

// ── DELETE (reset) ────────────────────────────────────────────────────────────
// Also removes the logo file from disk
async function resetSettings(req, res) {
  try {
    const { collectionName = "marriage" } = req.params;
    const doc = await PrintSettings.findOneAndDelete({ collectionName });

    // Remove logo file if one was stored
    if (doc?.logoUrl) {
      const logoPath = path.join(__dirname, "..", doc.logoUrl);
      if (fs.existsSync(logoPath)) fs.unlink(logoPath, () => {});
    }

    res.status(200).json({ message: "Print settings reset to defaults." });
  } catch (err) {
    console.error("resetSettings:", err);
    res.status(500).json({ message: "Failed to reset print settings." });
  }
}

module.exports = { getSettings, saveSettings, resetSettings, uploadLogo, uploadLogoMiddleware };