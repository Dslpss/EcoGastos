import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { FinanceProvider, useFinance } from './src/context/FinanceContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from './src/constants';

const AuthWrapper = () => {
  const { settings, isLoading } = useFinance();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [settings.biometricsEnabled, isLoading]);

  const checkAuth = async () => {
    if (isLoading) return;

    if (!settings.biometricsEnabled) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticação EcoGastos',
        fallbackLabel: 'Usar Senha',
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        // Retry or show error? For now, just stay on loading/locked screen
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading || (settings.biometricsEnabled && !isAuthenticated)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {settings.biometricsEnabled && !isAuthenticated && !isChecking && (
          <Text style={styles.authText} onPress={checkAuth}>Tentar Novamente</Text>
        )}
      </View>
    );
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  authText: {
    marginTop: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  }
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FinanceProvider>
          <AuthWrapper />
          <StatusBar style="auto" />
        </FinanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

