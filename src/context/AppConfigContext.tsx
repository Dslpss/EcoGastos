import React, { createContext, useState, useContext, useEffect } from 'react';
import { configAPI } from '../services/api';
import { Linking } from 'react-native';

interface AppConfig {
  is_maintenance: boolean;
  maintenance_message: string;
  has_update: boolean;
  update_message: string;
  update_url: string;
  force_update: boolean;
}

interface AppConfigContextData {
  isLoading: boolean;
  isMaintenance: boolean;
  hasUpdate: boolean;
  isForceUpdate: boolean;
  maintenanceMessage: string;
  updateMessage: string;
  updateUrl: string;
  refreshConfig: () => Promise<void>;
  openUpdateUrl: () => void;
}

const AppConfigContext = createContext<AppConfigContextData>({} as AppConfigContextData);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await configAPI.getConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch app config', error);
    } finally {
      setIsLoading(false);
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
      hasUpdate: config?.has_update || false,
      isForceUpdate: config?.force_update || false,
      maintenanceMessage: config?.maintenance_message || '',
      updateMessage: config?.update_message || '',
      updateUrl: config?.update_url || '',
      refreshConfig: fetchConfig,
      openUpdateUrl,
    }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
