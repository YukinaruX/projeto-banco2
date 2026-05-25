import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const AGENDAMENTO = {
    id: '1',
    cliente_nome: 'Maria Silva',
    status: 'agendado',
    servico_nome: 'Manicure',
    duracao_min: 45,
    preco: 40,
    profissional_nome: 'Ana Lima',
    inicio: '2025-05-25T10:00:00.000Z',
    fim: '2025-05-25T10:45:00.000Z',
}

function stubFetch(data) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => data }))
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

// ─── AGENDA ───────────────────────────────────────────────────────────────────
describe('Agenda', () => {
    it('exibe "Carregando agenda…" enquanto busca', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
        render(<App />)
        expect(screen.getByText('Carregando agenda…')).toBeInTheDocument()
    })

    it('exibe "Nenhum agendamento ativo." quando lista vazia', async () => {
        stubFetch([])
        render(<App />)
        await waitFor(() => expect(screen.getByText('Nenhum agendamento ativo.')).toBeInTheDocument())
    })

    it('renderiza nome, serviço e profissional do agendamento', async () => {
        stubFetch([AGENDAMENTO])
        render(<App />)
        await waitFor(() => expect(screen.getByText('Maria Silva')).toBeInTheDocument())
        expect(screen.getByText(/Manicure/)).toBeInTheDocument()
        expect(screen.getByText(/Ana Lima/)).toBeInTheDocument()
        expect(screen.getByText(/45 min/)).toBeInTheDocument()
    })

    it('busca com filtro status=eq.agendado', async () => {
        const spy = vi.fn().mockResolvedValue({ json: () => [] })
        vi.stubGlobal('fetch', spy)
        render(<App />)
        await waitFor(() => expect(spy).toHaveBeenCalled())
        expect(spy.mock.calls[0][0]).toContain('status=eq.agendado')
    })

    it('envia apikey e Authorization nos headers', async () => {
        const spy = vi.fn().mockResolvedValue({ json: () => [] })
        vi.stubGlobal('fetch', spy)
        render(<App />)
        await waitFor(() => expect(spy).toHaveBeenCalled())
        const headers = spy.mock.calls[0][1].headers
        expect(headers.apikey).toBe('test-key')
        expect(headers.Authorization).toBe('Bearer test-key')
    })

    it('exibe erro quando API retorna objeto em vez de array', async () => {
        stubFetch({ message: 'relation does not exist' })
        render(<App />)
        await waitFor(() => expect(screen.getByText(/relation does not exist/)).toBeInTheDocument())
    })

    it('chama sp_concluir_agendamento com ID correto', async () => {
        const user = userEvent.setup()
        const spy = vi.fn()
            .mockResolvedValueOnce({ json: () => [AGENDAMENTO] })
            .mockResolvedValue({ json: () => ({ sucesso: true, mensagem: 'Agendamento concluído.' }) })
        vi.stubGlobal('fetch', spy)
        render(<App />)
        await waitFor(() => screen.getByText('Concluir'))
        await user.click(screen.getByText('Concluir'))
        const call = spy.mock.calls.find(c => c[0].includes('sp_concluir_agendamento'))
        expect(call).toBeDefined()
        expect(JSON.parse(call[1].body)).toEqual({ p_agendamento_id: '1' })
    })

    it('chama sp_cancelar_agendamento com ID correto', async () => {
        const user = userEvent.setup()
        const spy = vi.fn()
            .mockResolvedValueOnce({ json: () => [AGENDAMENTO] })
            .mockResolvedValue({ json: () => ({ sucesso: true, mensagem: 'Agendamento cancelado.' }) })
        vi.stubGlobal('fetch', spy)
        render(<App />)
        await waitFor(() => screen.getByText('Cancelar'))
        await user.click(screen.getByText('Cancelar'))
        const call = spy.mock.calls.find(c => c[0].includes('sp_cancelar_agendamento'))
        expect(call).toBeDefined()
        expect(JSON.parse(call[1].body)).toEqual({ p_agendamento_id: '1' })
    })

    it('exibe mensagem de sucesso após concluir', async () => {
        const user = userEvent.setup()
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ json: () => [AGENDAMENTO] })                                    // carga inicial
            .mockResolvedValueOnce({ json: () => ({ sucesso: true, mensagem: 'Agendamento concluído.' }) }) // RPC
            .mockResolvedValueOnce({ json: () => [] })                                               // reload após sucesso
        )
        render(<App />)
        await waitFor(() => screen.getByText('Concluir'))
        await user.click(screen.getByText('Concluir'))
        await waitFor(() => expect(screen.getByText('Agendamento concluído.')).toBeInTheDocument())
    })
})

// ─── NOVO AGENDAMENTO ─────────────────────────────────────────────────────────
describe('Novo agendamento', () => {
    it('renderiza labels do formulário', async () => {
        const user = userEvent.setup()
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => [] }))
        render(<App />)
        await user.click(screen.getByText('Novo agendamento'))
        await waitFor(() => expect(screen.getByText('Nome do cliente')).toBeInTheDocument())
        expect(screen.getByText('E-mail')).toBeInTheDocument()
        expect(screen.getByText('Telefone')).toBeInTheDocument()
        expect(screen.getByText('Data e hora')).toBeInTheDocument()
        expect(screen.getByText('Profissional')).toBeInTheDocument()
        expect(screen.getByText('Serviço')).toBeInTheDocument()
    })

    it('chama sp_agendar ao confirmar', async () => {
        const user = userEvent.setup()
        const spy = vi.fn().mockResolvedValue({ json: () => ({ sucesso: true, mensagem: 'Agendamento confirmado!' }) })
        vi.stubGlobal('fetch', spy)
        render(<App />)
        await user.click(screen.getByText('Novo agendamento'))
        await waitFor(() => screen.getByText('Confirmar agendamento'))
        await user.click(screen.getByText('Confirmar agendamento'))
        await waitFor(() => {
            const call = spy.mock.calls.find(c => c[0].includes('sp_agendar'))
            expect(call).toBeDefined()
        })
    })

    it('exibe mensagem de sucesso após agendar', async () => {
        const user = userEvent.setup()
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ json: () => [] })   // agenda inicial
            .mockResolvedValueOnce({ json: () => [] })   // servicos
            .mockResolvedValueOnce({ json: () => [] })   // profissionais
            .mockResolvedValue({ json: () => ({ sucesso: true, mensagem: 'Agendamento confirmado!' }) })
        )
        render(<App />)
        await user.click(screen.getByText('Novo agendamento'))
        await waitFor(() => screen.getByText('Confirmar agendamento'))
        await user.click(screen.getByText('Confirmar agendamento'))
        await waitFor(() => expect(screen.getByText('Agendamento confirmado!')).toBeInTheDocument())
    })

    it('exibe mensagem de erro da API', async () => {
        const user = userEvent.setup()
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ json: () => [] })
            .mockResolvedValueOnce({ json: () => [] })
            .mockResolvedValueOnce({ json: () => [] })
            .mockResolvedValue({ json: () => ({ sucesso: false, mensagem: 'Horário indisponível para esse profissional.' }) })
        )
        render(<App />)
        await user.click(screen.getByText('Novo agendamento'))
        await waitFor(() => screen.getByText('Confirmar agendamento'))
        await user.click(screen.getByText('Confirmar agendamento'))
        await waitFor(() => expect(screen.getByText('Horário indisponível para esse profissional.')).toBeInTheDocument())
    })
})
