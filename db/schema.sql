-- ─── EXTENSÕES ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABELAS ──────────────────────────────────────────────────────────────────
CREATE TABLE clientes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT        NOT NULL,
  email      TEXT        UNIQUE,
  telefone   TEXT,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profissionais (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT    NOT NULL,
  especialidade TEXT,
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE servicos (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT           NOT NULL,
  duracao_min INTEGER        NOT NULL,
  preco       NUMERIC(10,2)  NOT NULL,
  ativo       BOOLEAN        DEFAULT TRUE
);

CREATE TABLE agendamentos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID        NOT NULL REFERENCES clientes(id),
  profissional_id UUID        NOT NULL REFERENCES profissionais(id),
  servico_id      UUID        NOT NULL REFERENCES servicos(id),
  inicio          TIMESTAMPTZ NOT NULL,
  fim             TIMESTAMPTZ NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'agendado'
                              CHECK (status IN ('agendado','concluido','cancelado')),
  observacao      TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VIEWS ────────────────────────────────────────────────────────────────────
CREATE VIEW v_agenda_detalhada AS
SELECT
  a.id,
  c.nome        AS cliente_nome,
  c.email       AS cliente_email,
  c.telefone    AS cliente_telefone,
  p.nome        AS profissional_nome,
  s.nome        AS servico_nome,
  s.duracao_min,
  s.preco,
  a.inicio,
  a.fim,
  a.status,
  a.observacao,
  a.criado_em
FROM agendamentos a
JOIN clientes      c ON c.id = a.cliente_id
JOIN profissionais p ON p.id = a.profissional_id
JOIN servicos      s ON s.id = a.servico_id;

CREATE VIEW v_servicos_ativos AS
SELECT id, nome, duracao_min, preco
FROM servicos
WHERE ativo = TRUE
ORDER BY nome;

CREATE VIEW v_profissionais_ativos AS
SELECT id, nome, especialidade
FROM profissionais
WHERE ativo = TRUE
ORDER BY nome;

-- Grade de disponibilidade: slots de 30 min nos próximos 7 dias (08:00–18:00)
CREATE VIEW v_grade_disponibilidade AS
SELECT
  p.id              AS profissional_id,
  p.nome            AS profissional_nome,
  slot::DATE        AS dia,
  slot              AS inicio_slot,
  slot + INTERVAL '30 min' AS fim_slot,
  CASE
    WHEN slot < NOW() THEN 'passado'
    WHEN EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.profissional_id = p.id
        AND a.status = 'agendado'
        AND a.inicio < slot + INTERVAL '30 min'
        AND a.fim    > slot
    ) THEN 'ocupado'
    ELSE 'livre'
  END AS disponibilidade
FROM profissionais p
CROSS JOIN generate_series(
  date_trunc('day', NOW()) + INTERVAL '8 hours',
  date_trunc('day', NOW()) + INTERVAL '7 days' + INTERVAL '17 hours 30 min',
  INTERVAL '30 min'
) AS slot
WHERE p.ativo = TRUE
  AND EXTRACT(HOUR FROM slot) BETWEEN 8 AND 17
ORDER BY slot, p.nome;

-- ─── FUNÇÕES ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_agendar(
  p_cliente_nome      TEXT,
  p_cliente_email     TEXT,
  p_cliente_telefone  TEXT,
  p_profissional_id   UUID,
  p_servico_id        UUID,
  p_inicio            TIMESTAMPTZ,
  p_observacao        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql AS $$
DECLARE
  v_cliente_id  UUID;
  v_duracao     INTEGER;
  v_fim         TIMESTAMPTZ;
  v_conflito    BOOLEAN;
BEGIN
  -- upsert cliente
  INSERT INTO clientes (nome, email, telefone)
  VALUES (p_cliente_nome, p_cliente_email, p_cliente_telefone)
  ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, telefone = EXCLUDED.telefone
  RETURNING id INTO v_cliente_id;

  -- duração do serviço
  SELECT duracao_min INTO v_duracao FROM servicos WHERE id = p_servico_id;
  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Serviço não encontrado.');
  END IF;

  v_fim := p_inicio + (v_duracao || ' minutes')::INTERVAL;

  -- verifica conflito
  SELECT EXISTS (
    SELECT 1 FROM agendamentos
    WHERE profissional_id = p_profissional_id
      AND status = 'agendado'
      AND inicio < v_fim
      AND fim    > p_inicio
  ) INTO v_conflito;

  IF v_conflito THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Horário indisponível para esse profissional.');
  END IF;

  INSERT INTO agendamentos (cliente_id, profissional_id, servico_id, inicio, fim, observacao)
  VALUES (v_cliente_id, p_profissional_id, p_servico_id, p_inicio, v_fim, p_observacao);

  RETURN json_build_object('sucesso', TRUE, 'mensagem', 'Agendamento confirmado!');
END;
$$;

CREATE OR REPLACE FUNCTION sp_concluir_agendamento(p_agendamento_id UUID)
RETURNS JSON
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE agendamentos SET status = 'concluido'
  WHERE id = p_agendamento_id AND status = 'agendado';

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Agendamento não encontrado ou já finalizado.');
  END IF;

  RETURN json_build_object('sucesso', TRUE, 'mensagem', 'Agendamento concluído.');
END;
$$;

CREATE OR REPLACE FUNCTION sp_cancelar_agendamento(p_agendamento_id UUID)
RETURNS JSON
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE agendamentos SET status = 'cancelado'
  WHERE id = p_agendamento_id AND status = 'agendado';

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Agendamento não encontrado ou já finalizado.');
  END IF;

  RETURN json_build_object('sucesso', TRUE, 'mensagem', 'Agendamento cancelado.');
END;
$$;

-- ─── DADOS DE EXEMPLO ─────────────────────────────────────────────────────────
INSERT INTO profissionais (nome, especialidade) VALUES
  ('Ana Lima',    'Cabelo'),
  ('Carlos Melo', 'Estética'),
  ('Bia Souza',   'Nail Designer');

INSERT INTO servicos (nome, duracao_min, preco) VALUES
  ('Corte Feminino',   60, 80.00),
  ('Coloração',       120, 180.00),
  ('Manicure',         45, 40.00),
  ('Limpeza de Pele',  60, 120.00),
  ('Escova',           45, 60.00);
