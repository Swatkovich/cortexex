import { Router } from "express";
import { register, login, getProfile, logout } from "../controllers/auth.controller";
import { getProfileStats } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Публичные роуты (не требуют авторизации)
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(authMiddleware), asyncHandler(logout));

// Защищенные роуты (требуют авторизации)
router.get("/profile", asyncHandler(authMiddleware), asyncHandler(getProfile));
router.get("/profile/stats", asyncHandler(authMiddleware), asyncHandler(getProfileStats));

export default router;