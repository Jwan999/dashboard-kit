/**
 * Read a File into a base64 dataURL we can store in Pinia and persist to localStorage.
 * Restricted to image types up to ~512 KB so localStorage doesn't fill up.
 */
export function readFileAsDataUrl(file, { maxBytes = 512 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file'))
    if (!/^image\/(svg\+xml|png|jpeg|webp)$/.test(file.type)) {
      return reject(new Error('Unsupported file type. Use SVG, PNG, JPEG, or WebP.'))
    }
    if (file.size > maxBytes) {
      return reject(new Error(`File too large (max ${(maxBytes / 1024).toFixed(0)} KB).`))
    }
    const reader = new FileReader()
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result) })
    reader.onerror = () => reject(reader.error || new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}