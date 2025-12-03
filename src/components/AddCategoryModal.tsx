import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, KeyboardAvoidingView, PanResponder, Dimensions } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hslToHex } from '../utils/format';

import { Category } from '../types';
import { AVAILABLE_COLORS, AVAILABLE_ICONS, AVAILABLE_EMOJIS, ALL_ICONS } from '../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  categoryToEdit?: Category;
}



export const AddCategoryModal: React.FC<Props> = ({ visible, onClose, categoryToEdit }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ALL_ICONS[0]);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const { addCategory, updateCategory, deleteCategory, theme } = useFinance();

  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = React.useRef(0);

  const updateColorFromGesture = (x: number) => {
    const width = sliderWidthRef.current;
    if (width === 0) return;
    
    // Clamp x between 0 and width
    const clampedX = Math.max(0, Math.min(x, width));
    
    // Calculate hue (0-360)
    const hue = (clampedX / width) * 360;
    
    // Convert to Hex (Saturation 100%, Lightness 50% for vibrant colors)
    const hex = hslToHex(hue, 100, 50);
    setSelectedColor(hex);
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateColorFromGesture(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateColorFromGesture(evt.nativeEvent.locationX);
      },
    })
  ).current;

  // Helper function to check if icon is an emoji
  const isEmoji = (icon: string) => {
    return AVAILABLE_EMOJIS.includes(icon);
  };

  // Reset or fill form when modal opens
  React.useEffect(() => {
    if (visible) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setSelectedColor(categoryToEdit.color);
        setSelectedIcon(categoryToEdit.icon || 'pricetag');
      } else {
        setName('');
        setSelectedColor(AVAILABLE_COLORS[0]);
        setSelectedIcon(ALL_ICONS[0]);
        setShowCustomColorInput(false);
      }
    }
  }, [visible, categoryToEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome da categoria.');
      return;
    }

    try {
      if (categoryToEdit) {
        await updateCategory({
          ...categoryToEdit,
          name,
          color: selectedColor,
          icon: selectedIcon,
        });
      } else {
        await addCategory({
          name,
          color: selectedColor,
          icon: selectedIcon,
          isCustom: true,
        });
      }
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a categoria.');
    }
  };

  const handleDelete = () => {
    if (!categoryToEdit) return;

    Alert.alert(
      'Excluir Categoria',
      'Tem certeza que deseja excluir esta categoria? Os gastos associados permanecerão, mas sem categoria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteCategory(categoryToEdit.id);
              onClose();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a categoria.');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { backgroundColor: theme.card }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
              </Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.gray + '20' }]}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Name Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="pricetag-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome da categoria (ex: Viagens)"
                  placeholderTextColor={theme.textLight}
                  autoFocus={!categoryToEdit}
                />
              </View>

              {/* Colors */}
              <Text style={[styles.sectionLabel, { color: theme.textLight }]}>Cor</Text>
              <View style={styles.colorsGrid}>
                {AVAILABLE_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor
                    ]}
                    onPress={() => {
                      setSelectedColor(color);
                      setShowCustomColorInput(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedColor === color && <Ionicons name="checkmark" size={20} color="#FFF" />}
                  </TouchableOpacity>
                ))}
                
                {/* Custom Color Button */}
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.gray },
                    showCustomColorInput && styles.selectedColor
                  ]}
                  onPress={() => setShowCustomColorInput(!showCustomColorInput)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="color-palette-outline" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Custom Color Picker (Rainbow Slider) */}
              {showCustomColorInput && (
                <View style={[styles.inputGroup, { backgroundColor: theme.background, marginBottom: 24, flexDirection: 'column', alignItems: 'stretch' }]}>
                  <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 12, fontSize: 12, color: theme.textLight }]}>
                    Deslize para escolher
                  </Text>
                  
                  <View 
                    style={styles.sliderContainer}
                    onLayout={(e) => {
                      const width = e.nativeEvent.layout.width;
                      setSliderWidth(width);
                      sliderWidthRef.current = width;
                    }}
                    {...panResponder.panHandlers}
                  >
                    <LinearGradient
                      colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sliderGradient}
                    />
                    
                    {/* Thumb Indicator - Position based on current color is tricky without storing Hue, 
                        so we just show the current selected color as a preview box instead of a moving thumb 
                        OR we could calculate X from hex if we really wanted, but for now a preview box is fine.
                        Actually, let's just show a large preview of the selected color.
                    */}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
                    <View style={[styles.largeColorPreview, { backgroundColor: selectedColor }]} />
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>
                      {selectedColor}
                    </Text>
                  </View>
                </View>
              )}

              {/* Icons */}
              <Text style={[styles.sectionLabel, { color: theme.textLight }]}>Ícone</Text>
              <View style={styles.iconsGrid}>
                {ALL_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon 
                        ? { backgroundColor: selectedColor + '20', borderColor: selectedColor, borderWidth: 2 }
                        : { backgroundColor: theme.background, borderColor: theme.gray, borderWidth: 1 }
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    activeOpacity={0.7}
                  >
                    {isEmoji(icon) ? (
                      <Text style={styles.emojiIcon}>{icon}</Text>
                    ) : (
                      <Ionicons 
                        name={icon as any} 
                        size={24} 
                        color={selectedIcon === icon ? selectedColor : theme.textLight} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.saveButtonContainer, { shadowColor: selectedColor }]} 
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[selectedColor, selectedColor + 'CC']}
                    style={styles.saveButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.saveButtonText}>
                      {categoryToEdit ? 'Atualizar Categoria' : 'Salvar Categoria'}
                    </Text>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.saveIcon} />
                  </LinearGradient>
                </TouchableOpacity>

                {categoryToEdit && categoryToEdit.isCustom && (
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={handleDelete}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteButtonText}>Excluir Categoria</Text>
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                  </TouchableOpacity>
                )}
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    borderRadius: 32,
    margin: 16,
    marginBottom: 34,
    padding: 24,
    paddingBottom: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.1 }],
  },
  sliderContainer: {
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  sliderGradient: {
    flex: 1,
    width: '100%',
  },
  largeColorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginRight: 12,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 28,
  },
  saveButtonContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  saveIcon: {
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF5252',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
