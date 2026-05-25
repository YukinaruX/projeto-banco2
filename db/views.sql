-- ─── VIEWS ────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_agenda_detalhada CASCADE;
CREATE VIEW public.v_agenda_detalhada AS
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
  a.observacao
FROM agendamentos a
JOIN clientes      c ON c.id = a.cliente_id
JOIN profissionais p ON p.id = a.profissional_id
JOIN servicos      s ON s.id = a.servico_id;

DROP VIEW IF EXISTS public.v_servicos_ativos CASCADE;
CREATE VIEW public.v_servicos_ativos AS
SELECT id, nome, duracao_min, preco
FROM servicos
WHERE ativo = TRUE
ORDER BY nome;

DROP VIEW IF EXISTS public.v_profissionais_ativos CASCADE;
CREATE VIEW public.v_profissionais_ativos AS
SELECT id, nome, especialidade
FROM profissionais
WHERE ativo = TRUE
ORDER BY nome;

-- Grade de disponibilidade: slots de 30 min nos próximos 7 dias (08:00–18:00)
DROP VIEW IF EXISTS public.v_grade_disponibilidade CASCADE;
CREATE VIEW public.v_grade_disponibilidade AS
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
DROP FUNCTION IF EXISTS public.sp_agendar CASCADE;
DROP FUNCTION IF EXISTS public.sp_concluir_agendamento CASCADE;
DROP FUNCTION IF EXISTS public.sp_cancelar_agendamento CASCADE;

CREATE OR REPLACE FUNCTION public.sp_agendar(
  p_cliente_nome      TEXT,
  p_cliente_email     TEXT,
  p_cliente_telefone  TEXT,
  p_profissional_id   UUID,
  p_servico_id        UUID,
  p_inicio            TIMESTAMPTZ,
  p_observacao        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente_id UUID;
  v_duracao    INTEGER;
  v_fim        TIMESTAMPTZ;
  v_conflito   BOOLEAN;
BEGIN
  INSERT INTO clientes (nome, email, telefone)
  VALUES (p_cliente_nome, p_cliente_email, p_cliente_telefone)
  ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, telefone = EXCLUDED.telefone
  RETURNING id INTO v_cliente_id;

  SELECT duracao_min INTO v_duracao FROM servicos WHERE id = p_servico_id;
  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Serviço não encontrado.');
  END IF;

  v_fim := p_inicio + (v_duracao || ' minutes')::INTERVAL;

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

CREATE OR REPLACE FUNCTION public.sp_concluir_agendamento(p_agendamento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agendamentos SET status = 'concluido'
  WHERE id = p_agendamento_id AND status = 'agendado';

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Agendamento não encontrado ou já finalizado.');
  END IF;

  RETURN json_build_object('sucesso', TRUE, 'mensagem', 'Agendamento concluído.');
END;
$$;

CREATE OR REPLACE FUNCTION public.sp_cancelar_agendamento(p_agendamento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agendamentos SET status = 'cancelado'
  WHERE id = p_agendamento_id AND status = 'agendado';

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', FALSE, 'mensagem', 'Agendamento não encontrado ou já finalizado.');
  END IF;

  RETURN json_build_object('sucesso', TRUE, 'mensagem', 'Agendamento cancelado.');
END;
$$;

-- ─── PERMISSÕES (anon role para o REST API funcionar) ─────────────────────────
GRANT SELECT ON public.v_agenda_detalhada       TO anon, authenticated;
GRANT SELECT ON public.v_servicos_ativos        TO anon, authenticated;
GRANT SELECT ON public.v_profissionais_ativos   TO anon, authenticated;
GRANT SELECT ON public.v_grade_disponibilidade  TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sp_agendar             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sp_concluir_agendamento TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sp_cancelar_agendamento TO anon, authenticated;
