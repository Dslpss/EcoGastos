import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../hooks/useWeather';
import { useCurrency } from '../hooks/useCurrency';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  showWeather?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showProfile, rightAction, showWeather = true }) => {
  const { theme, isValuesVisible, toggleValuesVisibility } = useFinance();
  const { weather, loading } = useWeather();
  const { currency } = useCurrency();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Top Row: Subtitle + Actions */}
      <View style={styles.topRow}>
        <View style={styles.subtitleContainer}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textLight }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.card }]}
            onPress={toggleValuesVisibility}
          >
            <Ionicons 
              name={isValuesVisible ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>

          {showProfile && (
            <TouchableOpacity 
              style={[styles.profileButton, { backgroundColor: theme.card, shadowColor: theme.primary }]}
              onPress={() => navigation.navigate('Ajustes')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.primary + '20', theme.secondary + '20']}
                style={styles.profileGradient}
              >
                <Ionicons name="person" size={20} color={theme.primary} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {rightAction && !showProfile && (
            <View style={styles.rightAction}>
              {rightAction}
            </View>
          )}
        </View>
      </View>

      {/* Main Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>
        <View style={[styles.underline, { backgroundColor: theme.primary }]} />
      </View>

      {/* Widgets Row: Weather & Currency */}
      {showWeather && (weather || currency) && (
        <View style={styles.widgetsContainer}>
          {weather && (
            <View style={[styles.widget, { backgroundColor: theme.card }]}>
              <Text style={styles.widgetIcon}>{weather.icon}</Text>
              <View>
                <Text style={[styles.widgetValue, { color: theme.text }]}>
                  {weather.temperature}°C
                </Text>
                <Text style={[styles.widgetLabel, { color: theme.textLight }]}>
                  {weather.city.split(',')[0]}
                </Text>
              </View>
            </View>
          )}

          {weather && currency && <View style={{ width: 12 }} />}

          {currency && (
            <View style={[styles.widget, { backgroundColor: theme.card }]}>
              <Text style={styles.widgetIcon}>💵</Text>
              <View>
                <Text style={[styles.widgetValue, { color: theme.text }]}>
                  R$ {currency.bid}
                </Text>
                <Text style={[styles.widgetLabel, { color: theme.textLight }]}>
                  Dólar
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      
      {showWeather && loading && !weather && (
        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitleContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 38,
  },
  underline: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  profileGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAction: {
    marginLeft: 8,
  },
  widgetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widget: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  widgetIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  widgetValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  widgetLabel: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
});
