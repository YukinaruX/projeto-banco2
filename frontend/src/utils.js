export const C = {
    textPrimary:   "#111827",
    textSecondary: "#6B7280",
    textTertiary:  "#9CA3AF",
    textInfo:      "#1D4ED8",
    textSuccess:   "#15803D",
    textDanger:    "#DC2626",
    bgPrimary:     "#FFFFFF",
    bgSecondary:   "#F3F4F6",
    bgInfo:        "#EFF6FF",
    bgSuccess:     "#F0FDF4",
    bgDanger:      "#FEF2F2",
    borderLight:   "#E5E7EB",
    borderMid:     "#D1D5DB",
    borderInfo:    "#BFDBFE",
    radiusMd:      "6px",
    radiusLg:      "10px",
}

export const formatDateTime = (ts) =>
    new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

export const formatCurrency = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

export const formatDate = (d) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })

export const badgeStyle = (status) => {
    const map = {
        agendado:  { bg: C.bgInfo,      fg: C.textInfo      },
        concluido: { bg: C.bgSuccess,   fg: C.textSuccess   },
        cancelado: { bg: C.bgDanger,    fg: C.textDanger    },
        livre:     { bg: C.bgSuccess,   fg: C.textSuccess   },
        ocupado:   { bg: C.bgDanger,    fg: C.textDanger    },
        bloqueado: { bg: C.bgSecondary, fg: C.textSecondary },
        passado:   { bg: C.bgSecondary, fg: C.textTertiary  },
    }
    const col = map[status] ?? map.passado
    return {
        display:      "inline-block",
        padding:      "2px 10px",
        borderRadius: C.radiusMd,
        fontSize:     12,
        fontWeight:   500,
        background:   col.bg,
        color:        col.fg,
    }
}
