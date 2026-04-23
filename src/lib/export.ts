/**
 * Utility for exporting dashboard data to CSV.
 */

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  // Extract headers from the first object keys
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName];
        // Handle strings with commas by wrapping in quotes
        const escaped = ('' + (value === null ? '' : value)).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  // Combine rows into a blob
  const csvContent = csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
