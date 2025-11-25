import { Router } from "express";
import {
    getThemes,
    getTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createLanguageEntry,
    updateLanguageEntry,
    deleteLanguageEntry,
    exportTheme,
    importTheme
} from "../controllers/theme.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All theme routes require authentication
router.use(asyncHandler(authMiddleware));

// Theme routes
router.get("/", asyncHandler(getThemes));
router.get("/:id/export", asyncHandler(exportTheme)); // Must come before /:id
router.get("/:id", asyncHandler(getTheme));
router.post("/", asyncHandler(createTheme));
router.post("/import", asyncHandler(importTheme));
router.put("/:id", asyncHandler(updateTheme));
router.delete("/:id", asyncHandler(deleteTheme));

// Question routes (nested under themes)
router.post("/:themeId/questions", asyncHandler(createQuestion));
router.put("/:themeId/questions/:questionId", asyncHandler(updateQuestion));
router.delete("/:themeId/questions/:questionId", asyncHandler(deleteQuestion));

// Language entries routes
router.post("/:themeId/language-entries", asyncHandler(createLanguageEntry));
router.put("/:themeId/language-entries/:entryId", asyncHandler(updateLanguageEntry));
router.delete("/:themeId/language-entries/:entryId", asyncHandler(deleteLanguageEntry));

export default router;

