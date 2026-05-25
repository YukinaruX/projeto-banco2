import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
    const rows = await sql`
        SELECT * FROM v_agenda_detalhada
        WHERE status = 'agendado'
        ORDER BY inicio ASC
    `;
    res.json(rows);
});

router.post("/concluir/:id", async (req, res) => {
    const [result] = await sql`
        SELECT sp_concluir_agendamento(${req.params.id}) AS resultado
    `;
    res.json(result.resultado);
});

router.post("/cancelar/:id", async (req, res) => {
    const [result] = await sql`
        SELECT sp_cancelar_agendamento(${req.params.id}) AS resultado
    `;
    res.json(result.resultado);
});

export default router;
