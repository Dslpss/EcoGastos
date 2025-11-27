import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppConfig } from '../context/AppConfigContext';
import { useFinance } from '../context/FinanceContext';

const { width } = Dimensions.get('window');

export const MaintenanceScreen = () => {
  const { maintenanceMessage, refreshConfig } = useAppConfig();
  const { theme } = useFinance();

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.warning + '20' }]}>
          <Ionicons name="construct" size={40} color={theme.warning} />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Manutenção</Text>
        
        <Text style={[styles.message, { color: theme.textLight }]}>
          {maintenanceMessage || 'Estamos realizando melhorias. Voltaremos em breve!'}
        </Text>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={refreshConfig}
        >
          <Text style={styles.buttonText}>Tentar Novamente</Text>
          <Ionicons name="refresh" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  card: {
    width: width - 40,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
