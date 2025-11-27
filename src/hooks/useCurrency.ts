import { useState, useEffect } from 'react';

interface CurrencyData {
  bid: string;
  change: string;
}

// Global cache
let currencyCache: {
  data: CurrencyData;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrency();
  }, []);

  const getCurrency = async () => {
    try {
      if (currencyCache && Date.now() - currencyCache.timestamp < CACHE_DURATION) {
        console.log('📦 Using cached currency data');
        setCurrency(currencyCache.data);
        setLoading(false);
        return;
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
