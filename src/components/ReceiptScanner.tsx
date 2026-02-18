import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ReceiptScannerProps {
  onScanComplete: (data: any) => void;
  theme: any;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, theme }) => {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth(); // Just to ensure we're logged in if needed

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para escanear recibos.');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para escanear recibos.');
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        analyzeReceipt(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const analyzeReceipt = async (imageUri: string) => {
    setLoading(true);
    try {
       // Create form data
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      } as any);

      // We need to use fetch directly because axios with FormData + React Native + Expo can be tricky
      // But let's try to use our api instance if possible or fallback to fetch
      // For file uploads in RN, usually we need proper content-type header
      
      // Let's use FileSystem.uploadAsync for better reliability with Expo
      // We need the token from our api service or auth context, but interceptors are in axios
      // So let's try axios first, if it fails we fall back.
      
      const response = await api.post('/ai/analyze-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          return data; // Prevent axios from stringifying FormData
        },
      });

      if (response.data.success) {
        onScanComplete(response.data.data);
      } else {
        throw new Error(response.data.message || 'Falha na análise');
      }

    } catch (error: any) {
      console.error('Error analyzing receipt:', error);
      Alert.alert('Erro na Análise', 'Não conseguimos ler os dados do recibo. Tente novamente com uma foto mais nítida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Escanear Recibo com IA</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textLight }]}>Analisando recibo...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1 }]}
            onPress={() => pickImage(true)}
          >
            <Ionicons name="camera" size={24} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>Câmera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.card, borderColor: theme.textLight, borderWidth: 1 }]}
            onPress={() => pickImage(false)}
          >
            <Ionicons name="images" size={24} color={theme.textLight} />
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Galeria</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  }
});
