import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { LinearGradient } from 'expo-linear-gradient';
import { CitySelectionModal } from './CitySelectionModal';
import * as Location from 'expo-location';

interface WeatherDetailModalProps {
  visible: boolean;
  onClose: () => void;
  currentCity: string | null;
  onUpdateCity: (city: string | null) => void;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  humidity: number;
}

interface DetailedWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  hourlyForecast: HourlyForecast[];
}

export const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({ 
  visible, 
  onClose, 
  currentCity,
  onUpdateCity 
}) => {
  const { theme } = useFinance();
  const [weatherDetails, setWeatherDetails] = useState<DetailedWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityName, setCityName] = useState(currentCity || 'Sua localização');

  useEffect(() => {
    if (visible) {
      fetchWeatherDetails();
    }
  }, [visible, currentCity]);

  const fetchWeatherDetails = async () => {
    try {
      setLoading(true);
      
      // Get coordinates (either from city or current location)
      let latitude, longitude;
      
      if (currentCity) {
        // Geocode the city
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(currentCity)}&count=1&language=pt&format=json`;
        const geoResponse = await fetch(geocodeUrl);
        const geoData = await geoResponse.json();
        
        if (geoData.results && geoData.results.length > 0) {
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
          setCityName(currentCity);
        } else {
          throw new Error('Cidade não encontrada');
        }
      } else {
        // Use current GPS location
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('❌ Permission denied');
          setLoading(false);
          return;
        }

        // Get current location
        let location = await Location.getLastKnownPositionAsync();

        if (!location) {
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
          throw new Error('Não foi possível obter localização');
        }

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;

        // Get city name from reverse geocoding
        try {
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'EcoGastosApp/1.0',
            },
          });
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            const detectedCity = geocodeData.address?.city || 
                      geocodeData.address?.town || 
                      geocodeData.address?.village || 
                      geocodeData.address?.municipality ||
                      geocodeData.address?.state || 
                      'Sua localização';
            setCityName(detectedCity);
          }
        } catch (geoError) {
          console.log('⚠️ Geocoding error:', geoError);
          setCityName('Sua localização');
        }
      }

      // Fetch detailed weather data
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code,relative_humidity_2m&timezone=auto&forecast_days=1`;
      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();

      if (weatherResponse.ok && weatherData.current) {
        // Get next 6 hours of forecast
        const now = new Date();
        const hourlyForecast: HourlyForecast[] = [];
        
        if (weatherData.hourly && weatherData.hourly.time) {
          // Find the index of the current hour in the hourly data
          const currentTimeISO = weatherData.hourly.time.find((time: string) => {
            const hourTime = new Date(time);
            return hourTime.getHours() === now.getHours() && 
                   hourTime.getDate() === now.getDate();
          });
          
          const currentIndex = weatherData.hourly.time.indexOf(currentTimeISO);
          
          if (currentIndex !== -1) {
            // Get the next 24 hours starting from current hour
            for (let i = 0; i < 24 && (currentIndex + i) < weatherData.hourly.time.length; i++) {
              const index = currentIndex + i;
              hourlyForecast.push({
                time: weatherData.hourly.time[index],
                temperature: Math.round(weatherData.hourly.temperature_2m[index]),
                weatherCode: weatherData.hourly.weather_code[index],
                humidity: weatherData.hourly.relative_humidity_2m[index],
              });
            }
          }
        }

        setWeatherDetails({
          temperature: Math.round(weatherData.current.temperature_2m),
          humidity: weatherData.current.relative_humidity_2m,
          windSpeed: weatherData.current.wind_speed_10m,
          weatherCode: weatherData.current.weather_code,
          hourlyForecast,
        });
      }
    } catch (error) {
      console.error('Error fetching weather details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return 'sunny';
    if (code <= 3) return 'partly-sunny';
    if (code <= 48) return 'cloud';
    if (code <= 67) return 'rainy';
    if (code <= 77) return 'snow';
    if (code <= 82) return 'rainy';
    if (code <= 86) return 'snow';
    if (code <= 99) return 'thunderstorm';
    return 'partly-sunny';
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

  const formatHour = (timeString: string): string => {
    const date = new Date(timeString);
    return `${date.getHours()}:00`;
  };

  const handleCityUpdate = (city: string | null) => {
    onUpdateCity(city);
    setShowCityModal(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.container, { backgroundColor: theme.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text }]}>Clima</Text>
              <TouchableOpacity onPress={() => setShowCityModal(true)}>
                <Ionicons name="location" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textLight }]}>
                    Carregando informações...
                  </Text>
                </View>
              ) : weatherDetails ? (
                <>
                  {/* Current Weather Card */}
                  <LinearGradient
                    colors={[theme.primary + '20', theme.secondary + '20']}
                    style={styles.currentWeatherCard}
                  >
                    <View style={styles.cityHeader}>
                      <Ionicons name="location-outline" size={20} color={theme.primary} />
                      <Text style={[styles.cityName, { color: theme.text }]}>
                        {cityName}
                      </Text>
                    </View>

                    <View style={styles.mainWeather}>
                      <Ionicons 
                        name={getWeatherIcon(weatherDetails.weatherCode) as any} 
                        size={80} 
                        color={theme.primary} 
                      />
                      <Text style={[styles.temperature, { color: theme.text }]}>
                        {weatherDetails.temperature}°C
                      </Text>
                    </View>

                    <Text style={[styles.condition, { color: theme.textLight }]}>
                      {getWeatherCondition(weatherDetails.weatherCode)}
                    </Text>

                    {/* Weather Stats */}
                    <View style={styles.statsContainer}>
                      <View style={[styles.statItem, { backgroundColor: theme.background }]}>
                        <Ionicons name="water-outline" size={24} color={theme.primary} />
                        <Text style={[styles.statValue, { color: theme.text }]}>
                          {weatherDetails.humidity}%
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textLight }]}>
                          Umidade
                        </Text>
                      </View>

                      <View style={[styles.statItem, { backgroundColor: theme.background }]}>
                        <Ionicons name="speedometer-outline" size={24} color={theme.primary} />
                        <Text style={[styles.statValue, { color: theme.text }]}>
                          {Math.round(weatherDetails.windSpeed)} km/h
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textLight }]}>
                          Vento
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Hourly Forecast */}
                  {weatherDetails.hourlyForecast.length > 0 && (
                    <View style={styles.forecastSection}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Previsão por Hora
                      </Text>
                      
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.forecastScrollContent}
                      >
                        {weatherDetails.hourlyForecast.map((hour, index) => (
                          <LinearGradient
                            key={index}
                            colors={[theme.background, theme.card]}
                            style={styles.hourCard}
                          >
                            <Text style={[styles.hourTime, { color: theme.textLight }]}>
                              {formatHour(hour.time)}
                            </Text>
                            <Ionicons 
                              name={getWeatherIcon(hour.weatherCode) as any} 
                              size={32} 
                              color={theme.primary} 
                            />
                            <Text style={[styles.hourTemp, { color: theme.text }]}>
                              {hour.temperature}°
                            </Text>
                            <View style={styles.hourHumidity}>
                              <Ionicons name="water" size={12} color={theme.primary} />
                              <Text style={[styles.hourHumidityText, { color: theme.textLight }]}>
                                {hour.humidity}%
                              </Text>
                            </View>
                          </LinearGradient>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cloud-offline-outline" size={64} color={theme.textLight} />
                  <Text style={[styles.emptyText, { color: theme.textLight }]}>
                    Selecione uma cidade para ver o clima
                  </Text>
                  <TouchableOpacity 
                    style={[styles.selectCityButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowCityModal(true)}
                  >
                    <Text style={styles.selectCityButtonText}>Selecionar Cidade</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CitySelectionModal
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleCityUpdate}
        currentCity={currentCity}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  currentWeatherCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '600',
  },
  mainWeather: {
    alignItems: 'center',
    marginVertical: 16,
  },
  temperature: {
    fontSize: 56,
    fontWeight: 'bold',
    marginTop: 8,
  },
  condition: {
    fontSize: 18,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  forecastSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  forecastScrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  hourCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 80,
    gap: 8,
  },
  hourTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  hourTemp: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  hourHumidity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hourHumidityText: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectCityButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  selectCityButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
