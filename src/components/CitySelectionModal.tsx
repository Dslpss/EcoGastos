import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

interface CitySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (city: string | null) => void;
  currentCity: string | null;
}

export const CitySelectionModal: React.FC<CitySelectionModalProps> = ({ visible, onClose, onSelectCity, currentCity }) => {
  const { theme } = useFinance();
  const [city, setCity] = useState(currentCity || '');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (city.trim()) {
      onSelectCity(city.trim());
      onClose();
    }
  };

  const handleUseLocation = () => {
    onSelectCity(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Alterar Cidade</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textLight} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.textLight }]}>
            Digite o nome da sua cidade para ver a previsão do tempo.
          </Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background, 
              color: theme.text,
              borderColor: theme.gray 
            }]}
            placeholder="Ex: São Paulo, Londres, Nova York"
            placeholderTextColor={theme.textLight}
            value={city}
            onChangeText={setCity}
            autoFocus
          />

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.locationButton, { borderColor: theme.primary }]} 
              onPress={handleUseLocation}
            >
              <Ionicons name="location" size={18} color={theme.primary} />
              <Text style={[styles.locationButtonText, { color: theme.primary }]}>
                Usar Localização Atual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.primary }]} 
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
