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

    if (!svgString || svgString.length === 0) {
      throw new Error("QR code generation produced empty result")
    }

    return svgString
  } catch (error) {
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Validates QR code options and normalizes URLs
 *
 * Supports multiple URL formats:
 * - Standard URLs: http://, https://
 * - Email: mailto:user@example.com
 * - Phone: tel:+1234567890
 * - SMS: sms:+1234567890?body=message
 * - WiFi: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;;
 * - Other: geo:, whatsapp:, skype:, ftp://, ftps://
 *
 * @param options - QR generation options including URL and styles
 * @returns Validation result with normalized URL if valid
 */
export function validateQrOptions(options: GenerateQrOptions): {
  valid: boolean
  error?: string
  normalizedUrl?: string
} {
  const { url, styles } = options

  let normalizedUrl = url.trim()

  const supportedSchemes = [
    "http://",
    "https://",
    "mailto:",
    "tel:",
    "sms:",
    "geo:",
    "wifi:",
    "WIFI:",
    "whatsapp:",
    "skype:",
    "ftp://",
    "ftps://",
  ]

  const hasScheme = supportedSchemes.some((scheme) =>
    normalizedUrl.toLowerCase().startsWith(scheme.toLowerCase()),
  )

  if (!hasScheme && normalizedUrl.length > 0) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  if (!normalizedUrl.toUpperCase().startsWith("WIFI:")) {
    try {
      new URL(normalizedUrl)
    } catch {
      return { valid: false, error: "Invalid URL format" }
    }
  } else {
    const wifiPattern = /^WIFI:[ST]:[^;]*;.*;;$/i
    if (!wifiPattern.test(normalizedUrl)) {
      return {
        valid: false,
        error: "Invalid WiFi format. Use: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;;",
      }
    }
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

  return { valid: true, normalizedUrl }
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
