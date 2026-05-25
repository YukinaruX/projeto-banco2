import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
    const rows = await sql`SELECT * FROM v_profissionais_ativos`;
    res.json(rows);
});

export default router;
