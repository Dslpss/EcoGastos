import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { FinanceProvider, useFinance } from './src/context/FinanceContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from './src/constants';
import { AppConfigProvider, useAppConfig } from './src/context/AppConfigContext';
import { MaintenanceScreen } from './src/screens/MaintenanceScreen';
import { UpdateScreen } from './src/screens/UpdateScreen';

const ConfigWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMaintenance, hasUpdate, isForceUpdate } = useAppConfig();
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Sync showUpdate with hasUpdate from context
    setShowUpdate(hasUpdate);
  }, [hasUpdate]);

  if (isMaintenance) {
    return <MaintenanceScreen />;
  }

  return (
    <>
      {children}
      <UpdateScreen 
        visible={showUpdate || isForceUpdate} 
        onClose={() => !isForceUpdate && setShowUpdate(false)} 
      />
    </>
  );
};

const AuthWrapper = () => {
  const { settings, isLoading } = useFinance();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const appState = React.useRef(AppState.currentState);
  const isAuthenticating = React.useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming to foreground
        checkAuth();
      } else if (nextAppState === 'background' && settings.biometricsEnabled) {
        // App going to background - lock it
        setIsAuthenticated(false);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [settings.biometricsEnabled]);

  useEffect(() => {
    checkAuth();
  }, [settings.biometricsEnabled, isLoading]);

  const checkAuth = async () => {
    if (isLoading) return;
    if (isAuthenticating.current) return;

    if (!settings.biometricsEnabled) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    try {
      isAuthenticating.current = true;
      setIsChecking(true);

      // Small delay to ensure Activity is fully resumed/ready on Android
      await new Promise(resolve => setTimeout(resolve, 500));

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
      isAuthenticating.current = false;
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
      <AppConfigProvider>
        <AuthProvider>
          <FinanceProvider>
            <ConfigWrapper>
              <AuthWrapper />
            </ConfigWrapper>
            <StatusBar style="auto" />
          </FinanceProvider>
        </AuthProvider>
      </AppConfigProvider>
    </SafeAreaProvider>
  );
}

