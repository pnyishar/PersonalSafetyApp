import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeApp } from './src/utils/appInitializer';
import { COLORS } from './src/constants';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeAppAsync();
  }, []);

  const initializeAppAsync = async () => {
    try {
      const success = await initializeApp();
      if (!success) {
        setInitError('Failed to initialize app');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      setInitError('Initialization error occurred');
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Personal Safety</Text>
        <Text style={styles.loadingSubtext}>Initializing...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
