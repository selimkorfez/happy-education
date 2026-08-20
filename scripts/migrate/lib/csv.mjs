/** RFC 4180 CSV reader. The audit CSVs contain quoted commas and doubled quotes. */

export function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i += 1
        } else quoted = false
      } else cur += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n') {
      row.push(cur)
      cur = ''
      rows.push(row)
      row = []
    } else if (c !== '\r') cur += c
  }
  if (cur.length || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

/** Parse to objects using the first row as the header. Blank rows are dropped. */
export function parseCsvObjects(text) {
  const rows = parseCsv(text)
  if (!rows.length) return []
  const head = rows[0].map((h) => h.trim())
  return rows
    .slice(1)
    .filter((r) => r.length > 1 || (r[0] ?? '').trim().length > 0)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))
}

/** Read newline-delimited JSON. */
export function parseNdjson(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}
