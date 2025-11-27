import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppConfig } from '../context/AppConfigContext';
import { useFinance } from '../context/FinanceContext';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const UpdateScreen: React.FC<Props> = ({ visible, onClose }) => {
  const { updateMessage, openUpdateUrl, isForceUpdate } = useAppConfig();
  const { theme } = useFinance();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { backgroundColor: isForceUpdate ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="cloud-download" size={40} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Nova Versão Disponível</Text>
          
          <Text style={[styles.message, { color: theme.textLight }]}>
            {updateMessage || 'Uma nova versão do aplicativo está disponível. Atualize para aproveitar as novidades!'}
          </Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={openUpdateUrl}
          >
            <Text style={styles.buttonText}>Atualizar Agora</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {!isForceUpdate && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textLight }]}>Lembrar depois</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
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
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 16,
    padding: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
