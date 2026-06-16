/**
 * Export Service — generate PDF & DOCX di browser.
 *
 * Backend tidak punya endpoint export, jadi ini full client-side.
 * Library: jspdf (PDF) + docx (DOCX).
 *
 * Format output:
 *   - Ringkas  : title, summary, action items, recommendations
 *   - Lengkap  : semua di atas + full transcript + diarized transcript
 */
import jsPDF from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from 'docx'

const safe = (v) => (v == null ? '' : String(v))

const sanitizeFilename = (name) =>
  (name || 'meeting')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'meeting'

/**
 * Trigger download dari Blob.
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Beri jeda sebelum revoke agar download dimulai.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Build payload bersih dari result AIPanel/MeetingResultResponse.
 */
const buildPayload = (result) => {
  const actionItems = Array.isArray(result?.action_items) ? result.action_items : []
  const recommendations = Array.isArray(result?.recommendations) ? result.recommendations : []

  return {
    title: safe(result?.title || 'Meeting'),
    summary: safe(result?.summary),
    full_transcript: safe(result?.full_transcript),
    diarized_transcript: safe(result?.diarized_transcript),
    created_at: result?.created_at
      ? new Date(result.created_at).toLocaleString()
      : new Date().toLocaleString(),
    action_items: actionItems.map((it) => {
      if (typeof it === 'string') return { task: it, assignee: '', deadline: '' }
      return {
        task: safe(it.task || it.title),
        assignee: safe(it.assignee),
        deadline: safe(it.deadline),
      }
    }),
    recommendations: recommendations.map((r) => {
      if (typeof r === 'string') return { title: r, detail: '', priority: '' }
      return {
        title: safe(r.title),
        detail: safe(r.detail || r.recommendation),
        priority: safe(r.priority),
      }
    }),
  }
}

// ── PDF ─────────────────────────────────────────────────────────

const PDF_MARGIN = 14

const addWrappedText = (doc, text, y) => {
  if (!text) return y
  const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - PDF_MARGIN * 2)
  lines.forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - PDF_MARGIN) {
      doc.addPage()
      y = PDF_MARGIN
    }
    doc.text(line, PDF_MARGIN, y)
    y += 6
  })
  return y
}

const addHeading = (doc, text, y, size = 13) => {
  if (y > doc.internal.pageSize.getHeight() - PDF_MARGIN) {
    doc.addPage()
    y = PDF_MARGIN
  }
  doc.setFontSize(size)
  doc.setFont('helvetica', 'bold')
  doc.text(text, PDF_MARGIN, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  return y
}

export const exportPDF = (result, mode = 'ringkas') => {
  const data = buildPayload(result)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = PDF_MARGIN

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  y = addWrappedText(doc, data.title, y)
  y += 2

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  y = addWrappedText(doc, `Dibuat: ${data.created_at}`, y)
  doc.setTextColor(0)
  y += 2

  // Summary
  if (data.summary) {
    y = addHeading(doc, 'Ringkasan', y)
    y = addWrappedText(doc, data.summary, y)
    y += 4
  }

  // Action Items
  if (data.action_items.length) {
    y = addHeading(doc, 'Action Items', y)
    data.action_items.forEach((it) => {
      const line = `• ${it.task}${it.assignee ? ` — @${it.assignee}` : ''}${
        it.deadline ? ` (deadline: ${it.deadline})` : ''
      }`
      y = addWrappedText(doc, line, y)
    })
    y += 4
  }

  // Recommendations
  if (data.recommendations.length) {
    y = addHeading(doc, 'Rekomendasi', y)
    data.recommendations.forEach((r, i) => {
      y = addWrappedText(doc, `${i + 1}. ${r.title}${r.priority ? ` [${r.priority}]` : ''}`, y)
      if (r.detail) y = addWrappedText(doc, `   ${r.detail}`, y)
    })
    y += 4
  }

  // Lengkap mode: include transcripts
  if (mode === 'lengkap') {
    if (data.diarized_transcript) {
      y = addHeading(doc, 'Transkrip (Diarized)', y)
      y = addWrappedText(doc, data.diarized_transcript, y)
      y += 4
    }
    if (data.full_transcript) {
      y = addHeading(doc, 'Transkrip Lengkap', y)
      y = addWrappedText(doc, data.full_transcript, y)
    }
  }

  const filename = `${sanitizeFilename(data.title)}.pdf`
  doc.save(filename)
  return filename
}

// ── DOCX ─────────────────────────────────────────────────────────

export const exportDOCX = async (result, mode = 'ringkas') => {
  const data = buildPayload(result)

  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: data.title, bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Dibuat: ${data.created_at}`, italics: true, color: '888888' })],
    }),
    new Paragraph({ children: [new TextRun('')] }),
  ]

  if (data.summary) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Ringkasan', bold: true })],
      }),
      new Paragraph({ children: [new TextRun(data.summary)] }),
      new Paragraph({ children: [new TextRun('')] })
    )
  }

  if (data.action_items.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Action Items', bold: true })],
      })
    )
    data.action_items.forEach((it) => {
      const text = `• ${it.task}${it.assignee ? ` — @${it.assignee}` : ''}${
        it.deadline ? ` (deadline: ${it.deadline})` : ''
      }`
      children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(text)] }))
    })
    children.push(new Paragraph({ children: [new TextRun('')] }))
  }

  if (data.recommendations.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Rekomendasi', bold: true })],
      })
    )
    data.recommendations.forEach((r, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${r.title}`, bold: true })],
        })
      )
      if (r.detail) {
        children.push(new Paragraph({ children: [new TextRun(`   ${r.detail}`)] }))
      }
    })
    children.push(new Paragraph({ children: [new TextRun('')] }))
  }

  if (mode === 'lengkap') {
    if (data.diarized_transcript) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: 'Transkrip (Diarized)', bold: true })],
        }),
        new Paragraph({ children: [new TextRun(data.diarized_transcript)] }),
        new Paragraph({ children: [new TextRun('')] })
      )
    }
    if (data.full_transcript) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: 'Transkrip Lengkap', bold: true })],
        }),
        new Paragraph({ children: [new TextRun(data.full_transcript)] })
      )
    }
  }

  const doc = new Document({
    creator: 'MeetMind',
    title: data.title,
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  const filename = `${sanitizeFilename(data.title)}.docx`
  downloadBlob(blob, filename)
  return filename
}
