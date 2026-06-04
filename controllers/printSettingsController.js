// controllers/printSettingsController.js
//
// Routes:
//   GET    /print-settings/:collectionName   → return settings doc (404 if none)
//   PUT    /print-settings/:collectionName   → upsert settings, return { message, settings }
//   DELETE /print-settings/:collectionName   → delete doc (reset), return { message }

const PrintSettings = require("../models/printSettingsModel");

// ── GET ───────────────────────────────────────────────────────────────────────
async function getSettings(req, res) {
  try {
    const { collectionName = "marriage" } = req.params;
    // Exclude logoDataUrl from the main fetch — load it separately only when needed
    const settings = await PrintSettings.findOne(
      { collectionName },
      { logoDataUrl: 0 }  // ← exclude the heavy field
    );

    if (!settings) return res.status(404).json({ message: "No print settings found." });
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch print settings." });
  }
}
async function getLogo(req, res) {
  try {
    const { collectionName } = req.params;
    const doc = await PrintSettings.findOne({ collectionName }, { logoDataUrl: 1 });
    res.status(200).json({ logoDataUrl: doc?.logoDataUrl || "" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logo." });
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────
// Splits logoDataUrl out so the main doc stays small (fast to load on every
// page mount). Logo is stored back in the same doc in a second update.
async function saveSettings(req, res) {
  try {
    const { collectionName = "marriage" } = req.params;
    const { logoDataUrl, ...rest } = req.body;

    // Step 1: upsert everything except logo
    let settings = await PrintSettings.findOneAndUpdate(
      { collectionName },
      { ...rest, collectionName },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    );

    // Step 2: store logo separately (avoids validator size issues on main fields)
    if (logoDataUrl !== undefined) {
      settings = await PrintSettings.findOneAndUpdate(
        { collectionName },
        { logoDataUrl },
        { new: true }
      );
    }

    res.status(200).json({ message: "Print settings saved.", settings });
  } catch (err) {
    console.error("saveSettings:", err);
    res.status(500).json({ message: "Failed to save print settings." });
  }
}

// ── DELETE (reset) ────────────────────────────────────────────────────────────
async function resetSettings(req, res) {
  try {
    const { collectionName = "marriage" } = req.params;
    await PrintSettings.findOneAndDelete({ collectionName });
    res.status(200).json({ message: "Print settings reset to defaults." });
  } catch (err) {
    console.error("resetSettings:", err);
    res.status(500).json({ message: "Failed to reset print settings." });
  }
}

module.exports = { getSettings, saveSettings, resetSettings, getLogo };