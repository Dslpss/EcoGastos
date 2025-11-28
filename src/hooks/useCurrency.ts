import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CurrencyData {
  bid: string;
  change: string;
}

// Global cache
let currencyCache: {
  data: CurrencyData;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = '@eco_gastos_currency_cache';

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrency();
  }, []);

  const getCurrency = async () => {
    try {
      // Check memory cache first
      if (currencyCache && Date.now() - currencyCache.timestamp < CACHE_DURATION) {
        console.log('📦 Using memory cached currency data');
        setCurrency(currencyCache.data);
        setLoading(false);
        return;
      }

      // Check persistent storage
      const storedCache = await AsyncStorage.getItem(CACHE_KEY);
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
          console.log('💾 Using stored currency data');
          setCurrency(parsedCache.data);
          currencyCache = parsedCache; // Update memory cache
          setLoading(false);
          return;
        }
      }

      console.log('💲 Fetching currency...');
      
      let bid = '';
      let change = '';

      try {
        // Try AwesomeAPI first (Real-time)
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        
        if (!response.ok) {
          throw new Error(`AwesomeAPI Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('💲 AwesomeAPI response:', data);

        if (data.USDBRL) {
          bid = parseFloat(data.USDBRL.bid).toFixed(2);
          change = data.USDBRL.pctChange;
        }
      } catch (primaryError) {
        console.log('⚠️ AwesomeAPI failed, trying fallback (Frankfurter)...', primaryError);
        
        // Fallback to Frankfurter (Daily updates, very reliable)
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL');
        const data = await response.json();
        console.log('💲 Frankfurter response:', data);

        if (data.rates && data.rates.BRL) {
          bid = data.rates.BRL.toFixed(2);
          change = '0';
        }
      }

      if (bid) {
        const newData = { bid, change };
        
        console.log('✅ Currency set:', newData);
        setCurrency(newData);
        
        currencyCache = {
          data: newData,
          timestamp: Date.now(),
        };

        // Save to storage
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(currencyCache));
      } else {
        throw new Error('All currency APIs failed');
      }
    } catch (error) {
      console.error('❌ Error fetching currency:', error);
    } finally {
      setLoading(false);
    }
  };

  return { currency, loading };
};
