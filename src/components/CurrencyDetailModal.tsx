import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { LinearGradient } from 'expo-linear-gradient';

interface CurrencyDetailModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  bid: string;
  ask: string;
  high: string;
  low: string;
  pctChange: string;
  timestamp: string;
}

export const CurrencyDetailModal: React.FC<CurrencyDetailModalProps> = ({ visible, onClose }) => {
  const { theme } = useFinance();
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (visible) {
      fetchCurrencies();
    }
  }, [visible]);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      
      // Try AwesomeAPI first (has detailed data)
      try {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL');
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        const data = await response.json();

        if (response.ok) {
          const currencyList: CurrencyInfo[] = [];

          // USD
          if (data.USDBRL) {
            currencyList.push({
              code: 'USD',
              name: 'Dólar Americano',
              symbol: '$',
              bid: parseFloat(data.USDBRL.bid).toFixed(2),
              ask: parseFloat(data.USDBRL.ask).toFixed(2),
              high: parseFloat(data.USDBRL.high).toFixed(2),
              low: parseFloat(data.USDBRL.low).toFixed(2),
              pctChange: data.USDBRL.pctChange,
              timestamp: data.USDBRL.create_date,
            });
          }

          // EUR
          if (data.EURBRL) {
            currencyList.push({
              code: 'EUR',
              name: 'Euro',
              symbol: '€',
              bid: parseFloat(data.EURBRL.bid).toFixed(2),
              ask: parseFloat(data.EURBRL.ask).toFixed(2),
              high: parseFloat(data.EURBRL.high).toFixed(2),
              low: parseFloat(data.EURBRL.low).toFixed(2),
              pctChange: data.EURBRL.pctChange,
              timestamp: data.EURBRL.create_date,
            });
          }

          // GBP
          if (data.GBPBRL) {
            currencyList.push({
              code: 'GBP',
              name: 'Libra Esterlina',
              symbol: '£',
              bid: parseFloat(data.GBPBRL.bid).toFixed(2),
              ask: parseFloat(data.GBPBRL.ask).toFixed(2),
              high: parseFloat(data.GBPBRL.high).toFixed(2),
              low: parseFloat(data.GBPBRL.low).toFixed(2),
              pctChange: data.GBPBRL.pctChange,
              timestamp: data.GBPBRL.create_date,
            });
          }

          setCurrencies(currencyList);
          
          if (currencyList.length > 0) {
            setLastUpdate(formatTimestamp(currencyList[0].timestamp));
          }
          return;
        }
      } catch (awesomeError) {
        console.log('⚠️ AwesomeAPI failed, using Frankfurter fallback...', awesomeError);
        
        // Fallback to Frankfurter (basic data only)
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL,EUR,GBP');
        const data = await response.json();

        if (response.ok && data.rates) {
          const currencyList: CurrencyInfo[] = [];
          const now = new Date().toISOString();

          // USD/BRL
          if (data.rates.BRL) {
            const rate = data.rates.BRL.toFixed(2);
            currencyList.push({
              code: 'USD',
              name: 'Dólar Americano',
              symbol: '$',
              bid: rate,
              ask: rate,
              high: rate,
              low: rate,
              pctChange: '0',
              timestamp: now,
            });
          }

          // EUR/BRL - need to fetch separately
          const eurResponse = await fetch('https://api.frankfurter.app/latest?from=EUR&to=BRL');
          const eurData = await eurResponse.json();
          if (eurData.rates && eurData.rates.BRL) {
            const rate = eurData.rates.BRL.toFixed(2);
            currencyList.push({
              code: 'EUR',
              name: 'Euro',
              symbol: '€',
              bid: rate,
              ask: rate,
              high: rate,
              low: rate,
              pctChange: '0',
              timestamp: now,
            });
          }

          // GBP/BRL - need to fetch separately
          const gbpResponse = await fetch('https://api.frankfurter.app/latest?from=GBP&to=BRL');
          const gbpData = await gbpResponse.json();
          if (gbpData.rates && gbpData.rates.BRL) {
            const rate = gbpData.rates.BRL.toFixed(2);
            currencyList.push({
              code: 'GBP',
              name: 'Libra Esterlina',
              symbol: '£',
              bid: rate,
              ask: rate,
              high: rate,
              low: rate,
              pctChange: '0',
              timestamp: now,
            });
          }

          setCurrencies(currencyList);
          setLastUpdate(formatTimestamp(now));
        }
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getChangeColor = (change: string): string => {
    const changeValue = parseFloat(change);
    if (changeValue > 0) return theme.success;
    if (changeValue < 0) return theme.danger;
    return theme.textLight;
  };

  const getChangeIcon = (change: string): any => {
    const changeValue = parseFloat(change);
    if (changeValue > 0) return 'trending-up';
    if (changeValue < 0) return 'trending-down';
    return 'remove';
  };

  return (
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
            <Text style={[styles.title, { color: theme.text }]}>Cotações</Text>
            <TouchableOpacity onPress={fetchCurrencies} disabled={loading}>
              <Ionicons 
                name="refresh" 
                size={24} 
                color={loading ? theme.textLight : theme.primary} 
              />
            </TouchableOpacity>
          </View>

          {lastUpdate && (
            <Text style={[styles.lastUpdate, { color: theme.textLight }]}>
              Atualizado às {lastUpdate}
            </Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textLight }]}>
                  Carregando cotações...
                </Text>
              </View>
            ) : currencies.length > 0 ? (
              <>
                {currencies.map((currency, index) => (
                  <LinearGradient
                    key={currency.code}
                    colors={[theme.primary + '15', theme.secondary + '15']}
                    style={[styles.currencyCard, index === currencies.length - 1 && styles.lastCard]}
                  >
                    {/* Currency Header */}
                    <View style={styles.currencyHeader}>
                      <View style={styles.currencyTitleContainer}>
                        <Text style={[styles.currencySymbol, { color: theme.primary }]}>
                          {currency.symbol}
                        </Text>
                        <View>
                          <Text style={[styles.currencyCode, { color: theme.text }]}>
                            {currency.code}/BRL
                          </Text>
                          <Text style={[styles.currencyName, { color: theme.textLight }]}>
                            {currency.name}
                          </Text>
                        </View>
                      </View>

                      {/* Variation Badge */}
                      <View style={[styles.variationBadge, { backgroundColor: getChangeColor(currency.pctChange) + '20' }]}>
                        <Ionicons 
                          name={getChangeIcon(currency.pctChange)} 
                          size={16} 
                          color={getChangeColor(currency.pctChange)} 
                        />
                        <Text style={[styles.variationText, { color: getChangeColor(currency.pctChange) }]}>
                          {parseFloat(currency.pctChange) > 0 ? '+' : ''}{parseFloat(currency.pctChange).toFixed(2)}%
                        </Text>
                      </View>
                    </View>

                    {/* Main Price */}
                    <View style={styles.mainPriceContainer}>
                      <Text style={[styles.mainPrice, { color: theme.text }]}>
                        R$ {currency.bid}
                      </Text>
                      <Text style={[styles.priceLabel, { color: theme.textLight }]}>
                        Compra
                      </Text>
                    </View>

                    {/* Price Details Grid */}
                    <View style={styles.detailsGrid}>
                      <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                        <Text style={[styles.detailLabel, { color: theme.textLight }]}>
                          Venda
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          R$ {currency.ask}
                        </Text>
                      </View>

                      <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                        <Text style={[styles.detailLabel, { color: theme.textLight }]}>
                          Máxima
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.success }]}>
                          R$ {currency.high}
                        </Text>
                      </View>

                      <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                        <Text style={[styles.detailLabel, { color: theme.textLight }]}>
                          Mínima
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.danger }]}>
                          R$ {currency.low}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={64} color={theme.textLight} />
                <Text style={[styles.emptyText, { color: theme.textLight }]}>
                  Não foi possível carregar as cotações
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                  onPress={fetchCurrencies}
                >
                  <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastUpdate: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
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
  currencyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  lastCard: {
    marginBottom: 0,
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyName: {
    fontSize: 12,
  },
  variationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  variationText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mainPriceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainPrice: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  priceLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
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
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
