import { useState, useEffect, useCallback } from "react";
import { C, formatDateTime, formatCurrency, formatTime, formatDate, badgeStyle } from "./utils";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const ENV_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const S = {
    root: {
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        color: C.textPrimary,
    },
    header: {
        marginBottom: 32,
        borderBottom: `0.5px solid ${C.borderLight}`,
        paddingBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
    },
    title:    { fontSize: 22, fontWeight: 500, margin: 0, color: C.textPrimary },
    subtitle: { fontSize: 13, color: C.textSecondary, margin: "4px 0 0" },
    tabs:     { display: "flex", gap: 8, marginBottom: 24 },
    tab: (active) => ({
        padding:      "6px 16px",
        border:       `0.5px solid ${active ? C.borderInfo : C.borderLight}`,
        borderRadius: C.radiusMd,
        background:   active ? C.bgInfo : "transparent",
        color:        active ? C.textInfo : C.textSecondary,
        cursor:       "pointer",
        fontSize:     14,
        fontWeight:   500,
    }),
    card: {
        background:   C.bgPrimary,
        border:       `0.5px solid ${C.borderLight}`,
        borderRadius: C.radiusLg,
        padding:      "16px 20px",
        marginBottom: 12,
    },
    grid2:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    label:  { display: "block", fontSize: 12, color: C.textSecondary, marginBottom: 4 },
    input:  { width: "100%", boxSizing: "border-box" },
    btn: {
        padding:      "8px 20px",
        border:       `0.5px solid ${C.borderMid}`,
        borderRadius: C.radiusMd,
        background:   "transparent",
        cursor:       "pointer",
        fontSize:     14,
        fontWeight:   500,
        color:        C.textPrimary,
    },
    btnPrimary: {
        padding:      "8px 20px",
        border:       "none",
        borderRadius: C.radiusMd,
        background:   C.bgInfo,
        color:        C.textInfo,
        cursor:       "pointer",
        fontSize:     14,
        fontWeight:   500,
    },
    badge: badgeStyle,
    msg: (type) => ({
        padding:      "10px 14px",
        borderRadius: C.radiusMd,
        fontSize:     13,
        marginBottom: 12,
        background:   type === "error" ? C.bgDanger   : C.bgSuccess,
        color:        type === "error" ? C.textDanger : C.textSuccess,
    }),
    row:    { display: "flex", alignItems: "center", gap: 8 },
    muted:  { fontSize: 13, color: C.textSecondary },
    strong: { fontWeight: 500 },
};

// ─── COMPONENTES ───────────────────────────────────────────────────────────────

function Logo() {
    return (
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="38" height="38" rx="10" fill={C.bgInfo} />
            <rect x="9" y="8" width="20" height="22" rx="3" stroke={C.textInfo} strokeWidth="1.8" fill="none" />
            <line x1="9"  y1="14" x2="29" y2="14" stroke={C.textInfo} strokeWidth="1.8" />
            <line x1="13" y1="8"  x2="13" y2="12" stroke={C.textInfo} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="25" y1="8"  x2="25" y2="12" stroke={C.textInfo} strokeWidth="1.8" strokeLinecap="round" />
            <rect x="13" y="18" width="4" height="4" rx="1" fill={C.textInfo} />
            <rect x="20" y="18" width="4" height="4" rx="1" fill={C.textInfo} />
            <rect x="13" y="24" width="4" height="4" rx="1" fill={C.textInfo} />
        </svg>
    );
}

function Msg({ msg }) {
    if (!msg) return null;
    return <div style={S.msg(msg.type)}>{msg.text}</div>;
}

