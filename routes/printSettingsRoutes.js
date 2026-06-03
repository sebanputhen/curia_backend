// routes/printSettingsRoutes.js
const express = require("express");
const router  = express.Router();
const { getSettings, saveSettings, resetSettings } = require("../controllers/printSettingsController");

// All routes are under /print-settings
router.get   ("/:collectionName", getSettings);
router.put   ("/:collectionName", saveSettings);
router.delete("/:collectionName", resetSettings);

module.exports = router;