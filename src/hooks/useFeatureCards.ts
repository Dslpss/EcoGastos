import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface FeatureCard {
  _id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  backgroundColor: string;
  enabled: boolean;
  order: number;
  action: {
    type: 'navigate' | 'modal' | 'external';
    target: string;
    params?: any;
  };
}

const CACHE_KEY = '@eco_gastos_feature_cards';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cardsCache: {
  data: FeatureCard[];
  timestamp: number;
} | null = null;

export const useFeatureCards = () => {
  const [cards, setCards] = useState<FeatureCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!force) {
        // Check memory cache
        if (cardsCache && Date.now() - cardsCache.timestamp < CACHE_DURATION) {
          console.log('📦 Using cached feature cards');
          setCards(cardsCache.data);
          setLoading(false);
          return;
        }

        // Check AsyncStorage cache
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            console.log('💾 Using stored feature cards');
            setCards(parsed.data);
            cardsCache = parsed;
            setLoading(false);
            return;
          }
        }
      }

      // Fetch from API
      console.log('🌐 Fetching feature cards from API...');
      const response = await api.get('/feature-cards');
      const data = response.data;
      
      // Update state and cache
      setCards(data);
      
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      
      cardsCache = cacheData;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      console.log(`✅ Loaded ${data.length} feature cards`);
    } catch (err: any) {
      console.error('❌ Error fetching feature cards:', err);
      setError(err.message);
      // If error, try to use any cached data even if expired
      if (cardsCache) {
        setCards(cardsCache.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchCards(true);
  };

  return { cards, loading, error, refresh };
};
