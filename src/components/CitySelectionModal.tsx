import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

interface CitySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (city: string | null) => void;
  currentCity: string | null;
}

interface CitySuggestion {
  name: string;
  country: string;
  admin1?: string; // State/Province
  latitude: number;
  longitude: number;
}

export const CitySelectionModal: React.FC<CitySelectionModalProps> = ({ visible, onClose, onSelectCity, currentCity }) => {
  const { theme } = useFinance();
  const [city, setCity] = useState(currentCity || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't search if input is too short
    if (city.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the search
    debounceTimer.current = setTimeout(() => {
      searchCities(city.trim());
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [city]);

  const searchCities = async (query: string) => {
    try {
      setLoading(true);
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const cities: CitySuggestion[] = data.results.map((result: any) => ({
          name: result.name,
          country: result.country,
          admin1: result.admin1,
          latitude: result.latitude,
          longitude: result.longitude,
        }));
        setSuggestions(cities);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    const cityName = suggestion.admin1 
      ? `${suggestion.name}, ${suggestion.admin1}` 
      : `${suggestion.name}, ${suggestion.country}`;
    setCity(cityName);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelectCity(cityName);
    onClose();
  };

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

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textLight }]}>
                Buscando cidades...
              </Text>
            </View>
          )}

          {/* Suggestions list */}
          {showSuggestions && suggestions.length > 0 && (
            <ScrollView 
              style={[styles.suggestionsContainer, { backgroundColor: theme.background }]}
              keyboardShouldPersistTaps="handled"
            >
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={`${suggestion.name}-${suggestion.latitude}-${index}`}
                  style={[
                    styles.suggestionItem,
                    { borderBottomColor: theme.gray }
                  ]}
                  onPress={() => handleSelectSuggestion(suggestion)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={20} color={theme.primary} />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={[styles.suggestionName, { color: theme.text }]}>
                      {suggestion.name}
                    </Text>
                    <Text style={[styles.suggestionDetails, { color: theme.textLight }]}>
                      {suggestion.admin1 ? `${suggestion.admin1}, ` : ''}{suggestion.country}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  suggestionsContainer: {
    maxHeight: 250,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionDetails: {
    fontSize: 13,
  },
});
