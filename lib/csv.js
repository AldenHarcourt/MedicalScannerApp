// File: lib/csv.js
// Description: Handles the logic for creating and exporting the data as a CSV file for web browsers.

/**
 * Converts an array of objects to a CSV string.
 * @param {Array<object>} data - The inventory data.
 * @param {Array<{header: string, key: string}>} columns - The columns for the CSV.
 * @returns {string} The CSV formatted data as a string.
 */
const convertToCsvString = (data, columns) => {
  const headerRow = columns.map(c => c.header).join(',');
  const dataRows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key] || '';
      // Escape commas and quotes for CSV format
      const escaped = value.toString().replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Exports the inventory data to a CSV file and triggers a download in the browser.
 * @param {Array<object>} data - The inventory data.
 * @param {Array<{header: string, key: string}>} columns - The columns for the CSV.
 * @returns {Promise<void>} A promise that resolves when the download is triggered.
 */
export const exportToCsv = async (data, columns) => {
  const csvString = convertToCsvString(data, columns);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `device-inventory-${timestamp}.csv`;

  // Create a Blob from the CSV string
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element
  const link = document.createElement('a');
  
  // Create object URL from the blob
  const url = URL.createObjectURL(blob);
  
  // Set the link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add the link to the DOM, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  URL.revokeObjectURL(url);
}; 