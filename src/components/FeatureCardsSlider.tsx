import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { useFeatureCards } from '../hooks/useFeatureCards';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SIDE_PADDING = (width - CARD_WIDTH) / 2;

export const FeatureCardsSlider: React.FC = () => {
  const { theme } = useFinance();
  const { cards, loading, refresh } = useFeatureCards();
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const handleCardPress = (card: any) => {
    switch (card.action.type) {
      case 'navigate':
        navigation.navigate(card.action.target, card.action.params || {});
        break;
      case 'modal':
        // Handle modal opening
        console.log('Open modal:', card.action.target);
        break;
      case 'external':
        // Handle external link
        console.log('Open external link:', card.action.target);
        break;
    }
  };

  if (loading || cards.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: SIDE_PADDING }
        ]}
      >
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card._id}
            activeOpacity={0.9}
            onPress={() => handleCardPress(card)}
            style={[styles.cardWrapper, index === cards.length - 1 && { marginRight: 0 }]}
          >
            <LinearGradient
              colors={[card.backgroundColor, card.backgroundColor + 'DD']}
              style={styles.card}
            >
              <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
                <Ionicons name={card.icon as any} size={32} color={card.color} />
              </View>
              
              <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={[styles.description, { color: theme.textLight }]} numberOfLines={2}>
                  {card.description}
                </Text>
              </View>

              <View style={[styles.arrow, { backgroundColor: card.color }]}>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicator dots */}
      {cards.length > 1 && (
        <View style={styles.indicators}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { backgroundColor: theme.textLight, opacity: 0.3 }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  firstCard: {
    // No extra margin for first card
  },
  card: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
