// routes/printSettingsRoutes.js
const express = require("express");
const router  = express.Router();
const { getSettings, saveSettings, resetSettings ,getLogo} = require("../controllers/printSettingsController");

// All routes are under /print-settings
router.get   ("/:collectionName", getSettings);
router.put   ("/:collectionName", saveSettings);
router.delete("/:collectionName", resetSettings);
router.get("/:collectionName/logo", getLogo);
module.exports = router;