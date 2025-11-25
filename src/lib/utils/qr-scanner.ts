import jsQR from "jsqr"

export interface ScanResult {
  success: boolean
  data?: string
  error?: string
}

export async function scanQrCode(file: File): Promise<ScanResult> {
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: "Please upload an image file (PNG, JPEG, WebP)",
    }
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      success: false,
      error: "Image too large. Maximum size: 10MB",
    }
  }

  try {
    const imageData = await loadImageData(file)

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code) {
      return {
        success: true,
        data: code.data,
      }
    }

    return {
      success: false,
      error: "No QR code detected in image. Try a clearer image or different angle.",
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to scan image: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

async function loadImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        const maxDimension = 2000
        let { width, height } = img

        if (width > maxDimension || height > maxDimension) {
          const scale = Math.min(maxDimension / width, maxDimension / height)
          width = Math.floor(width * scale)
          height = Math.floor(height * scale)
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        const imageData = ctx.getImageData(0, 0, width, height)
        resolve(imageData)
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      if (event.target?.result) {
        img.src = event.target.result as string
      } else {
        reject(new Error("Failed to read file"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

export function isValidUrl(data: string): boolean {
  try {
    new URL(data)
    return true
  } catch {
    return false
  }
}

export function extractUrl(data: string): string {
  if (isValidUrl(data)) {
    return data
  }

  const urlMatch = data.match(/(https?:\/\/[^\s]+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  return data
}
