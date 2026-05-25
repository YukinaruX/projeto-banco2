import { describe, it, expect } from 'vitest'
import { C, formatDateTime, formatCurrency, formatTime, formatDate, badgeStyle } from './utils'

describe('formatCurrency', () => {
    it('formata inteiro para BRL', () => {
        expect(formatCurrency(50)).toMatch(/R\$/)
        expect(formatCurrency(50)).toContain('50')
    })
    it('formata zero', () => {
        expect(formatCurrency(0)).toMatch(/0/)
    })
    it('formata decimal', () => {
        expect(formatCurrency(99.99)).toContain('99')
    })
    it('formata valor alto', () => {
        expect(formatCurrency(1000)).toMatch(/R\$/)
    })
})

describe('formatDateTime', () => {
    it('retorna DD/MM e HH:MM', () => {
        const result = formatDateTime('2025-05-25T10:00:00.000Z')
        expect(result).toMatch(/\d{2}\/\d{2}/)
        expect(result).toMatch(/\d{2}:\d{2}/)
    })
})

describe('formatTime', () => {
    it('retorna apenas HH:MM', () => {
        expect(formatTime('2025-05-25T14:30:00.000Z')).toMatch(/\d{2}:\d{2}/)
    })
})

describe('formatDate', () => {
    it('retorna data com dia da semana', () => {
        const result = formatDate('2025-05-25')
        expect(result).toMatch(/\d{2}\/\d{2}/)
    })
})

describe('badgeStyle', () => {
    it('agendado → azul', () => {
        const s = badgeStyle('agendado')
        expect(s.background).toBe(C.bgInfo)
        expect(s.color).toBe(C.textInfo)
    })
    it('concluido → verde', () => {
        const s = badgeStyle('concluido')
        expect(s.background).toBe(C.bgSuccess)
        expect(s.color).toBe(C.textSuccess)
    })
    it('cancelado → vermelho', () => {
        const s = badgeStyle('cancelado')
        expect(s.background).toBe(C.bgDanger)
        expect(s.color).toBe(C.textDanger)
    })
    it('livre → verde', () => {
        expect(badgeStyle('livre').background).toBe(C.bgSuccess)
    })
    it('ocupado → vermelho', () => {
        expect(badgeStyle('ocupado').background).toBe(C.bgDanger)
    })
    it('status desconhecido → cinza (fallback passado)', () => {
        expect(badgeStyle('qualquer').background).toBe(C.bgSecondary)
    })
    it('retorna inline-block com fontWeight 500', () => {
        const s = badgeStyle('agendado')
        expect(s.display).toBe('inline-block')
        expect(s.fontWeight).toBe(500)
    })
})
