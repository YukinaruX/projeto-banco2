-- ============================================================
-- PROJETO FINAL — BANCO DE DADOS II
-- Disciplina : Banco de Dados II
-- Professora : Soraya Torres
-- Sistema    : Agendamentos de Serviços
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PARTE 1 — ESTRUTURA BÁSICA DO BANCO
-- ============================================================

-- Clientes: identificador único, nome completo e telefone
CREATE TABLE clientes (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome     TEXT NOT NULL,
    telefone TEXT NOT NULL
);

-- Profissionais: identificador único, nome completo e especialidade
CREATE TABLE profissionais (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          TEXT NOT NULL,
    especialidade TEXT NOT NULL
);

-- Serviços: identificador único, nome e valor (preço)
-- PARTE 2: CHECK impede preço negativo ou zero
CREATE TABLE servicos (
    id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nome  TEXT          NOT NULL,
    preco NUMERIC(10,2) NOT NULL CHECK (preco > 0)
);

-- Tabela de auditoria (criada antes de agendamentos — Parte 6)
CREATE TABLE agendamentos_auditoria (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID        NOT NULL,
    tipo_acao      TEXT        NOT NULL CHECK (tipo_acao IN ('INSERT', 'UPDATE')),
    data_evento    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agendamentos: vínculo entre cliente, profissional e serviço
-- PARTE 2: PKs, FKs, NOT NULL e CHECK no status
CREATE TABLE agendamentos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id      UUID        NOT NULL REFERENCES clientes(id),
    profissional_id UUID        NOT NULL REFERENCES profissionais(id),
    servico_id      UUID        NOT NULL REFERENCES servicos(id),
    data_hora       TIMESTAMPTZ NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'Agendado'
                                CHECK (status IN ('Agendado', 'Confirmado', 'Cancelado', 'Realizado'))
);

-- ============================================================
-- PARTE 4 — FUNCTION OBRIGATÓRIA: Verificar Disponibilidade
-- Recebe: profissional_id e data/hora proposta
-- Retorna: TRUE se disponível, FALSE se ocupado
-- ============================================================

CREATE OR REPLACE FUNCTION fn_verificar_disponibilidade(
    p_profissional_id UUID,
    p_data_hora       TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
    v_conflito BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM agendamentos
        WHERE profissional_id = p_profissional_id
          AND status NOT IN ('Cancelado')
          AND data_hora = p_data_hora
    ) INTO v_conflito;

    RETURN NOT v_conflito;
END;
$$;

