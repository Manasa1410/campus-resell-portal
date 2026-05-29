import express from "express";
import { saveSearch, getSavedSearches, deleteSavedSearch } from "../controllers/savedSearchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, saveSearch);
router.get("/", protect, getSavedSearches);
router.delete("/:id", protect, deleteSavedSearch);

export default router;
