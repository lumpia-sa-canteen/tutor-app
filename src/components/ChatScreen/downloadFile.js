const EXT = {
  python: 'py', py: 'py', javascript: 'js', js: 'js', jsx: 'jsx', html: 'html',
  css: 'css', json: 'json', java: 'java', c: 'c', cpp: 'cpp', csharp: 'cs',
  sql: 'sql', bash: 'sh', sh: 'sh', markdown: 'md', md: 'md', csv: 'csv',
  docx: 'docx', word: 'docx', pdf: 'pdf', xlsx: 'xlsx', excel: 'xlsx',
}

export const extFor = (lang) => EXT[(lang || '').toLowerCase()] || 'txt'

// splits a reply into plain-text parts and ```code``` parts
export function splitReply(text) {
  const parts = []
  const re = /```(\w*)\n([\s\S]*?)```/g
  let last = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) })
    parts.push({ type: 'code', lang: match[1], content: match[2].replace(/\n$/, '') })
    last = re.lastIndex
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

function saveBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------- helpers ----------

const stripMd = (s) => s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1')

// simple markdown: "# ", "## ", "### " headings, "- " bullets, anything else is a paragraph
function parseDoc(text) {
  const blocks = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('### ')) blocks.push({ type: 'h3', text: stripMd(line.slice(4)) })
    else if (line.startsWith('## ')) blocks.push({ type: 'h2', text: stripMd(line.slice(3)) })
    else if (line.startsWith('# ')) blocks.push({ type: 'h1', text: stripMd(line.slice(2)) })
    else if (/^[-*] /.test(line)) blocks.push({ type: 'bullet', text: stripMd(line.slice(2)) })
    else blocks.push({ type: 'p', text: stripMd(line) })
  }
  return blocks
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

// ---------- file builders ----------

async function makeDocx(content) {
  const { Document, Packer, Paragraph, HeadingLevel } = await import('docx')
  const HEAD = { h1: HeadingLevel.HEADING_1, h2: HeadingLevel.HEADING_2, h3: HeadingLevel.HEADING_3 }

  const children = parseDoc(content).map((b) => {
    if (HEAD[b.type]) return new Paragraph({ text: b.text, heading: HEAD[b.type] })
    if (b.type === 'bullet') return new Paragraph({ text: b.text, bullet: { level: 0 } })
    return new Paragraph({ text: b.text, spacing: { after: 160 } })
  })

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBlob(doc)
}

async function makePdf(content) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 20
  const width = pageW - margin * 2
  const SIZE = { h1: 20, h2: 16, h3: 13, p: 11, bullet: 11 }

  let y = margin
  for (const b of parseDoc(content)) {
    const size = SIZE[b.type]
    const lh = size * 0.3528 * 1.4
    pdf.setFont('helvetica', b.type.startsWith('h') ? 'bold' : 'normal')
    pdf.setFontSize(size)

    const text = b.type === 'bullet' ? `\u2022 ${b.text}` : b.text
    for (const line of pdf.splitTextToSize(text, width)) {
      if (y + lh > pageH - margin) { pdf.addPage(); y = margin }
      y += lh
      pdf.text(line, margin, y)
    }
    y += b.type.startsWith('h') ? 3 : 2
  }
  return pdf.output('blob')
}

async function makeXlsx(content) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')

  const rows = parseCsv(content).map((r) =>
    r.map((c) => (c.trim() !== '' && !isNaN(Number(c)) ? Number(c) : c))
  )
  rows.forEach((r) => ws.addRow(r))
  ws.getRow(1).font = { bold: true }
  ws.columns.forEach((col) => {
    let max = 10
    col.eachCell({ includeEmpty: false }, (cell) => {
      max = Math.max(max, String(cell.value ?? '').length + 2)
    })
    col.width = Math.min(max, 50)
  })

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

// ---------- called by the Download button ----------

export async function saveBlock(lang, content) {
  const ext = extFor(lang)

  if (ext === 'docx') return saveBlob('document.docx', await makeDocx(content))
  if (ext === 'pdf') return saveBlob('document.pdf', await makePdf(content))
  if (ext === 'xlsx') return saveBlob('spreadsheet.xlsx', await makeXlsx(content))

  saveBlob(`code.${ext}`, new Blob([content], { type: 'text/plain;charset=utf-8' }))
}