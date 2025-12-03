import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) * 0.48;

export const SummaryCardsSlider: React.FC = () => {
  const { theme, expenses, recurringBills, selectedDate, isValuesVisible } = useFinance();

  const totals = React.useMemo(() => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const monthlyExpenses = expenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyFixed = recurringBills
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { monthlyExpenses, monthlyFixed };
  }, [expenses, recurringBills, selectedDate]);

  const summaryCards = [
    {
      id: 'expenses',
      title: 'Gastos',
      description: isValuesVisible ? formatCurrency(totals.monthlyExpenses) : '••••••',
      icon: 'trending-down',
      color: '#FFFFFF',
      backgroundColor: '#FF5252',
    },
    {
      id: 'fixed',
      title: 'Fixas',
      description: isValuesVisible ? formatCurrency(totals.monthlyFixed) : '••••••',
      icon: 'calendar',
      color: '#FFFFFF',
      backgroundColor: '#4A90E2',
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {summaryCards.map((card, index) => (
          <View
            key={card.id}
            style={[styles.cardWrapper, index === summaryCards.length - 1 && { marginRight: 0 }]}
          >
            <LinearGradient
              colors={[card.backgroundColor, card.backgroundColor + 'DD']}
              style={styles.card}
            >
              <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
                <Ionicons name={card.icon as any} size={32} color={card.color} />
              </View>
              
              <View style={styles.content}>
                <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={1}>
                  {card.title}
                </Text>
                <Text style={[styles.description, { color: '#FFFFFF' }]} numberOfLines={1}>
                  {card.description}
                </Text>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    marginTop: 8,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 140,
    height: 140,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
  },
});
