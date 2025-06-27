// File: App.js
// Description: The main component for the application. It handles the UI, state, and logic.

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Button, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesome } from '@expo/vector-icons';
import { fetchDeviceData } from './api';
import { exportToCsv } from './csv';

// --- Form Field Configuration ---
const formFields = [
    { label: 'UDI', id: 'udi', fullWidth: true },
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

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingScan = useRef(false); // Ref to prevent multiple scan handling

  // --- Effects ---
  useEffect(() => {
    // Request camera permissions on mount
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);
  
  // --- Handlers ---
  const handleBarCodeScanned = async ({ data }) => {
    // Use the ref to lock and prevent multiple calls
    if (isProcessingScan.current) {
      return;
    }
    isProcessingScan.current = true;
    
    // Stop the camera view and show loading indicator
    setIsScanning(false);
    setIsLoading(true);

    try {
      const apiData = await fetchDeviceData(data);
      setFormData(apiData);
    } catch (error) {
      Alert.alert('API Error', error.message || 'Could not fetch device data.');
       // Pre-fill with basic info even if API fails
      setFormData({
        udi: data,
        timestamp: new Date().toLocaleString(),
        serialNumber: `ITEM-${Date.now()}`
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleFormChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const clearForm = () => {
    setFormData({});
  }

  const addItemToList = () => {
    if (!formData.udi) {
      Alert.alert('Missing UDI', 'Cannot add an item without a UDI.');
      return;
    }
    setInventory(prev => [...prev, formData]);
    clearForm();
  };
  
  const removeItem = (index) => {
     Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => setInventory(prev => prev.filter((_, i) => i !== index)), style: "destructive" }
      ]
    );
  };

  const handleExport = async () => {
    if (inventory.length === 0) {
      Alert.alert('Nothing to Export', 'The list is empty.');
      return;
    }
    try {
      await exportToCsv(inventory, formFields.map(f => ({header: f.label, key: f.id})));
    } catch (error) {
      Alert.alert('Export Failed', 'Could not save the CSV file.');
      console.error(error);
    }
  };
  
  const startScanning = () => {
      // Reset the lock to allow a new scan to be processed
      isProcessingScan.current = false;
      setIsScanning(true);
  }
  
  const stopScanning = () => {
      setIsScanning(false);
  }

  // --- Render Functions ---
  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>2. Review & Add Item</Text>
      {formFields.map(field => (
        <View key={field.id} style={[styles.inputContainer, field.fullWidth && { width: '100%'}]}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.input, field.readonly && styles.inputReadonly]}
            value={formData[field.id]?.toString() || ''}
            onChangeText={text => handleFormChange(field.id, text)}
            placeholder={field.label}
            editable={!field.readonly}
          />
        </View>
      ))}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={addItemToList}>
          <FontAwesome name="plus" size={16} color="white" />
          <Text style={styles.buttonText}>Add to List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={clearForm}>
           <FontAwesome name="eraser" size={16} color="white" />
           <Text style={styles.buttonText}>Clear Form</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTable = () => (
    <View style={styles.tableContainer}>
      <Text style={styles.sectionTitle}>3. Collected Items</Text>
      <ScrollView horizontal>
        <View>
          {/* Header Row */}
          <View style={styles.tableRow}>
            {formFields.map(f => <Text key={f.id} style={[styles.tableHeader, {width: 120}]}>{f.label}</Text>)}
             <Text style={[styles.tableHeader, {width: 80, textAlign: 'center'}]}>Actions</Text>
          </View>
          {/* Data Rows */}
          {inventory.length > 0 ? inventory.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              {formFields.map(f => <Text key={f.id} style={[styles.tableCell, {width: 120}]}>{item[f.id]}</Text>)}
               <TouchableOpacity onPress={() => removeItem(index)} style={[styles.tableCell, {width: 80, alignItems: 'center'}]}>
                  <FontAwesome name="trash" size={20} color="#e53e3e" />
               </TouchableOpacity>
            </View>
          )) : (
              <Text style={styles.placeholderText}>Your scanned items will appear here.</Text>
          )}
        </View>
      </ScrollView>
       <TouchableOpacity 
          style={[styles.button, styles.exportButton, inventory.length === 0 && styles.disabledButton]} 
          onPress={handleExport}
          disabled={inventory.length === 0}
        >
          <FontAwesome name="file-excel-o" size={16} color="white" />
          <Text style={styles.buttonText}>Export as CSV</Text>
        </TouchableOpacity>
    </View>
  );

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container}><ActivityIndicator/></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Medical Device Scanner</Text>
        
        {/* --- Scanner --- */}
        <View style={styles.scannerSection}>
          <Text style={styles.sectionTitle}>1. Scan Barcode</Text>
          <View style={styles.cameraContainer}>
            {isScanning ? (
              <CameraView
                onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "code128", "datamatrix", "pdf417", "ean13"],
                }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : (
                <View style={styles.cameraPlaceholder}>
                   <FontAwesome name="barcode" size={80} color="#a0aec0" />
                   <Text style={{marginTop: 10, color: '#a0aec0'}}>Press "Start Scanning"</Text>
                </View>
            )}
          </View>
          <Button 
            title={isScanning ? "Stop Scanning" : "Start Scanning"}
            onPress={isScanning ? stopScanning : startScanning}
            color={isScanning ? "#e53e3e" : "#38a169"}
          />
        </View>
        
        {isLoading && <ActivityIndicator size="large" color="#3182ce" style={{marginVertical: 20}}/>}
        
        {/* The form and table are now always rendered */}
        {renderForm()}
        {renderTable()}

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fafc' },
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2d3748' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#4a5568', alignSelf: 'flex-start', marginBottom: 10},
  
  // Scanner
  scannerSection: { width: '100%', marginBottom: 20 },
  cameraContainer: { width: '100%', height: 250, backgroundColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 10, justifyContent: 'center', alignItems: 'center' },
  cameraPlaceholder: { alignItems: 'center' },

  // Form
  formContainer: { width: '100%', padding: 15, backgroundColor: 'white', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 1.41, marginBottom: 20, flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between' },
  inputContainer: { width: '48%', marginBottom: 10 },
  label: { marginBottom: 5, color: '#4a5568', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#cbd5e0', padding: 10, borderRadius: 6, backgroundColor: 'white' },
  inputReadonly: { backgroundColor: '#f7fafc'},
  buttonGroup: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 6, flex: 1, marginHorizontal: 5 },
  primaryButton: { backgroundColor: '#3182ce' },
  secondaryButton: { backgroundColor: '#718096' },
  exportButton: { backgroundColor: '#38a169', marginTop: 10 },
  disabledButton: { backgroundColor: '#a0aec0' },
  buttonText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },

  // Table
  tableContainer: { width: '100%', backgroundColor: 'white', borderRadius: 8, padding: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableHeader: { padding: 10, fontWeight: 'bold', color: '#2d3748' },
  tableCell: { padding: 10, color: '#4a5568' },
  placeholderText: { alignSelf: 'center', marginVertical: 20, color: '#a0aec0' },
});
