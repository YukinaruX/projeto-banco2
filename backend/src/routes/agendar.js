import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
    const {
        p_cliente_nome,
        p_cliente_email,
        p_cliente_telefone,
        p_profissional_id,
        p_servico_id,
        p_inicio,
        p_observacao = null,
    } = req.body;

    const [result] = await sql`
        SELECT sp_agendar(
            ${p_cliente_nome},
            ${p_cliente_email},
            ${p_cliente_telefone},
            ${p_profissional_id},
            ${p_servico_id},
            ${p_inicio},
            ${p_observacao}
        ) AS resultado
    `;
    res.json(result.resultado);
});

export default router;
