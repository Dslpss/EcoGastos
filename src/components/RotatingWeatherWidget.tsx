import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RotatingWeatherWidgetProps {
  weather: {
    temperature: number;
    city: string;
    icon: any;
    humidity?: number;
    windSpeed?: number;
  };
  theme: any;
  onPress: () => void;
}

export const RotatingWeatherWidget: React.FC<RotatingWeatherWidgetProps> = ({ weather, theme, onPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const weatherInfo = [
    {
      icon: weather.icon,
      value: `${weather.temperature}°C`,
      label: weather.city.split(',')[0],
      color: theme.primary,
    },
    ...(weather.humidity !== undefined ? [{
      icon: 'water-outline' as any,
      value: `${weather.humidity}%`,
      label: 'Umidade',
      color: theme.primary,
    }] : []),
    ...(weather.windSpeed !== undefined ? [{
      icon: 'speedometer-outline' as any,
      value: `${weather.windSpeed} km/h`,
      label: 'Vento',
      color: theme.primary,
    }] : []),
  ];

  useEffect(() => {
    if (weatherInfo.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change content
        setCurrentIndex((prev) => (prev + 1) % weatherInfo.length);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [weatherInfo.length]);

  const current = weatherInfo[currentIndex];

  return (
    <TouchableOpacity 
      style={[styles.widget, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Ionicons name={current.icon} size={24} color={current.color} style={{ marginRight: 8 }} />
        <View>
          <Text style={[styles.widgetValue, { color: theme.text }]}>
            {current.value}
          </Text>
          <Text style={[styles.widgetLabel, { color: theme.textLight }]}>
            {current.label}
          </Text>
        </View>
      </Animated.View>
      
      {/* Indicator dots */}
      {weatherInfo.length > 1 && (
        <View style={styles.indicators}>
          {weatherInfo.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentIndex ? theme.primary : theme.textLight,
                  opacity: index === currentIndex ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  widget: {
    flexDirection: 'column',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    minWidth: 120,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
