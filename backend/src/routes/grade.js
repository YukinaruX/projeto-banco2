import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
    const rows = await sql`
        SELECT * FROM v_grade_disponibilidade
        LIMIT 1000
    `;
    res.json(rows);
});

export default router;
