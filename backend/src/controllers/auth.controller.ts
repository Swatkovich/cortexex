import { Request, Response} from "express";
import { randomUUID } from "crypto";
import bcrypt from 'bcryptjs';
import { User } from "../types/user";
import { pool } from "../db";
import { AuthRequest } from "../types/auth";


export const register = async (req: Request, res: Response) => {
    const {name, password} = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: "Name and password required" });
    }

    const existing = await pool.query(
        "SELECT id FROM users WHERE name = $1",
        [name]
    );

    if (existing.rows.length > 0) {
        return res.status(400).json({ message: "User already exists" });
    }

    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser: User = {
        id,
        name,
        password: hashedPassword,
    }

    await pool.query("INSERT INTO users (id, name, password_hash) VALUES ($1, $2, $3)", [...Object.values(newUser)]);

    res.cookie('accessToken', id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    })

    return res.status(201).json({message: "User registered successfully"});
}

export const login = async (req: Request, res: Response) => {
    const {name, password} = req.body;
    
    if (!name || !password) {
        return res.status(400).json({ message: "Name and password required" });
    }

    const result = await pool.query("SELECT id, password_hash FROM users WHERE name = $1", [name])

    if (result.rows.length === 0) return res.status(400).json({message: "User not found"})
    
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) return res.status(400).json({message: "Wrong password"})

    res.cookie('accessToken', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    })

    return res.status(200).json({ message: "Login successful" });
}

export const getProfile = async (req: AuthRequest, res: Response) => {
    // req.userId гарантированно установлен authMiddleware
    const userId = req.userId!;

    const result = await pool.query(
        "SELECT id, name FROM users WHERE id = $1",
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    return res.status(200).json({
        id: user.id,
        name: user.name
    });
}