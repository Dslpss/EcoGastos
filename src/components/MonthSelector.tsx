import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MonthSelector = () => {
  const { selectedDate, changeMonth, theme } = useFinance();

  const formattedDate = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  // Capitalize first letter
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => changeMonth(-1)}
        style={[styles.button, { backgroundColor: theme.card }]}
      >
        <Ionicons name="chevron-back" size={20} color={theme.text} />
      </TouchableOpacity>

      <View style={[styles.dateContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="calendar-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.dateText, { color: theme.text }]}>{displayDate}</Text>
      </View>

      <TouchableOpacity 
        onPress={() => changeMonth(1)}
        style={[styles.button, { backgroundColor: theme.card }]}
      >
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateContainer: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
