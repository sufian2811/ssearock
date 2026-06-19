import * as XLSX from 'xlsx';

function getCell(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') {
      return String(row[key]).trim();
    }
  }
  return '';
}

export function parseLeadsExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    throw new Error('Excel file is empty');
  }

  const leads = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const name = getCell(row, ['Name', 'name', 'NAME']);
    const phone = getCell(row, ['Phone', 'phone', 'PHONE', 'Mobile', 'mobile']);
    const location = getCell(row, ['Location', 'location', 'LOCATION']);

    if (!phone) {
      errors.push({ row: rowNum, error: 'Phone is required' });
      return;
    }

    leads.push({
      name: name || `Lead ${phone.slice(-4)}`,
      phone,
      location: location || null,
      status: 'new',
    });
  });

  return { leads, errors };
}
