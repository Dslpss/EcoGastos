import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../hooks/useWeather';

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
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          {showWeather && weather && (
            <View style={styles.weatherContainer}>
              <Text style={styles.weatherIcon}>{weather.icon}</Text>
              <View>
                <Text style={[styles.weatherTemp, { color: theme.text }]}>
                  {weather.temperature}°C
                </Text>
                <Text style={[styles.weatherCity, { color: theme.textLight }]}>
                  {weather.city}
                </Text>
              </View>
            </View>
          )}
          {showWeather && loading && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 8 }} />
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textLight }]}>
              {subtitle}
            </Text>
          )}
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>
          <View style={[styles.underline, { backgroundColor: theme.primary }]} />
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.card }]}
            onPress={toggleValuesVisibility}
          >
            <Ionicons 
              name={isValuesVisible ? "eye-outline" : "eye-off-outline"} 
              size={22} 
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
                <Ionicons name="person" size={22} color={theme.primary} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    marginLeft: 12,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '700',
  },
  weatherCity: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
});
