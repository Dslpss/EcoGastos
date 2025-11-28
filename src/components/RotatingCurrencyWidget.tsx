import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RotatingCurrencyWidgetProps {
  theme: any;
  onPress: () => void;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  bid: string;
}

export const RotatingCurrencyWidget: React.FC<RotatingCurrencyWidgetProps> = ({ theme, onPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      
      // Try AwesomeAPI first
      try {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL');
        
        if (response.status !== 429 && response.ok) {
          const data = await response.json();
          const currencyList: CurrencyInfo[] = [];

          if (data.USDBRL) {
            currencyList.push({
              code: 'USD',
              symbol: '$',
              bid: parseFloat(data.USDBRL.bid).toFixed(2),
            });
          }

          if (data.EURBRL) {
            currencyList.push({
              code: 'EUR',
              symbol: '€',
              bid: parseFloat(data.EURBRL.bid).toFixed(2),
            });
          }

          if (data.GBPBRL) {
            currencyList.push({
              code: 'GBP',
              symbol: '£',
              bid: parseFloat(data.GBPBRL.bid).toFixed(2),
            });
          }

          setCurrencies(currencyList);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('AwesomeAPI failed, using fallback');
      }

      // Fallback to Frankfurter
      const currencyList: CurrencyInfo[] = [];
      
      const usdResponse = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL');
      const usdData = await usdResponse.json();
      if (usdData.rates?.BRL) {
        currencyList.push({
          code: 'USD',
          symbol: '$',
          bid: usdData.rates.BRL.toFixed(2),
        });
      }

      const eurResponse = await fetch('https://api.frankfurter.app/latest?from=EUR&to=BRL');
      const eurData = await eurResponse.json();
      if (eurData.rates?.BRL) {
        currencyList.push({
          code: 'EUR',
          symbol: '€',
          bid: eurData.rates.BRL.toFixed(2),
        });
      }

      const gbpResponse = await fetch('https://api.frankfurter.app/latest?from=GBP&to=BRL');
      const gbpData = await gbpResponse.json();
      if (gbpData.rates?.BRL) {
        currencyList.push({
          code: 'GBP',
          symbol: '£',
          bid: gbpData.rates.BRL.toFixed(2),
        });
      }

      setCurrencies(currencyList);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currencies.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change content
        setCurrentIndex((prev) => (prev + 1) % currencies.length);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [currencies.length]);

  if (loading || currencies.length === 0) {
    return (
      <TouchableOpacity 
        style={[styles.widget, { backgroundColor: theme.card }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name="cash-outline" size={24} color={theme.success} style={{ marginRight: 8 }} />
        <View>
          <Text style={[styles.widgetValue, { color: theme.text }]}>
            --
          </Text>
          <Text style={[styles.widgetLabel, { color: theme.textLight }]}>
            Carregando...
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const current = currencies[currentIndex];

  return (
    <TouchableOpacity 
      style={[styles.widget, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Ionicons name="cash-outline" size={24} color={theme.success} style={{ marginRight: 8 }} />
        <View>
          <Text style={[styles.widgetValue, { color: theme.text }]}>
            R$ {current.bid}
          </Text>
          <Text style={[styles.widgetLabel, { color: theme.textLight }]}>
            {current.symbol} {current.code}
          </Text>
        </View>
      </Animated.View>
      
      {/* Indicator dots */}
      {currencies.length > 1 && (
        <View style={styles.indicators}>
          {currencies.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentIndex ? theme.success : theme.textLight,
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
