import { api } from './api'

/**
 * Download PDF or CSV report; surfaces API JSON errors when export fails.
 */
export async function downloadReport(type, format) {
  const res = await api.get('/api/reports/export', {
    params: { type, format },
    responseType: 'blob',
    validateStatus: (s) => s < 500,
  })

  const blob = res.data
  const contentType = res.headers['content-type'] || ''

  if (res.status >= 400 || contentType.includes('application/json')) {
    const text = await blob.text()
    let message = 'Export failed'
    try {
      const json = JSON.parse(text)
      message = json.error || message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }

  const ext = format === 'pdf' ? 'pdf' : 'csv'
  const disposition = res.headers['content-disposition']
  const match = disposition?.match(/filename="?([^";\n]+)"?/)
  const filename = match?.[1] || `${type}-report-${Date.now()}.${ext}`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
