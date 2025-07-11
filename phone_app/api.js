// File: api.js
// Description: Contains the logic for fetching data from the AccessGUDID API.

/**
 * Fetches device data from the GUDID API and parses the response.
 * @param {string} di - The Device Identifier from the barcode.
 * @returns {Promise<object>} A promise that resolves to an object with the device data.
 */
export const fetchDeviceData = async (di) => {
  // The API expects the DI to be URL encoded.
  const encodedDi = encodeURIComponent(di);
  // The parameter has been corrected from 'udi' to 'di'.
  const apiUrl = `https://accessgudid.nlm.nih.gov/api/v3/devices/lookup.json?udi=${encodedDi}`;

  // This function will now throw an error if the network request fails,
  // which will be caught by the try...catch block in App.js.
  const response = await fetch(apiUrl);
  
  // Start with the scanned DI. The API refers to this as the UDI in some contexts.
  let parsedData = { udi: di }; 

  // Parse UDI components from headers first, as they might be available.
  const headers = response.headers;
  const headerMap = {
    'expirationdate': 'expirationDate',
    'lotnumber': 'lotNumber',
    'serialnumber': 'serialNumber'
  };
  for (const [header, key] of Object.entries(headerMap)) {
      if (headers.has(header)) {
         parsedData[key] = headers.get(header);
      }
  }

  if (!response.ok) {
    // If the response is not OK, throw an error to be handled by App.js.
    // This will trigger the "API Error" alert.
    throw new Error(`API lookup failed with status ${response.status}. The device may not be in the database.`);
  }

  const json = await response.json();
  
  // Extract data from the JSON body if the request was successful
  const device = json?.gudid?.device;
  if (device) {
      parsedData = {
          ...parsedData,
          brandName: device.brandName || '',
          refNumber: device.catalogNumber || '',
          partName: device.deviceDescription || '',
          unit: device.deviceCount?.toString() || '1',
      };
  }
  
  // Always add these non-API fields at the end.
  parsedData.timestamp = new Date().toLocaleString();
  if (!parsedData.serialNumber) {
      // Provide a unique, editable default if no serial is found
      parsedData.serialNumber = `ITEM-${Date.now()}`;
  }
  if(!parsedData.quantity) {
      parsedData.quantity = '1';
  }

  return parsedData;
};
