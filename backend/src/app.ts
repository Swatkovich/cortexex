import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser())

//Routes
app.use("/api/auth", authRoutes);

app.get('/', (req, res) => {
    res.json({ message: "API is running"})
})

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;