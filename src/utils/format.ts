export const MOBILE_SYMBOL = '\u{1F4DE}\uFE0E'
export const VIDEO_SYMBOL = '\u25B6\uFE0E'

// Los puntos de la AREDL llegan multiplicados por 10.
export const formatPoints = (points: number) => {
  const value = points / 10
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}

// Versión con separadores de miles para las cifras grandes de estadísticas.
export const formatStatsPoints = (points: number) => {
  const value = points / 10
  return value.toLocaleString('es-ES', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  })
}

export const formatRecordDate = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
