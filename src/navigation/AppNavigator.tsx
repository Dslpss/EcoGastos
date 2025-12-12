import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { IncomesScreen } from '../screens/IncomesScreen';
import { RecurringBillsScreen } from '../screens/RecurringBillsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { FloatingAIButton } from '../components/FloatingAIButton';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  const { theme } = useFinance();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        // Define colors for each route
        const getRouteColor = () => {
          switch (route.name) {
            case 'Dashboard': return '#4A90E2'; // Blue
            case 'Gastos': return '#FF5252';    // Red
            case 'Contas': return '#FFC107';    // Amber
            case 'Categorias': return '#9C27B0'; // Purple
            case 'Ajustes': return '#607D8B';   // Blue Grey
            default: return theme.primary;
          }
        };

        const activeColor = getRouteColor();

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            height: Platform.OS === 'ios' ? 85 : 70,
            paddingBottom: Platform.OS === 'ios' ? 25 : 12,
            paddingTop: 8,
          },
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: theme.textLight,
          tabBarIcon: ({ focused, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            let iconColor: string;

            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'grid' : 'grid-outline';
                iconColor = '#4A90E2';
                break;
              case 'Gastos':
                iconName = focused ? 'wallet' : 'wallet-outline';
                iconColor = '#FF5252';
                break;
              case 'Contas':
                iconName = focused ? 'calendar' : 'calendar-outline';
                iconColor = '#FFC107';
                break;
              case 'Categorias':
                iconName = focused ? 'list' : 'list-outline';
                iconColor = '#9C27B0';
                break;
              case 'Ajustes':
                iconName = focused ? 'settings' : 'settings-outline';
                iconColor = '#607D8B';
                break;
              default:
                iconName = 'help';
                iconColor = theme.textLight;
            }
            
            return <Ionicons name={iconName} size={size} color={iconColor} style={{ opacity: focused ? 1 : 0.7 }} />;
          },
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Gastos" component={ExpensesScreen} />
      <Tab.Screen name="Contas" component={RecurringBillsScreen} />
      <Tab.Screen name="Categorias" component={CategoriesScreen} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { theme } = useFinance();
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <View style={{ flex: 1 }}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="Incomes" component={IncomesScreen} />
          </Stack.Navigator>
          <FloatingAIButton />
        </View>
      )}
    </NavigationContainer>
  );
};
