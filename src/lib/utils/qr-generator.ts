import QRCode from "qrcode"

export interface QrStyleOptions {
  foregroundColor?: string
  backgroundColor?: string
}

export interface GenerateQrOptions {
  url: string
  size?: number
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  styles?: QrStyleOptions
}

export async function generateQrCodeSvg(options: GenerateQrOptions): Promise<string> {
  const { url, size = 300, errorCorrectionLevel = "M", styles = {} } = options

  const { foregroundColor = "#000000", backgroundColor = "#FFFFFF" } = styles

  try {
    const svgString = await QRCode.toString(url, {
      type: "svg",
      width: size,
      errorCorrectionLevel,
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
      margin: 2,
    })

    return svgString
  } catch (error) {
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export function validateQrOptions(options: GenerateQrOptions): {
  valid: boolean
  error?: string
} {
  const { url, styles } = options

  try {
    new URL(url)
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }

  if (styles?.foregroundColor && styles?.backgroundColor) {
    const contrast = calculateColorContrast(styles.foregroundColor, styles.backgroundColor)
    if (contrast < 3) {
      return {
        valid: false,
        error:
          "Insufficient contrast between foreground and background colors. QR code may not scan well.",
      }
    }
  }

  return { valid: true }
}

function calculateColorContrast(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
}

export function generateQrFilename(title?: string, shortCode?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10)
  const base = title || shortCode || `qr-${timestamp}`
  return `${base.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.svg`
}
