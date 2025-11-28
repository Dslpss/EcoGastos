import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WeatherData {
  temperature: number;
  city: string;
  condition: string;
  icon: string;
}

// Global cache to persist data between navigations
let weatherCache: {
  data: WeatherData;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    loadSavedCity();
  }, []);

  useEffect(() => {
    if (userCity !== undefined) {
      getWeather();
    }
  }, [userCity]);

  const loadSavedCity = async () => {
    try {
      const saved = await AsyncStorage.getItem('@eco_gastos_user_city');
      // If saved is null, it means use current location (default behavior)
      // We set userCity to undefined or empty string to trigger initial fetch?
      // Actually, let's treat 'null' as "not loaded yet" or "use GPS"
      // If we want to be explicit:
      setUserCity(saved); // saved can be null (GPS) or string (Manual)
    } catch (e) {
      console.error('Failed to load city', e);
      setUserCity(null);
    }
  };

  const updateCity = async (city: string | null) => {
    try {
      if (city) {
        await AsyncStorage.setItem('@eco_gastos_user_city', city);
      } else {
        await AsyncStorage.removeItem('@eco_gastos_user_city');
      }
      setUserCity(city);
      setLoading(true);
      // Effect will trigger getWeather
    } catch (e) {
      console.error('Failed to save city', e);
    }
  };

  const getWeather = async () => {
    try {
      // Check cache first
      if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
        console.log('📦 Using cached weather data');
        setWeather(weatherCache.data);
        setLoading(false);
        return;
      }

      console.log('🌤️ Starting weather fetch...');
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Permission denied');
        setError('Permission denied');
        setLoading(false);
        return;
      }

      let latitude, longitude;

      if (userCity) {
        console.log(`🔍 Searching for city: ${userCity}`);
        // Geocode the manually entered city
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(userCity)}&count=1&language=pt&format=json`;
        const geoResponse = await fetch(geocodeUrl);
        const geoData = await geoResponse.json();

        if (geoData.results && geoData.results.length > 0) {
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
          console.log(`✅ Found coordinates for ${userCity}: ${latitude}, ${longitude}`);
        } else {
          throw new Error('Cidade não encontrada');
        }
      } else {
        // Get current location with fallback
        console.log('📡 Getting location...');
        let location = await Location.getLastKnownPositionAsync();

        if (!location) {
          console.log('⚠️ No last known location, requesting current position...');
          location = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Location timeout')), 15000)
            )
          ]) as any;
        }

        if (!location) {
          throw new Error('Could not get location');
        }

        console.log('✅ Location:', location.coords);
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      // Fetch weather data from Open-Meteo (free, no API key needed!)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
      console.log('🌐 Fetching weather from Open-Meteo...');

      const response = await fetch(url);
      const data = await response.json();
      console.log('📦 Weather response:', response.ok, data);

      if (response.ok && data.current_weather) {
        let cityName = 'Sua localização';

        try {
          // Get city name from reverse geocoding
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'EcoGastosApp/1.0', // Required by Nominatim
            },
          });
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            cityName = geocodeData.address?.city || 
                      geocodeData.address?.town || 
                      geocodeData.address?.village || 
                      geocodeData.address?.municipality ||
                      geocodeData.address?.state || 
                      'Sua localização';
          }
        } catch (geoError) {
          console.log('⚠️ Geocoding error:', geoError);
          // Continue with default city name if geocoding fails
        }

        const newWeather = {
          temperature: Math.round(data.current_weather.temperature),
          city: cityName,
          condition: getWeatherCondition(data.current_weather.weathercode),
          icon: getWeatherIconFromCode(data.current_weather.weathercode),
        };

        setWeather(newWeather);
        
        // Update cache
        weatherCache = {
          data: newWeather,
          timestamp: Date.now(),
        };
        
        console.log('✅ Weather set and cached successfully');
      } else {
        console.log('❌ Weather API error:', data);
        setError('Failed to fetch weather');
      }
    } catch (err: any) {
      console.error('❌ Weather error:', err.message);
      setError(err.message || 'Error fetching weather');
    } finally {
      console.log('🏁 Finishing weather fetch');
      setLoading(false);
    }
  };

  const getWeatherIconFromCode = (code: number): string => {
    if (code === 0) return '☀️'; // Clear sky
    if (code <= 3) return '⛅'; // Partly cloudy
    if (code <= 48) return '🌫️'; // Fog
    if (code <= 67) return '🌧️'; // Rain
    if (code <= 77) return '🌨️'; // Snow
    if (code <= 82) return '🌦️'; // Rain showers
    if (code <= 86) return '🌨️'; // Snow showers
    if (code <= 99) return '⛈️'; // Thunderstorm
    return '🌤️'; // Default
  };

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Céu limpo';
    if (code === 1) return 'Principalmente limpo';
    if (code === 2) return 'Parcialmente nublado';
    if (code === 3) return 'Nublado';
    if (code <= 48) return 'Névoa';
    if (code <= 67) return 'Chuva';
    if (code <= 77) return 'Neve';
    if (code <= 82) return 'Pancadas de chuva';
    if (code <= 86) return 'Pancadas de neve';
    if (code <= 99) return 'Tempestade';
    return 'Clima variável';
  };

  return { weather, loading, error, userCity: userCity || null, updateCity };
};
