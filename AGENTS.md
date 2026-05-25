# AGENTS.md — Sistema de Agendamento

## Visão geral

Frontend React (Vite) zero-logic: toda regra de negócio vive no banco Supabase (PostgreSQL). O app consome views e stored procedures via REST API do Supabase diretamente do browser, sem backend intermediário.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Banco | Supabase (PostgreSQL) |
| Estilo | Inline styles com CSS variables |
| Build | `npm run dev` → http://localhost:5173 |

## Configuração

Credenciais em `.env` (nunca commitar):

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave_anon>
```

O app também aceita credenciais via `localStorage` (aba Configuração), que sobrescrevem o `.env` em runtime.

## Estrutura de arquivos

```
src/
  App.jsx       — componente único com toda a UI
  main.jsx      — entry point React
index.html      — root HTML
vite.config.js  — config Vite
.env            — credenciais Supabase (não commitar)
.env.example    — template sem valores reais
```

## Views esperadas no banco

O frontend consome estas views via `GET /rest/v1/<view>`:

| View | Filtros usados | Colunas esperadas |
|------|---------------|-------------------|
| `v_agenda_detalhada` | `status=eq.agendado`, `order=inicio.asc` | `id`, `cliente_nome`, `servico_nome`, `duracao_min`, `preco`, `profissional_nome`, `inicio`, `fim`, `status` |
| `v_grade_disponibilidade` | `limit=200` | `dia`, `inicio_slot`, `profissional_nome`, `disponibilidade` (`livre`/`ocupado`/`passado`) |
| `v_servicos_ativos` | — | `id`, `nome`, `duracao_min`, `preco` |
| `v_profissionais_ativos` | — | `id`, `nome`, `especialidade` |

## Stored procedures (RPCs) esperadas no banco

Chamadas via `POST /rest/v1/rpc/<fn>`. Todas devem retornar `{ sucesso: boolean, mensagem: string }`.

| Função | Parâmetros | Descrição |
|--------|-----------|-----------|
| `sp_agendar` | `p_cliente_nome`, `p_cliente_email`, `p_cliente_telefone`, `p_profissional_id`, `p_servico_id`, `p_inicio` (ISO 8601), `p_observacao` | Cria novo agendamento |
| `sp_concluir_agendamento` | `p_agendamento_id` | Muda status para `concluido` |
| `sp_cancelar_agendamento` | `p_agendamento_id` | Muda status para `cancelado` |

## Abas da interface

| Aba | Componente | Função |
|-----|-----------|--------|
| Agenda | `AgendaTab` | Lista agendamentos ativos, permite concluir/cancelar |
| Disponibilidade | `GradeTab` | Grade de slots livres/ocupados por profissional |
| Novo agendamento | `NovoTab` | Formulário para criar agendamento via `sp_agendar` |
| Configuração | `ConfigPage` | Edita credenciais Supabase salvas no localStorage |

## Regras de negócio no frontend (mínimas)

- Conversão de `datetime-local` para ISO 8601 antes de enviar ao RPC
- `configured` é `true` se `.env` ou `localStorage` tiver URL + chave válidos — o app carrega dados imediatamente sem precisar da tela de configuração

## Como adicionar uma nova aba

1. Criar componente `function MinhaTab({ config }) { ... }` em `App.jsx`
2. Adicionar `{ id: "minha", label: "Minha Aba" }` no array `tabs`
3. Adicionar `{configured && tab === "minha" && <MinhaTab config={config} />}` no return do `App`
4. Criar a view ou RPC correspondente no Supabase

## Convenções de código

- Estilos centralizados no objeto `S` — não usar CSS externo
- CSS variables (ex: `var(--color-background-info)`) para cores — compatível com temas do Claude Code / sistema
- Fetch direto via `config.url` e `config.key` dentro de cada tab — não usar o helper `sb()` global (que usa as constantes de módulo, não o estado de runtime)
- Respostas de erro da API Supabase são objetos, não arrays — sempre checar `Array.isArray(d)` antes de usar

## Comandos úteis

```bash
npm run dev      # servidor local
npm run build    # build de produção em /dist
npm run preview  # preview do build
```
