import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFinance } from '../context/FinanceContext';
import { format } from 'date-fns';
import { Expense } from '../types';

// Configure Portuguese Locale
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

interface ExpenseCalendarProps {
  onDayPress: (date: string) => void;
}

export const ExpenseCalendar: React.FC<ExpenseCalendarProps> = ({ onDayPress }) => {
  const { expenses, theme, selectedDate } = useFinance();

  const markedDates = useMemo(() => {
    const marks: any = {};
    
    expenses.forEach(expense => {
      const dateKey = format(new Date(expense.date), 'yyyy-MM-dd');
      
      if (!marks[dateKey]) {
        marks[dateKey] = {
          marked: true,
          dotColor: theme.danger,
          // You can add more customization here, e.g., different colors for different categories
        };
      }
    });

    // Mark selected date if needed, or today
    const today = format(new Date(), 'yyyy-MM-dd');
    if (marks[today]) {
        marks[today].selected = true;
        marks[today].selectedColor = theme.primary + '40'; // Semi-transparent primary
    } else {
        marks[today] = {
            selected: true,
            selectedColor: theme.primary + '40',
        };
    }

    return marks;
  }, [expenses, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Calendar
        // Initially visible month. Default = Date()
        current={format(selectedDate, 'yyyy-MM-dd')}
        // Handler which gets executed on day press. Default = undefined
        onDayPress={(day: any) => {
            onDayPress(day.dateString);
        }}
        // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
        monthFormat={'MMMM yyyy'}
        // Hide month navigation arrows. Default = false
        hideArrows={true} // We use our own MonthSelector
        // Do not show days of other months in month page. Default = false
        hideExtraDays={true}
        // If hideArrows = false and hideExtraDays = false do not switch month when tapping on greyed out
        // day from another month that is visible in calendar page. Default = false
        disableMonthChange={true}
        // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday
        firstDay={0}
        
        // Styling
        theme={{
          backgroundColor: theme.card,
          calendarBackground: theme.card,
          textSectionTitleColor: theme.textLight,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.primary,
          dayTextColor: theme.text,
          textDisabledColor: theme.gray,
          dotColor: theme.danger,
          selectedDotColor: '#ffffff',
          arrowColor: theme.primary,
          disabledArrowColor: '#d9e1e8',
          monthTextColor: theme.text,
          indicatorColor: theme.primary,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
        
        markedDates={markedDates}
        key={theme.background} // Force re-render on theme change
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
