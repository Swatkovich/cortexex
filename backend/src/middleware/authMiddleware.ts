import { Response, NextFunction} from 'express'
import {AuthRequest} from '../types/auth'
import {pool} from '../db'

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.accessToken
    if (!token) return res.status(401).json({message: 'Not authorized'})

    const result = await pool.query("SELECT id FROM users WHERE id = $1", [token])
    if (result.rows.length === 0) return res.status(401).json({message: 'Invalid token'})

    req.userId = result.rows[0].id
    next()
}