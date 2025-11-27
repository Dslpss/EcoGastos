import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export const WarningCard: React.FC<Props> = ({ message, onDismiss }) => {
  const { theme } = useFinance();

  return (
    <View style={[styles.container, { backgroundColor: theme.warning + '15', borderColor: theme.warning }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.warning + '25' }]}>
        <Ionicons name="alert-circle" size={24} color={theme.warning} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.warning }]}>Aviso</Text>
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      </View>

      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color={theme.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
