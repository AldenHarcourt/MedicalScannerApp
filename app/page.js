'use client';

import { useState, useRef } from 'react';
import { fetchDeviceData } from '../lib/api';
import { exportToCsv } from '../lib/csv';

// Form Field Configuration
const formFields = [
    { label: 'Serial #', id: 'serialNumber' },
    { label: 'DI', id: 'deviceDI' },
    { label: 'Company', id: 'companyName' },
    { label: 'Brand', id: 'brandName' },
    { label: 'Ref #', id: 'refNumber' },
    { label: 'Model #', id: 'modelNumber' },
    { label: 'Exp. Date', id: 'expirationDate' },
    { label: 'Lot #', id: 'lotNumber' },
    { label: 'Unit', id: 'unit' },
    { label: 'Quantity', id: 'quantity' },
    { label: 'Part Name', id: 'partName' },
    { label: 'Scan Timestamp', id: 'timestamp', readonly: true },
    { label: 'UDI', id: 'udi' },
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
        serialNumber: `${Date.now()}`
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
    } else if (!formData.serialNumber || formData.serialNumber === "") {
      setFormData({
        serialNumber: `${Date.now()}`
      });
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
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-text text-center mb-3 tracking-wide">
            Medical Device Scanner
          </h1>
          
          {isLoading && (
            <div className="flex justify-center my-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Optimized 3-section layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100vh-7rem)]">
            {/* Left column: UDI (top) + Collected Items (bottom) */}
            <div className="flex flex-col gap-3">
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
      <div className="bg-surface rounded-lg p-3">
        <h2 className="text-base font-semibold text-primary mb-2">1. Verify UDI</h2>
        <div className="mb-3">
          {submitField.map(field => (
            <div key={field.id}>
              <label className="block text-textSecondary text-sm font-medium mb-1">{'Submit UDI'}</label>
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
        <button className="btn-primary w-full py-2" onClick={fetchData}>
          Submit UDI
        </button>
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="bg-surface rounded-lg p-3">
        <h2 className="text-base font-semibold text-primary mb-2">2. Review & Add Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          {formFields.map(field => (
            <div key={field.id} className={field.fullWidth ? 'md:col-span-2' : ''}>
              <label className="block text-textSecondary text-sm font-medium mb-1">{field.label}</label>
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
            Add to List
          </button>
          <button className="btn-secondary flex-1" onClick={clearForm}>
            Clear Form
          </button>
        </div>
      </div>
    );
  }

  function renderTable() {
    return (
      <div className="bg-surface rounded-lg p-3 flex-1 flex flex-col">
        <h2 className="text-base font-semibold text-primary mb-2">3. Collected Items</h2>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {formFields.map(f => (
                  <th key={f.id} className="text-left p-2 text-primary font-bold uppercase text-xs">
                    {f.label}
                  </th>
                ))}
                <th className="text-center p-2 text-primary font-bold uppercase text-xs w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inventory.length > 0 ? inventory.map((item, index) => (
                <tr key={index} className="border-b border-border">
                  {formFields.map(f => (
                    <td key={f.id} className="p-2 text-text text-sm">
                      {item[f.id] || ''}
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-accentRed hover:opacity-80 transition-opacity"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={formFields.length + 1} className="p-4 text-center text-textSecondary text-sm">
                    Your scanned items will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button 
          className={`btn-export w-full mt-3 py-2 ${inventory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleExport}
          disabled={inventory.length === 0}
        >
          Export as CSV
        </button>
      </div>
    );
  }
} 
