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
    { label: 'Serial #', id: 'serialNumber', readonly: true },
    { label: 'DI', id: 'deviceId' },
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
    { label: 'UDI', id: 'udi', fullWidth: true },
];

// Field configuration for manual UDI submission
const udiInputField = { label: 'Enter UDI', id: 'manualUdi', fullWidth: true };

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualUdi, setManualUdi] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCell, setExpandedCell] = useState(null);
  const isProcessingScan = useRef(false);

  // --- Effects ---
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);
  
  // --- Handlers ---
  const fetchAndSetDeviceData = async (udi) => {
    if (!udi) return;
    
    setIsLoading(true);
    // setDebugInfo(prev => `Fetching data for UDI: ${udi}\n${prev}`);
    
    try {
      const apiData = await fetchDeviceData(udi);
      setFormData(apiData);
      // setDebugInfo(prev => `Successfully fetched data for UDI: ${udi}\n${prev}`);
    } catch (error) {
      const errorMsg = `Error fetching device data: ${error.message}`;
      // setDebugInfo(prev => `${errorMsg}\n${prev}`);
      Alert.alert('API Error', error.message || 'Could not fetch device data.');
      setFormData({
        udi: udi,
        timestamp: new Date().toLocaleString(),
        serialNumber: Date.now().toString()
      });
    } finally {
      setIsLoading(false);
      isProcessingScan.current = false;
    }
  };

  const handleManualUdiSubmit = () => {
    if (!manualUdi.trim()) {
      Alert.alert('Error', 'Please enter a valid UDI');
      return;
    }
    fetchAndSetDeviceData(manualUdi.trim());
    setManualUdi('');
  };

  const handleBarCodeScanned = async ({ data, type }) => {
    if (isProcessingScan.current || !data) {
      return;
    }
    isProcessingScan.current = true;
    
    // setDebugInfo(prev => `Scanned ${type}: ${data}\n${prev}`);
    setIsScanning(false);
    setIsLoading(true);

    try {
      const apiData = await fetchDeviceData(data);
      setFormData(apiData);
      // setDebugInfo(prev => `Successfully processed scan: ${data}\n${prev}`);
    } catch (error) {
      const errorMsg = `Scan Error: ${error.message}`;
      // setDebugInfo(prev => `${errorMsg}\n${prev}`);
      Alert.alert('API Error', error.message || 'Could not fetch device data.');
      setFormData({
        udi: data,
        timestamp: new Date().toLocaleString(),
        serialNumber: Date.now().toString()
      });
    } finally {
      setIsLoading(false);
      isProcessingScan.current = false;
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
      isProcessingScan.current = false;
      setIsScanning(true);
  }
  
  const stopScanning = () => {
      setIsScanning(false);
  }

  const handleCellClick = (content, fieldLabel) => {
    if (content && content.trim() !== '') {
      setExpandedCell({ 
        content, 
        fieldLabel
      });
    }
  };

  const closeExpandedCell = () => {
    setExpandedCell(null);
  };

  // --- Render Functions ---
  const renderApp = () => (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Medical Device Scanner</Text>
        
        {/* --- Scanner --- */}
        <View style={styles.scannerSection}>
          <Text style={styles.sectionTitle}>1. Scan Barcode</Text>
          <View style={styles.cameraContainer}>
            {isScanning ? (
              <CameraView
                facing="back"
                onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "code128", "datamatrix", "pdf417", "ean13", "code39", "codabar"],
                }}
                style={StyleSheet.absoluteFillObject}
                autofocus="on"
              />
            ) : (
                <View style={styles.cameraPlaceholder}>
                   <FontAwesome name="barcode" size={80} color="#4a5568" />
                   <Text style={{marginTop: 10, color: '#4a5568', fontWeight: '600'}}>Press "Start Scanning"</Text>
                </View>
            )}
          </View>
          <Button 
            title={isScanning ? "Stop Scanning" : "Start Scanning"}
            onPress={isScanning ? stopScanning : startScanning}
            color={isScanning ? "#e53e3e" : "#00aaff"}
          />
        </View>
        
        {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{marginVertical: 20}}/>}
        
        {renderManualUdiInput()}
        {renderForm()}
        {renderTable()}
        {/* {renderDebugInfo()} */}

      </ScrollView>
      
      {/* Cell Content Popover */}
      {expandedCell && (
        <>
          {/* Invisible overlay to close popover when tapping elsewhere */}
          <TouchableOpacity 
            style={styles.popoverOverlay} 
            activeOpacity={1} 
            onPress={closeExpandedCell}
          />
          {/* Positioned popover */}
          <View style={styles.popoverContent}>
            <Text style={styles.popoverTitle}>{expandedCell.fieldLabel}</Text>
            <Text style={styles.popoverText}>{expandedCell.content}</Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );

  const renderManualUdiInput = () => (
    <View style={[styles.inputContainer, { width: '100%', marginBottom: 20 }]}>
      <Text style={styles.sectionTitle}>1. Enter UDI Manually</Text>
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          value={manualUdi}
          onChangeText={setManualUdi}
          placeholder="Enter UDI"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleManualUdiSubmit}
        />
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton, { paddingHorizontal: 15 }]} 
          onPress={handleManualUdiSubmit}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>2. Review & Add Item</Text>
      {formFields.map(field => (
        <View key={field.id} style={[styles.inputContainer, field.fullWidth && { width: '100%'}]}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[
              styles.input, 
              field.readonly && styles.inputReadonly,
              field.id === 'refNumber' && !formData[field.id] && styles.inputHighlight
            ]}
            value={formData[field.id]?.toString() || ''}
            onChangeText={text => handleFormChange(field.id, text)}
            placeholderTextColor="#555"
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

  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information</Text>
        <ScrollView style={styles.debugScrollView}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </ScrollView>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, { marginTop: 10, alignSelf: 'flex-end' }]}
          onPress={() => setDebugInfo('')}
        >
          <Text style={styles.buttonText}>Clear Debug</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
          {inventory.length > 0 ? inventory.slice().reverse().map((item, index) => (
            <View key={index} style={[styles.tableRow, styles.dataRow]}>
              {formFields.map(f => (
                <TouchableOpacity key={f.id} onPress={() => handleCellClick(item[f.id] || '', f.label)} style={[styles.tableCell, {width: 120}]}>
                  <Text style={{color: colors.text, fontSize: 12}} numberOfLines={1} ellipsizeMode="tail">{item[f.id] || ''}</Text>
                </TouchableOpacity>
              ))}
               <TouchableOpacity onPress={() => removeItem(inventory.length - 1 - index)} style={[styles.tableCell, {width: 80, alignItems: 'center'}]}>
                  <FontAwesome name="trash" size={20} color={colors.accentRed} />
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
    return <View style={styles.screen}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, {justifyContent: 'center'}]}>
        <Text style={{ textAlign: 'center', marginBottom: 10, color: '#eee' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" color={colors.primary}/>
      </View>
    );
  }

  return renderApp();
}

