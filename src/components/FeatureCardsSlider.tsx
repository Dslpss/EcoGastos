import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { useFeatureCards } from '../hooks/useFeatureCards';
import { AVAILABLE_EMOJIS } from '../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SIDE_PADDING = (width - CARD_WIDTH) / 2;

export const FeatureCardsSlider: React.FC = () => {
  const { theme } = useFinance();
  const { cards, loading, refresh } = useFeatureCards();
  const navigation = useNavigation<any>();
  const [selectedCard, setSelectedCard] = React.useState<any>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const hasShownModal = React.useRef(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  // Auto-open modal logic
  React.useEffect(() => {
    if (!loading && cards.length > 0 && !hasShownModal.current) {
      const modalCards = cards.filter(card => card.action.type === 'modal');
      if (modalCards.length > 0) {
        // Open the first modal card found
        setSelectedCard(modalCards[0]);
        setModalVisible(true);
        hasShownModal.current = true;
      }
    }
  }, [cards, loading]);

  const handleCardPress = (card: any) => {
    switch (card.action.type) {
      case 'navigate':
        navigation.navigate(card.action.target, card.action.params || {});
        break;
      case 'modal':
        setSelectedCard(card);
        setModalVisible(true);
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
                {AVAILABLE_EMOJIS.includes(card.icon || '') ? (
                  <Text style={{ fontSize: 32 }}>{card.icon}</Text>
                ) : (
                  <Ionicons name={card.icon as any} size={32} color={card.color} />
                )}
              </View>
              
              <View style={styles.content}>
                <Text style={[styles.title, { color: card.textColor || theme.text }]} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={[styles.description, { color: card.textColor ? card.textColor + 'CC' : theme.textLight }]} numberOfLines={4}>
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

      {/* Details Modal */}
      {selectedCard && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.textLight} />
              </TouchableOpacity>

              <View style={[styles.modalIconContainer, { backgroundColor: selectedCard.backgroundColor }]}>
                {AVAILABLE_EMOJIS.includes(selectedCard.icon || '') ? (
                  <Text style={{ fontSize: 48 }}>{selectedCard.icon}</Text>
                ) : (
                  <Ionicons name={selectedCard.icon} size={48} color={selectedCard.color} />
                )}
              </View>

              <Text style={[styles.modalTitle, { color: selectedCard.textColor || theme.text }]}>
                {selectedCard.title}
              </Text>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalDescription, { color: selectedCard.textColor ? selectedCard.textColor + 'CC' : theme.textLight }]}>
                  {selectedCard.description}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: selectedCard.color }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalScroll: {
    width: '100%',
    marginBottom: 24,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
