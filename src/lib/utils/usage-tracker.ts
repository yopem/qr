export const GUEST_GENERATION_LIMIT = 10
export const GUEST_SCAN_LIMIT = 10

export function getGenerationCount(): number {
  if (typeof window === "undefined") return 0
  const count = localStorage.getItem("guest_qr_generations")
  return count ? parseInt(count, 10) : 0
}

export function incrementGeneration(): void {
  if (typeof window === "undefined") return
  const current = getGenerationCount()
  localStorage.setItem("guest_qr_generations", String(current + 1))
}

export function canGenerate(): boolean {
  return getGenerationCount() < GUEST_GENERATION_LIMIT
}

export function getRemainingGenerations(): number {
  return Math.max(0, GUEST_GENERATION_LIMIT - getGenerationCount())
}

export function getScanCount(): number {
  if (typeof window === "undefined") return 0
  const count = localStorage.getItem("guest_qr_scans")
  return count ? parseInt(count, 10) : 0
}

export function incrementScan(): void {
  if (typeof window === "undefined") return
  const current = getScanCount()
  localStorage.setItem("guest_qr_scans", String(current + 1))
}

export function canScan(): boolean {
  return getScanCount() < GUEST_SCAN_LIMIT
}

export function getRemainingScans(): number {
  return Math.max(0, GUEST_SCAN_LIMIT - getScanCount())
}

export function clearUsage(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("guest_qr_generations")
  localStorage.removeItem("guest_qr_scans")
}

export function shouldShowUpgradePrompt(): boolean {
  const genCount = getGenerationCount()
  const scanCount = getScanCount()

  return (
    genCount >= Math.floor(GUEST_GENERATION_LIMIT / 2) ||
    scanCount >= Math.floor(GUEST_SCAN_LIMIT / 2)
  )
}
