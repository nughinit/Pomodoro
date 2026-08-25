export function parseOptionalTimeField(raw: string): string | null {
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}

export function parseOptionalDurationField(raw: string): number | null {
  const trimmed = raw.trim()
  return trimmed === '' ? null : Number(trimmed)
}
