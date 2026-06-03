const express = require("express");
const router = express.Router();
const {
  getAllPriests, getOnePriest, createNewPriest, updatePriest, deletePriest,
} = require("../controllers/priestController");

router.get("/", getAllPriests);
router.get("/:priestid", getOnePriest);
router.post("/", createNewPriest);
router.put("/:priestid", updatePriest);
router.delete("/:priestid", deletePriest);

module.exports = router;