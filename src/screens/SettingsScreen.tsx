import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { AIAssistantModal } from '../components/AIAssistantModal';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Application from 'expo-application';
import { Header } from '../components/Header';
import { generateFinancialReport } from '../services/pdfService';

export const SettingsScreen = () => {
  const { userProfile, settings, updateSettings, theme, balance, expenses, incomes, categories, clearData, restoreData } = useFinance();
  const { logout, currentUser } = useAuth();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false);

  // ... (rest of the code)


  
  const handleClearData = async () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Tem certeza absoluta? Isso apagará todos os seus gastos, categorias e contas. Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Apagar Tudo', 
          style: 'destructive',
          onPress: async () => {
            await clearData();
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    try {
      // Use data from FinanceContext (loaded from backend) instead of AsyncStorage
      const backupData = {
        exportDate: new Date().toISOString(),
        balance,
        expenses,
        incomes,
        categories,
        userProfile,
        settings,
      };

      const hasData = expenses.length > 0 || incomes.length > 0 || balance !== 0;
      
      if (hasData) {
        await Share.share({
          message: JSON.stringify(backupData, null, 2),
          title: 'Backup EcoGastos'
        });
      } else {
        Alert.alert('Info', 'Não há dados para exportar.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados.');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        Alert.alert('Erro', 'Não foi possível acessar o arquivo.');
        return;
      }

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      
      // Parse JSON
      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        Alert.alert('Erro', 'Arquivo JSON inválido.');
        return;
      }

      // Confirm restoration
      Alert.alert(
        'Restaurar Dados',
        'Isso substituirá todos os seus dados atuais. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              await restoreData(backupData);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Erro', 'Falha ao importar dados.');
    }
  };

  const toggleBiometrics = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Erro', 'Biometria não disponível ou não configurada neste dispositivo.');
        return;
      }
    }
    updateSettings({ biometricsEnabled: value });
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Notificações',
        'As notificações foram ativadas! (Simulação: Funcionalidade requer Development Build no Expo SDK 53+)'
      );
    }
    updateSettings({ notificationsEnabled: value });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: theme.textLight }]}>{title}</Text>
  );

  const renderItem = (icon: keyof typeof Ionicons.glyphMap, title: string, subtitle?: string, rightElement?: React.ReactNode, onPress?: () => void, color: string = theme.primary) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.itemSubtitle, { color: theme.textLight }]}>{subtitle}</Text>}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
       <LinearGradient
        colors={[theme.background, theme.card]}
        style={styles.background}
      />
      
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Header title="Ajustes" />

          {/* Profile Card */}
          <View style={[styles.profileCard, { shadowColor: theme.primary }]}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={40} color="#FFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                <Text style={styles.profileEmail}>{userProfile.email}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsProfileModalVisible(true)}>
                <Ionicons name="pencil" size={20} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Preferences Section */}
          {renderSectionHeader('PREFERÊNCIAS')}
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            {renderItem(
              'moon', 
              'Modo Escuro', 
              'Aparência do aplicativo',
              <Switch 
                value={settings.isDarkMode} 
                onValueChange={(val) => updateSettings({ isDarkMode: val })} 
                trackColor={{ false: theme.gray, true: theme.primary }}
              />,
              undefined,
              '#5E35B1'
            )}
            <View style={[styles.separator, { backgroundColor: theme.gray }]} />
            {renderItem(
              'notifications', 
              'Notificações', 
              'Lembretes de contas',
              <Switch 
                value={settings.notificationsEnabled} 
                onValueChange={toggleNotifications}
                trackColor={{ false: theme.gray, true: theme.success }}
              />,
              undefined,
              '#E91E63'
            )}
             <View style={[styles.separator, { backgroundColor: theme.gray }]} />
            {renderItem(
              'finger-print', 
              'Biometria', 
              'Proteger acesso ao app',
              <Switch 
                value={settings.biometricsEnabled} 
                onValueChange={toggleBiometrics}
                trackColor={{ false: theme.gray, true: theme.primary }}
              />,
              undefined,
              '#009688'
            )}
          </View>


          {/* Data Section */}
          {renderSectionHeader('DADOS & PRIVACIDADE')}
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            {renderItem(
              'cloud-upload', 
              'Backup de Dados', 
              'Exportar JSON',
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />,
              handleExportData,
              '#2196F3'
            )}
            <View style={[styles.separator, { backgroundColor: theme.gray }]} />
            {renderItem(
              'cloud-download', 
              'Restaurar Dados', 
              'Importar backup JSON',
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />,
              handleImportData,
              '#4CAF50'
            )}
            <View style={[styles.separator, { backgroundColor: theme.gray }]} />
            {renderItem(
              'trash', 
              'Limpar Tudo', 
              'Apagar todos os registros',
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />,
              handleClearData,
              '#F44336'
            )}
          </View>

          {/* AI Assistant Section */}
          {renderSectionHeader('ASSISTENTE IA')}
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            {renderItem(
              'chatbubbles', 
              'EcoBot', 
              'Seu assistente financeiro inteligente',
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />,
              () => setIsAIAssistantVisible(true),
              '#9C27B0'
            )}
          </View>

          {/* Reports Section */}
          {renderSectionHeader('RELATÓRIOS')}
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            {renderItem(
              'document-text', 
              'Relatório Financeiro', 
              'Gerar PDF detalhado',
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />,
              async () => {
                try {
                  
                  // Calculate totals
                  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
                  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
                  
                  // Prepare transactions (last 20)
                  const transactions = [
                    ...expenses.map(e => {
                      const category = categories.find(c => c.id === e.categoryId);
                      return { ...e, type: 'expense', category: category ? category.name : 'Geral' };
                    }),
                    ...incomes.map(i => ({ ...i, type: 'income', category: 'Receita' }))
                  ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20);

                  await generateFinancialReport({
                    balance,
                    income: totalIncome,
                    expenses: totalExpenses,
                    transactions,
                    userName: userProfile.name
                  });
                } catch (error) {
                  Alert.alert('Erro', 'Não foi possível gerar o relatório.');
                  console.error(error);
                }
              },
              '#FF9800'
            )}
          </View>

          {/* Account Section */}
          {renderSectionHeader('CONTA')}
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            {renderItem(
              'person-circle', 
              'Usuário Logado', 
              currentUser?.email || userProfile.email,
              undefined,
              undefined,
              '#4A90E2'
            )}
            <View style={[styles.separator, { backgroundColor: theme.gray }]} />
            {renderItem(
              'log-out', 
              'Sair da Conta', 
              'Fazer logout do aplicativo',
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />,
              handleLogout,
              '#FF5252'
            )}
          </View>

          {/* About Section */}
          {renderSectionHeader('SOBRE')}
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            {renderItem(
              'information-circle', 
              'Versão', 
              `${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
              undefined,
              undefined,
              theme.textLight
            )}
            <View style={[styles.separator, { backgroundColor: theme.gray }]} />
            {renderItem(
              'code-slash', 
              'Desenvolvedor', 
              'DennisEmannuel_DEV',
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />,
              () => {
                const { Linking } = require('react-native');
                Linking.openURL('https://www.instagram.com/programadorbyte/');
              },
              theme.textLight
            )}
          </View>

          <Text style={[styles.footerText, { color: theme.textLight }]}>EcoGastos © 2025</Text>

        </ScrollView>
      </SafeAreaView>

      <EditProfileModal 
        visible={isProfileModalVisible} 
        onClose={() => setIsProfileModalVisible(false)} 
      />

      <AIAssistantModal
        visible={isAIAssistantVisible}
        onClose={() => setIsAIAssistantVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileCard: {
    marginBottom: 30,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 10,
    letterSpacing: 1,
  },
  sectionContainer: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 68,
    opacity: 0.3,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
    opacity: 0.5,
  },
});
