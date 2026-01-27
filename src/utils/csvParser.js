// CSV Parser utility for gallery metadata
// Uses PapaParse library for robust CSV parsing

export const parseGalleryCSV = (csvText) => {
  // Simple CSV parser (handles quoted fields and commas)
  const lines = csvText.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) return []
  
  // Parse header
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const items = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    
    const item = {}
    headers.forEach((header, index) => {
      const value = values[index] || ''
      item[header.trim()] = value.trim()
    })
    
    // Normalize the data structure
    if (item.filename || item.url) {
      items.push({
        filename: item.filename || item.url,
        url: item.url || `/images/${item.filename}`,
        thumbnail: item.thumbnail || item.url || `/images/${item.filename}`,
        type: item.type || (item.filename?.toLowerCase().endsWith('.gif') ? 'gif' : 'image'),
        alt: item.alt || item.description || item.caption || item.filename,
        category: item.category || '',
        year: item.year || '',
        tags: item.tags ? item.tags.split(',').map(t => t.trim()) : [],
        date: item.date || '',
        // Preserve any additional metadata
        ...Object.fromEntries(
          Object.entries(item).filter(([key]) => 
            !['filename', 'url', 'thumbnail', 'type', 'alt', 'category', 'year', 'tags', 'date'].includes(key)
          )
        )
      })
    }
  }
  
  return items
}

// Helper to parse CSV line (handles quoted fields)
const parseCSVLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current)
  
  return result
}

