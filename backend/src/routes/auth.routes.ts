import { Router } from "express";
import { register, login, getProfile } from "../controllers/auth.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Публичные роуты (не требуют авторизации)
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));

// Защищенные роуты (требуют авторизации)
router.get("/profile", asyncHandler(authMiddleware), asyncHandler(getProfile));

export default router;