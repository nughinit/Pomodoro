export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${pad(minutes)}:${pad(seconds)}`
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}