-- ============================================================
-- PARTE 3 — PROCEDURE OBRIGATÓRIA: Realizar Agendamento
-- Invoca fn_verificar_disponibilidade (Parte 4).
-- Se não houver conflito, efetiva a inserção do registro.
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_realizar_agendamento(
    IN    p_cliente_id      UUID,
    IN    p_profissional_id UUID,
    IN    p_servico_id      UUID,
    IN    p_data_hora       TIMESTAMPTZ,
    INOUT p_resultado       TEXT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_disponivel BOOLEAN;
BEGIN
    -- Invoca a function de validação de horário (Parte 4)
    v_disponivel := fn_verificar_disponibilidade(p_profissional_id, p_data_hora);

    IF NOT v_disponivel THEN
        p_resultado := 'ERRO: Horário indisponível — o profissional já possui agendamento nesse período.';
        RETURN;
    END IF;

    INSERT INTO agendamentos (cliente_id, profissional_id, servico_id, data_hora)
    VALUES (p_cliente_id, p_profissional_id, p_servico_id, p_data_hora);

    p_resultado := 'OK: Agendamento realizado com sucesso.';
END;
$$;

-- ============================================================
-- PARTE 5 — VIEW OBRIGATÓRIA: Agenda Completa
-- Unifica cliente, profissional, serviço, valor, data/hora e status,
-- abstraindo IDs e simplificando o consumo pelo frontend.
-- ============================================================

CREATE VIEW v_agenda_completa AS
SELECT
    c.nome        AS cliente,
    c.telefone,
    p.nome        AS profissional,
    p.especialidade,
    s.nome        AS servico,
    s.preco,
    a.data_hora,
    a.status
FROM agendamentos a
JOIN clientes      c ON c.id = a.cliente_id
JOIN profissionais p ON p.id = a.profissional_id
JOIN servicos      s ON s.id = a.servico_id;

-- ============================================================
-- PARTE 6 — TRIGGER OBRIGATÓRIA: Auditoria de Agendamentos
-- Qualquer INSERT ou UPDATE em agendamentos grava um registro
-- histórico em agendamentos_auditoria.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_auditar_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO agendamentos_auditoria (agendamento_id, tipo_acao)
    VALUES (NEW.id, TG_OP);
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_auditoria_agendamentos
AFTER INSERT OR UPDATE ON agendamentos
FOR EACH ROW EXECUTE FUNCTION fn_auditar_agendamento();

-- ============================================================
-- PARTE 8 — CARGA DE DADOS DE TESTE
-- IDs fixos para facilitar referência nos blocos de teste.
-- ============================================================

-- Profissionais
INSERT INTO profissionais (id, nome, especialidade) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Ana Lima',        'Clínica Geral'),
    ('10000000-0000-0000-0000-000000000002', 'Carlos Melo',     'Dermatologia'),
    ('10000000-0000-0000-0000-000000000003', 'Beatriz Souza',   'Fisioterapia'),
    ('10000000-0000-0000-0000-000000000004', 'Rafael Nunes',    'Odontologia');

-- Serviços
INSERT INTO servicos (id, nome, preco) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Consulta Clínica',         150.00),
    ('20000000-0000-0000-0000-000000000002', 'Avaliação Dermatológica',  200.00),
    ('20000000-0000-0000-0000-000000000003', 'Sessão de Fisioterapia',   120.00),
    ('20000000-0000-0000-0000-000000000004', 'Limpeza Dental',           180.00),
    ('20000000-0000-0000-0000-000000000005', 'Retorno / Acompanhamento',  80.00);

-- Clientes
INSERT INTO clientes (id, nome, telefone) VALUES
    ('30000000-0000-0000-0000-000000000001', 'João Silva',      '(11) 99999-1111'),
    ('30000000-0000-0000-0000-000000000002', 'Maria Oliveira',  '(11) 99999-2222'),
    ('30000000-0000-0000-0000-000000000003', 'Pedro Santos',    '(11) 99999-3333'),
    ('30000000-0000-0000-0000-000000000004', 'Carla Mendes',    '(11) 99999-4444'),
    ('30000000-0000-0000-0000-000000000005', 'Lucas Ferreira',  '(11) 99999-5555');

-- ─── Cenários de SUCESSO — procedure registra os agendamentos ────────────────
DO $$
DECLARE v_res TEXT;
BEGIN
    -- [1] João → Ana Lima → Consulta Clínica → 01/06 09:00
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000001'::UUID,
        '10000000-0000-0000-0000-000000000001'::UUID,
        '20000000-0000-0000-0000-000000000001'::UUID,
        '2026-06-01 09:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[1] %', v_res;

    -- [2] Maria → Carlos Melo → Avaliação Dermatológica → 01/06 10:00
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000002'::UUID,
        '10000000-0000-0000-0000-000000000002'::UUID,
        '20000000-0000-0000-0000-000000000002'::UUID,
        '2026-06-01 10:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[2] %', v_res;

    -- [3] Pedro → Beatriz Souza → Fisioterapia → 02/06 08:00
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000003'::UUID,
        '10000000-0000-0000-0000-000000000003'::UUID,
        '20000000-0000-0000-0000-000000000003'::UUID,
        '2026-06-02 08:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[3] %', v_res;

    -- [4] Carla → Ana Lima → Retorno → 03/06 14:00
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000004'::UUID,
        '10000000-0000-0000-0000-000000000001'::UUID,
        '20000000-0000-0000-0000-000000000005'::UUID,
        '2026-06-03 14:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[4] %', v_res;

    -- [5] Lucas → Rafael Nunes → Limpeza Dental → 04/06 11:00
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000005'::UUID,
        '10000000-0000-0000-0000-000000000004'::UUID,
        '20000000-0000-0000-0000-000000000004'::UUID,
        '2026-06-04 11:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[5] %', v_res;

    -- [6] Maria → Ana Lima → Retorno → 05/06 09:00
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000002'::UUID,
        '10000000-0000-0000-0000-000000000001'::UUID,
        '20000000-0000-0000-0000-000000000005'::UUID,
        '2026-06-05 09:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[6] %', v_res;
END;
$$;

-- ─── Cenários de FALHA — bloqueio de horário pela procedure/function ──────────
DO $$
DECLARE v_res TEXT;
BEGIN
    -- [FALHA] Tentativa de agendar Ana Lima em 01/06 09:00 — horário já ocupado pelo João
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000002'::UUID,
        '10000000-0000-0000-0000-000000000001'::UUID,
        '20000000-0000-0000-0000-000000000005'::UUID,
        '2026-06-01 09:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[FALHA ESPERADA — conflito de horário] %', v_res;

    -- [FALHA] Tentativa de agendar Carlos Melo em 01/06 10:00 — horário já ocupado pela Maria
    CALL sp_realizar_agendamento(
        '30000000-0000-0000-0000-000000000003'::UUID,
        '10000000-0000-0000-0000-000000000002'::UUID,
        '20000000-0000-0000-0000-000000000001'::UUID,
        '2026-06-01 10:00:00-03'::TIMESTAMPTZ,
        v_res
    );
    RAISE NOTICE '[FALHA ESPERADA — conflito de horário] %', v_res;
END;
$$;

-- ─── UPDATEs de status — geram registros de UPDATE na tabela de auditoria ─────

UPDATE agendamentos
SET status = 'Confirmado'
WHERE cliente_id = '30000000-0000-0000-0000-000000000001';   -- João confirmado

UPDATE agendamentos
SET status = 'Realizado'
WHERE cliente_id = '30000000-0000-0000-0000-000000000003';   -- Pedro realizado

UPDATE agendamentos
SET status = 'Cancelado'
WHERE cliente_id = '30000000-0000-0000-0000-000000000005';   -- Lucas cancelado

-- ============================================================
-- PARTE 7 — CONSULTAS SQL DE DEMONSTRAÇÃO
-- Uso de JOIN, GROUP BY, ORDER BY e funções agregadas.
-- ============================================================

-- Consulta 1: Total de agendamentos por profissional
-- (LEFT JOIN + COUNT + GROUP BY + ORDER BY)
SELECT
    p.nome                AS profissional,
    p.especialidade,
    COUNT(a.id)           AS total_agendamentos
FROM profissionais p
LEFT JOIN agendamentos a ON a.profissional_id = p.id
GROUP BY p.nome, p.especialidade
ORDER BY total_agendamentos DESC;

-- Consulta 2: Receita gerada por serviço (agendamentos ativos ou realizados)
-- (JOIN + SUM + COUNT + GROUP BY + ORDER BY)
SELECT
    s.nome                AS servico,
    COUNT(a.id)           AS qtd_agendamentos,
    SUM(s.preco)          AS receita_total
FROM servicos s
JOIN agendamentos a ON a.servico_id = s.id
WHERE a.status IN ('Agendado', 'Confirmado', 'Realizado')
GROUP BY s.nome
ORDER BY receita_total DESC;

-- Consulta 3: Agenda completa via VIEW — apenas agendamentos ativos, ordenados por data
-- (VIEW + WHERE + ORDER BY)
SELECT *
FROM v_agenda_completa
WHERE status IN ('Agendado', 'Confirmado')
ORDER BY data_hora ASC;

-- Consulta 4: Histórico de auditoria com detalhes do agendamento
-- (JOIN múltiplo + ORDER BY)
SELECT
    aa.data_evento,
    aa.tipo_acao,
    c.nome                AS cliente,
    p.nome                AS profissional,
    s.nome                AS servico,
    a.status              AS status_atual
FROM agendamentos_auditoria aa
JOIN agendamentos   a  ON a.id  = aa.agendamento_id
JOIN clientes       c  ON c.id  = a.cliente_id
JOIN profissionais  p  ON p.id  = a.profissional_id
JOIN servicos       s  ON s.id  = a.servico_id
ORDER BY aa.data_evento ASC;
