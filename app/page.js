'use client';

import { useState, useRef } from 'react';
import { fetchDeviceData } from '../lib/api';
import { exportToCsv } from '../lib/csv';
import QrScanner from '../components/QrScanner';

// Form Field Configuration
const formFields = [
    { label: 'UDI', id: 'udi', fullWidth: true },
    { label: 'DI', id: 'di' },
    { label: 'Company', id: 'companyName'},
    { label: 'Exp. Date', id: 'expirationDate' },
    { label: 'Lot #', id: 'lotNumber' },
    { label: 'Brand', id: 'brandName' },
    { label: 'Ref #', id: 'refNumber' },
    { label: 'Part Name', id: 'partName', fullWidth: true },
    { label: 'Unit', id: 'unit' },
    { label: 'Quantity', id: 'quantity' },
    { label: 'Scan Timestamp', id: 'timestamp', fullWidth: true, readonly: true },
    { label: 'Serial # / Item #', id: 'serialNumber', fullWidth: true },
];

// UDI Verifier Component
const submitField = [
  { label: 'Submit UDI', id: 'submit', fullWidth: true}
]

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState(""); // Debug state
  const [udi, setUdi] = useState("");
  const isProcessingScan = useRef(false);

  // Handlers
  const handleBarCodeScanned = async (result) => {
    setDebug("Scan result: " + JSON.stringify(result));
    if (isProcessingScan.current || !result) {
      return;
    }
    isProcessingScan.current = true;
    
    setIsScanning(false);
    setIsLoading(true);

    setUdi(result?.text || result);
  };

  const fetchData = async () => {
    try {
      const apiData = await fetchDeviceData(udi?.text || udi);
      setFormData(apiData);
      setDebug("API data: " + JSON.stringify(apiData));
    } catch (error) {
      setDebug("Error: " + error.message);
      // alert(error.message || 'Could not fetch device data.');
      setFormData({
        udi: udi?.text || udi,
        timestamp: new Date().toLocaleString(),
        serialNumber: `ITEM-${Date.now()}`
      });
    } finally {
        setIsLoading(false);
    }
    clearUdi();
  };

  const handleFormChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const clearUdi = () => {
    setUdi("");
  }

  const clearForm = () => {
    setFormData({});
  }

  const addItemToList = () => {
    if (!formData.udi) {
      alert('Cannot add an item without a UDI.');
      return;
    }
    setInventory(prev => [...prev, formData]);
    clearForm();
  };
  
  const removeItem = (index) => {
     if (confirm('Are you sure you want to remove this item?')) {
       setInventory(prev => prev.filter((_, i) => i !== index));
     }
  };

  const handleExport = async () => {
    if (inventory.length === 0) {
      alert('The list is empty.');
      return;
    }
    try {
      await exportToCsv(inventory, formFields.map(f => ({header: f.label, key: f.id})));
    } catch (error) {
      alert('Could not save the CSV file.');
      console.error(error);
    }
  };
  
  const startScanning = () => {
      isProcessingScan.current = false;
      setIsScanning(true);
  }
  
  const stopScanning = () => {
      setIsScanning(false);
  }

  // Main Render
  return (
    <main>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-5 py-8">
          <h1 className="text-3xl font-bold text-text text-center mb-8 tracking-wide">
            Medical Device Scanner
          </h1>
          
          {/* Scanner Section */}
          <div className="bg-surface rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-primary mb-4">1. Scan Barcode</h2>
            <div className="w-full h-64 bg-black rounded-lg overflow-hidden mb-4">
              <QrScanner 
                onResult={handleBarCodeScanned}
                isScanning={isScanning}
              />
            </div>
            <button 
              className={`w-full py-3 px-4 rounded-lg font-bold ${
                isScanning 
                  ? 'bg-accentRed text-white hover:opacity-90' 
                  : 'bg-primary text-background hover:opacity-90'
              } transition-opacity`}
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? "Stop Scanning" : "Start Scanning"}
            </button>
          </div>
          
          {isLoading && (
            <div className="flex justify-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {submitForm()}
          {renderForm()}
          {renderTable()}
          {/* <div style={{ color: 'red', marginTop: 20, wordBreak: 'break-all' }}>
            {debug}
          </div> */}
        </div>
      </div>
    </main>
  );

  function submitForm() {
    return (
      <div className="bg-surface rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-primary mb-4">2. Verify UDI</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {submitField.map(field => (
            <div key={field.id} className={true ? 'md:col-span-2' : ''}>
              <label className="block text-textSecondary font-medium mb-2">{'Submit UDI'}</label>
              <input
                type={false ? 'text' : 'text'}
                className={`input-field w-full ${false ? 'input-readonly' : ''}`}
                value={udi || ''}
                onChange={(e) => setUdi(e.target.value)}
                placeholder={'UDI'}
                readOnly={false}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <button className="btn-primary flex-1" onClick={fetchData}>
            Submit UDI
          </button>
        </div>
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="bg-surface rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-primary mb-4">3. Review & Add Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {formFields.map(field => (
            <div key={field.id} className={field.fullWidth ? 'md:col-span-2' : ''}>
              <label className="block text-textSecondary font-medium mb-2">{field.label}</label>
              <input
                type={field.readonly ? 'text' : 'text'}
                className={`input-field w-full ${field.readonly ? 'input-readonly' : ''}`}
                value={formData[field.id]?.toString() || ''}
                onChange={(e) => handleFormChange(field.id, e.target.value)}
                placeholder={field.label}
                readOnly={field.readonly}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <button className="btn-primary flex-1" onClick={addItemToList}>
            <span>➕</span>
            Add to List
          </button>
          <button className="btn-secondary flex-1" onClick={clearForm}>
            <span>🧹</span>
            Clear Form
          </button>
        </div>
      </div>
    );
  }

  function renderTable() {
    return (
      <div className="bg-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">4. Collected Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {formFields.map(f => (
                  <th key={f.id} className="text-left p-3 text-primary font-bold uppercase text-sm">
                    {f.label}
                  </th>
                ))}
                <th className="text-center p-3 text-primary font-bold uppercase text-sm w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inventory.length > 0 ? inventory.map((item, index) => (
                <tr key={index} className="border-b border-border">
                  {formFields.map(f => (
                    <td key={f.id} className="p-3 text-text">
                      {item[f.id] || ''}
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-accentRed hover:opacity-80 transition-opacity"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={formFields.length + 1} className="p-6 text-center text-textSecondary">
                    Your scanned items will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button 
          className={`btn-export w-full mt-6 ${inventory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleExport}
          disabled={inventory.length === 0}
        >
          <span>📊</span>
          Export as CSV
        </button>
      </div>
    );
  }
} 
