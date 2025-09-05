// File: csv.js
// Description: Handles the logic for creating and exporting the data as a CSV file.

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
 * Exports the inventory data to a CSV file and prompts the user to share/save it.
 * @param {Array<object>} data - The inventory data.
 * @param {Array<{header: string, key: string}>} columns - The columns for the CSV.
 * @returns {Promise<string>} A promise that resolves with the file URI.
 */
export const exportToCsv = async (data, columns) => {
  const csvString = convertToCsvString(data, columns);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `device-inventory-${timestamp}.csv`;
  const fileUri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, csvString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Save or Share your CSV',
    });
  } else {
    // This would happen on a device without sharing capabilities
    throw new Error('Sharing is not available on this device.');
  }

  return fileUri;
};