function ConfigPage({ onSave }) {
    const [url, setUrl] = useState(() => localStorage.getItem("sb_url") || ENV_URL);
    const [key, setKey] = useState(() => localStorage.getItem("sb_key") || ENV_KEY);
    return (
        <div style={S.card}>
            <p style={{ ...S.muted, marginBottom: 16 }}>Credenciais do Supabase. Ficam salvas no navegador.</p>
            <div style={{ ...S.grid2, marginBottom: 12 }}>
                <div>
                    <label style={S.label}>URL do Projeto</label>
                    <input style={S.input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxx.supabase.co" />
                </div>
                <div>
                    <label style={S.label}>Chave Anon</label>
                    <input style={S.input} value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJ..." />
                </div>
            </div>
            <button style={S.btnPrimary} onClick={() => { localStorage.setItem("sb_url", url); localStorage.setItem("sb_key", key); onSave(url, key); }}>
                Salvar e conectar
            </button>
        </div>
    );
}

function AgendaTab({ config }) {
    const [rows, setRows]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg]       = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        fetch(`${config.url}/rest/v1/v_agenda_detalhada?order=inicio.asc&status=eq.agendado`, {
            headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
        })
            .then((r) => r.json())
            .then((d) => {
                setLoading(false);
                if (Array.isArray(d)) setRows(d);
                else setMsg({ type: "error", text: d?.message ?? "Erro ao carregar agenda." });
            })
            .catch(() => { setLoading(false); setMsg({ type: "error", text: "Sem conexão com o banco." }); });
    }, [config]);

    useEffect(() => { load(); }, [load]);

    const action = async (fn, id) => {
        const res = await fetch(`${config.url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ p_agendamento_id: id }),
        }).then((r) => r.json());
        setMsg({ type: res.sucesso ? "ok" : "error", text: res.mensagem });
        if (res.sucesso) load();
    };

    const fmt = formatDateTime;
    const brl = formatCurrency;

    return (
        <div>
            <Msg msg={msg} />
            {loading ? (
                <p style={S.muted}>Carregando agenda…</p>
            ) : rows.length === 0 ? (
                <p style={S.muted}>Nenhum agendamento ativo.</p>
            ) : (
                rows.map((r) => (
                    <div key={r.id} style={S.card}>
                        <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={S.strong}>{r.cliente_nome}</span>
                            <span style={S.badge(r.status)}>{r.status}</span>
                        </div>
                        <p style={{ ...S.muted, margin: "0 0 4px" }}>{r.servico_nome} · {r.duracao_min} min · {brl(r.preco)}</p>
                        <p style={{ ...S.muted, margin: "0 0 8px" }}>{r.profissional_nome} · {fmt(r.inicio)} → {fmt(r.fim)}</p>
                        <div style={{ ...S.row, gap: 6 }}>
                            <button style={{ ...S.btnPrimary, padding: "4px 12px", fontSize: 12 }} onClick={() => action("sp_concluir_agendamento", r.id)}>Concluir</button>
                            <button style={{ ...S.btn, padding: "4px 12px", fontSize: 12, color: C.textDanger }} onClick={() => action("sp_cancelar_agendamento", r.id)}>Cancelar</button>
                        </div>
                    </div>
                ))
            )}
            <button style={{ ...S.btn, marginTop: 8 }} onClick={load}>Atualizar</button>
        </div>
    );
}

function GradeTab({ config }) {
    const [rows, setRows]     = useState([]);
    const [prof, setProf]     = useState("todos");
    const [profs, setProfs]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro]     = useState(null);

    useEffect(() => {
        fetch(`${config.url}/rest/v1/v_grade_disponibilidade?limit=1000`, {
            headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
        })
            .then((r) => r.json())
            .then((d) => {
                setLoading(false);
                if (!Array.isArray(d)) { setErro(d?.message ?? "Erro ao carregar grade."); return; }
                setRows(d);
                setProfs([...new Set(d.map((r) => r.profissional_nome))]);
            })
            .catch(() => { setLoading(false); setErro("Sem conexão com o banco."); });
    }, [config]);

    const filtered = prof === "todos" ? rows : rows.filter((r) => r.profissional_nome === prof);
    const fmt    = formatTime;
    const fmtDia = formatDate;

    const byDay = filtered.reduce((acc, r) => {
        if (!acc[r.dia]) acc[r.dia] = [];
        acc[r.dia].push(r);
        return acc;
    }, {});

    return (
        <div>
            {erro && <div style={S.msg("error")}>{erro}</div>}
            <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Profissional</label>
                <select value={prof} onChange={(e) => setProf(e.target.value)} style={{ width: 220 }}>
                    <option value="todos">Todos</option>
                    {profs.map((p) => <option key={p}>{p}</option>)}
                </select>
            </div>
            {loading ? (
                <p style={S.muted}>Carregando grade…</p>
            ) : (
                Object.entries(byDay).map(([dia, slots]) => (
                    <div key={dia} style={{ marginBottom: 20 }}>
                        <p style={{ ...S.strong, marginBottom: 8, fontSize: 14 }}>{fmtDia(dia)}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {slots.map((s, i) => (
                                <span key={i} style={{ ...S.badge(s.disponibilidade), fontSize: 11 }}>
                                    {fmt(s.inicio_slot)}{prof === "todos" ? ` · ${s.profissional_nome.split(" ")[0]}` : ""}
                                </span>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function NovoTab({ config }) {
    const empty = { p_cliente_nome: "", p_cliente_email: "", p_cliente_telefone: "", p_profissional_id: "", p_servico_id: "", p_inicio: "", p_observacao: "" };
    const [form, setForm]       = useState(empty);
    const [servicos, setServicos] = useState([]);
    const [profs, setProfs]     = useState([]);
    const [msg, setMsg]         = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${config.url}/rest/v1/v_servicos_ativos`,     { headers: { apikey: config.key, Authorization: `Bearer ${config.key}` } })
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d)) setServicos(d); else setMsg({ type: "error", text: d?.message ?? "Erro ao carregar serviços." }); })
            .catch(() => setMsg({ type: "error", text: "Sem conexão com o banco." }));

        fetch(`${config.url}/rest/v1/v_profissionais_ativos`, { headers: { apikey: config.key, Authorization: `Bearer ${config.key}` } })
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d)) setProfs(d); })
            .catch(() => {});
    }, [config]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async () => {
        setLoading(true); setMsg(null);
        const res = await fetch(`${config.url}/rest/v1/rpc/sp_agendar`, {
            method: "POST",
            headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, p_inicio: form.p_inicio ? new Date(form.p_inicio).toISOString() : null }),
        }).then((r) => r.json());
        setMsg({ type: res.sucesso ? "ok" : "error", text: res.mensagem });
        if (res.sucesso) setForm(empty);
        setLoading(false);
    };

    return (
        <div style={S.card}>
            <Msg msg={msg} />
            <div style={{ ...S.grid2, marginBottom: 12 }}>
                <div><label style={S.label}>Nome do cliente</label><input style={S.input} value={form.p_cliente_nome} onChange={set("p_cliente_nome")} /></div>
                <div><label style={S.label}>E-mail</label><input style={S.input} type="email" value={form.p_cliente_email} onChange={set("p_cliente_email")} /></div>
                <div><label style={S.label}>Telefone</label><input style={S.input} value={form.p_cliente_telefone} onChange={set("p_cliente_telefone")} /></div>
                <div><label style={S.label}>Data e hora</label><input style={S.input} type="datetime-local" value={form.p_inicio} onChange={set("p_inicio")} /></div>
                <div>
                    <label style={S.label}>Profissional</label>
                    <select style={S.input} value={form.p_profissional_id} onChange={set("p_profissional_id")}>
                        <option value="">Selecione…</option>
                        {profs.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.especialidade}</option>)}
                    </select>
                </div>
                <div>
                    <label style={S.label}>Serviço</label>
                    <select style={S.input} value={form.p_servico_id} onChange={set("p_servico_id")}>
                        <option value="">Selecione…</option>
                        {servicos.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nome} — {s.duracao_min}min — {Number(s.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Observação (opcional)</label>
                <input style={S.input} value={form.p_observacao} onChange={set("p_observacao")} />
            </div>
            <button style={S.btnPrimary} onClick={submit} disabled={loading}>
                {loading ? "Agendando…" : "Confirmar agendamento"}
            </button>
        </div>
    );
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
    const [tab, setTab] = useState("agenda");
    const [config, setConfig] = useState(() => ({
        url: localStorage.getItem("sb_url") || ENV_URL,
        key: localStorage.getItem("sb_key") || ENV_KEY,
    }));
    const [configured, setConfigured] = useState(() => {
        const url = localStorage.getItem("sb_url") || ENV_URL;
        const key = localStorage.getItem("sb_key") || ENV_KEY;
        return !!(url && key);
    });

    const tabs = [
        { id: "agenda", label: "Agenda" },
        { id: "grade",  label: "Disponibilidade" },
        { id: "novo",   label: "Novo agendamento" },
        { id: "config", label: "Configuração" },
    ];

    const onSave = (url, key) => { setConfig({ url, key }); setConfigured(true); setTab("agenda"); };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <Logo />
                <div>
                    <h1 style={S.title}>Sistema de Agendamento</h1>
                    <p style={S.subtitle}>Zero Logic Frontend · todas as regras vivem no banco</p>
                </div>
            </div>

            <div style={S.tabs}>
                {tabs.map((t) => (
                    <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
            </div>

            {tab === "config" && <ConfigPage onSave={onSave} />}

            {!configured && tab !== "config" && (
                <div style={S.card}>
                    <p style={S.muted}>Configure as credenciais do Supabase na aba <strong>Configuração</strong>.</p>
                </div>
            )}

            {configured && tab === "agenda" && <AgendaTab config={config} />}
            {configured && tab === "grade"  && <GradeTab  config={config} />}
            {configured && tab === "novo"   && <NovoTab   config={config} />}
        </div>
    );
}
