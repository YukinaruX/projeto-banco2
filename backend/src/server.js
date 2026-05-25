import "dotenv/config";
import express from "express";
import cors from "cors";

import agendaRoutes       from "./routes/agenda.js";
import gradeRoutes        from "./routes/grade.js";
import servicosRoutes     from "./routes/servicos.js";
import profissionaisRoutes from "./routes/profissionais.js";
import agendarRoutes      from "./routes/agendar.js";

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/api/agenda",        agendaRoutes);
app.use("/api/grade",         gradeRoutes);
app.use("/api/servicos",      servicosRoutes);
app.use("/api/profissionais", profissionaisRoutes);
app.use("/api/agendar",       agendarRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
