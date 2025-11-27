import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<Props> = ({ visible, onClose }) => {
  const { userProfile, updateUserProfile, theme } = useFinance();
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [savingsGoal, setSavingsGoal] = useState(userProfile.savingsGoal?.toString() || '');

  useEffect(() => {
    if (visible) {
      setName(userProfile.name);
      setEmail(userProfile.email);
      setSavingsGoal(userProfile.savingsGoal?.toString() || '');
    }
  }, [userProfile, visible]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      await updateUserProfile({ 
        name, 
        email,
        savingsGoal: savingsGoal ? parseFloat(savingsGoal.replace(',', '.')) : 0
      });
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { backgroundColor: theme.card }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Editar Perfil</Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.gray + '20' }]}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Name Input */}
              <Text style={[styles.label, { color: theme.textLight }]}>Nome</Text>
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="person-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={theme.textLight}
                />
              </View>

              {/* Email Input */}
              <Text style={[styles.label, { color: theme.textLight }]}>Email</Text>
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor={theme.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Savings Goal Input */}
              <Text style={[styles.label, { color: theme.textLight }]}>Meta de Economia (R$)</Text>
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                  placeholder="0,00"
                  placeholderTextColor={theme.textLight}
                  keyboardType="numeric"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButtonContainer, { shadowColor: theme.primary }]} 
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.primary, theme.secondary]}
                  style={styles.saveButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.saveIcon} />
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    borderRadius: 32,
    margin: 16,
    marginBottom: 34,
    padding: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  saveButtonContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  saveIcon: {
    marginLeft: 4,
  },
});
