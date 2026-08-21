export const jsonToCSV = (data, fields) => {
  if (!data || data.length === 0) return '';
  const headers = fields || Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(field =>
      `"${String(row[field] || '').replace(/"/g, '""')}"`
    ).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};