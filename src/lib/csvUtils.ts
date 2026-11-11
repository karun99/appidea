export const parseCSV = (csvText: string): any[] => {
  if (!csvText) return [];

  // Single-pass RFC-4180-style tokenizer. The previous implementation stripped
  // quote characters while splitting lines, so a quoted comma was treated as a
  // delimiter and every embedded quote was lost.
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        if (csvText[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Flush the final field/row, dropping the empty row produced by a trailing
  // newline.
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const data = [];

  for (let r = 1; r < rows.length; r += 1) {
    const rowValues = rows[r];
    if (rowValues.length === 1 && rowValues[0] === '') continue;
    const row: any = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const raw = rowValues[index] === undefined ? '' : rowValues[index];
      let val: any = raw.trim();

      // Try to parse JSON for objects/arrays.
      if (
        (val.startsWith('{') && val.endsWith('}')) ||
        (val.startsWith('[') && val.endsWith(']'))
      ) {
        try {
          val = JSON.parse(val);
        } catch (e) {
          // keep the plain string when it is not valid JSON
        }
      }
      row[header] = val;
    });
    data.push(row);
  }

  return data;
};

export const generateCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      }
      cell = cell.toString().replace(/"/g, '""');
      return `"${cell}"`;
    }).join(',');
  });

  const csvString = [headers.map(h => `"${h}"`).join(','), ...csvRows].join('\n');
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
