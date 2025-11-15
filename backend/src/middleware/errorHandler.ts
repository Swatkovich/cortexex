import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("Error:", err);

    // If response was already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    // Handle known error types
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            message: err.message || "An error occurred",
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
    }

    // Default to 500 Internal Server Error
    res.status(500).json({
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

