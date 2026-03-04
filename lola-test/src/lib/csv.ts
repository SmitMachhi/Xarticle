const escapeCsv = (value: string): string => {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
};

export const toCsv = (rows: Array<Record<string, string>>): string => {
  const first = rows.at(0);
  if (first === undefined) {
    return '';
  }

  const headers = Object.keys(first);
  const headerLine = headers.map(escapeCsv).join(',');
  const lines = rows.map((row) => {
    return headers.map((header) => escapeCsv(row[header] ?? '')).join(',');
  });
  return [headerLine, ...lines].join('\n');
};
