'use client';

import { useState, useRef } from 'react';
import { fetchDeviceData } from '../lib/api';
import { exportToCsv } from '../lib/csv';

// Form Field Configuration
const formFields = [
    { label: 'UDI', id: 'udi', fullWidth: true },
    { label: 'DI', id: 'deviceDI' },
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
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState(""); // Debug state
  const [udi, setUdi] = useState("");

  // Handlers

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
  

  // Main Render
  return (
    <main>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text text-center mb-4 tracking-wide">
            Medical Device Scanner
          </h1>
          
          {isLoading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Optimized 3-section layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
            {/* Left column: UDI (top) + Collected Items (bottom) */}
            <div className="flex flex-col gap-4">
              {submitForm()}
              {renderTable()}
            </div>
            
            {/* Right column: Review & Add Item (full height) */}
            <div>
              {renderForm()}
            </div>
          </div>
          {/* <div style={{ color: 'red', marginTop: 20, wordBreak: 'break-all' }}>
            {debug}
          </div> */}
        </div>
      </div>
    </main>
  );

  function submitForm() {
    return (
      <div className="bg-surface rounded-xl p-4">
        <h2 className="text-lg font-semibold text-primary mb-3">1. Verify UDI</h2>
        <div className="mb-4">
          {submitField.map(field => (
            <div key={field.id}>
              <label className="block text-textSecondary font-medium mb-1">{'Submit UDI'}</label>
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
        <button className="btn-primary w-full" onClick={fetchData}>
          Submit UDI
        </button>
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="bg-surface rounded-xl p-4">
        <h2 className="text-lg font-semibold text-primary mb-3">2. Review & Add Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {formFields.map(field => (
            <div key={field.id} className={field.fullWidth ? 'md:col-span-2' : ''}>
              <label className="block text-textSecondary font-medium mb-1">{field.label}</label>
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
        <div className="flex gap-2">
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
      <div className="bg-surface rounded-xl p-4 flex-1 flex flex-col">
        <h2 className="text-lg font-semibold text-primary mb-3">3. Collected Items</h2>
        <div className="overflow-x-auto flex-1">
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
          className={`btn-export w-full mt-4 ${inventory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