// --- Stylesheet ---
const colors = {
    background: '#121212',
    surface: '#1e1e1e',
    primary: '#00ffff', // A vibrant cyan/aqua
    secondary: '#4a5568',
    text: '#e0e0e0',
    textSecondary: '#a0aec0',
    border: '#333',
    accentGreen: '#00ff88',
    accentRed: '#ff4d4d',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: colors.text, letterSpacing: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.primary, alignSelf: 'flex-start', marginBottom: 15},
  
  // Login Screen
  loginContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loginTitle: { fontSize: 24, color: colors.text, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  loginSubtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 30},
  loginInput: { width: '80%', borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, backgroundColor: colors.surface, color: colors.text, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  loginButton: { backgroundColor: colors.primary, width: '80%', flex: 0 },

  // Scanner
  scannerSection: { width: '100%', marginBottom: 20, backgroundColor: colors.surface, padding: 15, borderRadius: 12 },
  cameraContainer: { width: '100%', height: 250, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
  cameraPlaceholder: { alignItems: 'center' },

  // Form
  formContainer: { width: '100%', padding: 15, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 20, flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between' },
  inputContainer: { width: '48%', marginBottom: 15 },
  label: { marginBottom: 8, color: colors.textSecondary, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8, backgroundColor: colors.background, color: colors.text, fontSize: 16 },
  inputReadonly: { backgroundColor: '#2a2a2a' },
  inputHighlight: { backgroundColor: '#ffeb3b20', borderColor: '#ffeb3b' },
  buttonGroup: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8, flex: 1, marginHorizontal: 5 },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: { backgroundColor: colors.secondary },
  exportButton: { backgroundColor: colors.accentGreen },
  disabledButton: { backgroundColor: colors.secondary },
  buttonText: { color: colors.background, fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  // Table
  tableContainer: { width: '100%', backgroundColor: colors.surface, borderRadius: 12, padding: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  dataRow: { backgroundColor: 'transparent' }, 
  tableHeader: { padding: 12, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase' },
  tableCell: { padding: 12, color: colors.text, verticalAlign: 'middle' },
  placeholderText: { alignSelf: 'center', marginVertical: 30, color: colors.textSecondary },
  
  // Debug
  debugContainer: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 8, padding: 15, marginTop: 10 },
  debugTitle: { color: colors.accentGreen, fontWeight: 'bold', marginBottom: 10 },
  debugScrollView: { maxHeight: 150, marginBottom: 10 },
  debugText: { color: '#aaa', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Popover
  popoverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  popoverContent: { 
    position: 'absolute', 
    top: 100, 
    left: 20, 
    right: 20, 
    backgroundColor: colors.surface, 
    borderRadius: 8, 
    padding: 15, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  popoverTitle: { color: colors.primary, fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  popoverText: { color: colors.text, fontSize: 14, lineHeight: 18 },
});
