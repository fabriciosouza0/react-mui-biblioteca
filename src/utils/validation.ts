export const MAX = {
  NOME: 45,
  TITULO: 45,
  DESCRICAO: 45,
  ISBN: 13,
  TELEFONE: 20,
} as const

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function stripDigits(value: string): string {
  return value.replace(/[0-9]/g, '')
}

export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function requiredMessage(campo: string): string {
  return `Informe ${campo}`
}

export function maxLenMessage(max: number): string {
  return `Máximo de ${max} caracteres`
}

export function formatISODate(iso: string): string {
  if (!iso) return '-'
  try {
    const date = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'))
    return date.toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export function formatISODateTime(iso: string): string {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    return date.toLocaleString('pt-BR')
  } catch {
    return iso
  }
}
