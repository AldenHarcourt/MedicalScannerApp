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
import { exportToCsv } from '../csv';

// --- Supabase Configuration ---
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://igklbxroasakiknvwlbj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlna2xieHJvYXNha2lrbnZ3bGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNTEwMDMsImV4cCI6MjA2NjYyNzAwM30.Rhrh7dydLCkqfsi6ooae01bGZsRE94Qnb-qilxtLrp8';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginAttempt, setLoginAttempt] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingScan = useRef(false);

  // --- Login Handler ---
  const handleLogin = async () => {
    if (!loginAttempt) {
        Alert.alert('Login Failed', 'Please enter an access code.');
        return;
    }
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        Alert.alert('Configuration Error', 'Please update the Supabase URL and Key in the App.js file.');
        return;
    }

    setIsLoginLoading(true);
    try {
        // Construct the query URL
        const query = new URLSearchParams({
            select: '*', // Select all columns
            code: `eq.${loginAttempt}` // Where 'code' equals the login attempt
        }).toString();

        const response = await fetch(`${SUPABASE_URL}/rest/v1/access_codes?${query}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const data = await response.json();

        if (response.ok && data.length > 0) {
            // Because of our RLS policy, the database will only return a result if the code is valid AND not expired.
            setIsAuthenticated(true);
        } else {
            Alert.alert('Login Failed', 'The access code is invalid or has expired.');
            setLoginAttempt('');
        }
    } catch (error) {
        console.error("Login error:", error);
        Alert.alert('Login Error', 'Could not connect to the authentication server. Please check your internet connection.');
    } finally {
        setIsLoginLoading(false);
    }
  };


  // --- Effects ---
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);
  
  // --- Handlers ---
  const handleBarCodeScanned = async ({ data }) => {
    if (isProcessingScan.current) {
      return;
    }
    isProcessingScan.current = true;
    
    setIsScanning(false);
    setIsLoading(true);

    try {
      const apiData = await fetchDeviceData(data);
      setFormData(apiData);
    } catch (error) {
      Alert.alert('API Error', error.message || 'Could not fetch device data.');
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
      isProcessingScan.current = false;
      setIsScanning(true);
  }
  
  const stopScanning = () => {
      setIsScanning(false);
  }

  // --- Render Functions ---

  const renderLoginScreen = () => (
    <View style={styles.loginContainer}>
        <StatusBar style="light" />
        <FontAwesome name="shield" size={60} color={colors.primary} />
        <Text style={styles.loginTitle}>App Locked</Text>
        <Text style={styles.loginSubtitle}>Please enter your access code.</Text>
        <TextInput
            style={styles.loginInput}
            placeholder="Access Code"
            placeholderTextColor="#555"
            value={loginAttempt}
            onChangeText={setLoginAttempt}
            secureTextEntry
            autoCapitalize="none"
        />
        {isLoginLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }}/>
        ) : (
            <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={handleLogin}>
                <Text style={styles.buttonText}>Unlock</Text>
            </TouchableOpacity>
        )}
    </View>
  );

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
                onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "code128", "datamatrix", "pdf417", "ean13"],
                }}
                style={StyleSheet.absoluteFillObject}
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
        
        {renderForm()}
        {renderTable()}

      </ScrollView>
    </SafeAreaView>
  );

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
            <View key={index} style={[styles.tableRow, styles.dataRow]}>
              {formFields.map(f => <Text key={f.id} style={[styles.tableCell, {width: 120}]}>{item[f.id]}</Text>)}
               <TouchableOpacity onPress={() => removeItem(index)} style={[styles.tableCell, {width: 80, alignItems: 'center'}]}>
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

  if (!permission.granted && !isAuthenticated) {
    return (
      <View style={[styles.screen, {justifyContent: 'center'}]}>
        <Text style={{ textAlign: 'center', marginBottom: 10, color: '#eee' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" color={colors.primary}/>
      </View>
    );
  }

  return isAuthenticated ? renderApp() : renderLoginScreen();
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
});
