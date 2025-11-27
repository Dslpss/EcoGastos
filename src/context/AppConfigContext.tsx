import React, { createContext, useState, useContext, useEffect } from 'react';
import { configAPI } from '../services/api';
import { Linking } from 'react-native';
import * as Application from 'expo-application';

interface AppConfig {
  is_maintenance: boolean;
  maintenance_message: string;
  has_update: boolean;
  update_message: string;
  update_url: string;
  force_update: boolean;
  show_warning: boolean;
  warning_message: string;
  latest_version: string;
}

interface AppConfigContextData {
  isLoading: boolean;
  isMaintenance: boolean;
  hasUpdate: boolean;
  isForceUpdate: boolean;
  maintenanceMessage: string;
  updateMessage: string;
  updateUrl: string;
  showWarning: boolean;
  warningMessage: string;
  refreshConfig: () => Promise<void>;
  openUpdateUrl: () => void;
}

const AppConfigContext = createContext<AppConfigContextData>({} as AppConfigContextData);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);

  const fetchConfig = async () => {
    try {
      const response = await configAPI.getConfig();
      if (response.success) {
        setConfig(response.data);
        checkVersion(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch app config', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compare versions: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  };

  const checkVersion = (config: AppConfig) => {
    // If has_update is false, no update
    if (!config.has_update) {
      setHasUpdate(false);
      return;
    }

    // If no latest_version specified, use has_update toggle (fallback)
    if (!config.latest_version) {
      setHasUpdate(true);
      return;
    }

    // Get current app version
    const currentVersion = Application.nativeApplicationVersion || '1.0.0';
    
    // Compare versions: show update if latest > current
    if (compareVersions(config.latest_version, currentVersion) > 0) {
      setHasUpdate(true);
    } else {
      setHasUpdate(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Poll every 5 minutes
    const interval = setInterval(() => {
      fetchConfig();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const openUpdateUrl = () => {
    if (config?.update_url) {
      Linking.openURL(config.update_url);
    }
  };

  return (
    <AppConfigContext.Provider value={{
      isLoading,
      isMaintenance: config?.is_maintenance || false,
      hasUpdate,
      isForceUpdate: config?.force_update || false,
      maintenanceMessage: config?.maintenance_message || '',
      updateMessage: config?.update_message || '',
      updateUrl: config?.update_url || '',
      showWarning: config?.show_warning || false,
      warningMessage: config?.warning_message || '',
      refreshConfig: fetchConfig,
      openUpdateUrl,
    }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
