import { Category } from '../types';

export const THEME = {
  light: {
    primary: '#4A90E2',
    secondary: '#50E3C2',
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#333333',
    textLight: '#888888',
    danger: '#FF5252',
    success: '#4CAF50',
    warning: '#FFC107',
    gray: '#E0E0E0',
    border: '#E0E0E0',
  },
  dark: {
    primary: '#5D9CEC', // Slightly lighter blue for dark mode
    secondary: '#50E3C2',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textLight: '#AAAAAA',
    danger: '#FF5252',
    success: '#66BB6A',
    warning: '#FFD54F',
    gray: '#333333',
    border: '#333333',
  }
};

export const COLORS = THEME.light; // Fallback/Default

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentação', color: '#FF5252', icon: 'fast-food', isCustom: false },
  { id: '2', name: 'Transporte', color: '#4A90E2', icon: 'car', isCustom: false },
  { id: '3', name: 'Saúde', color: '#50E3C2', icon: 'medkit', isCustom: false },
  { id: '4', name: 'Lazer', color: '#FFC107', icon: 'game-controller', isCustom: false },
  { id: '5', name: 'Educação', color: '#9C27B0', icon: 'school', isCustom: false },
  { id: '6', name: 'Outros', color: '#9E9E9E', icon: 'ellipsis-horizontal', isCustom: false },
];

export const AVAILABLE_COLORS = [
  '#FF5252', '#4A90E2', '#50E3C2', '#FFC107', '#9C27B0', '#9E9E9E',
  '#E91E63', '#673AB7', '#3F51B5', '#009688', '#FF5722', '#795548'
];

export const AVAILABLE_ICONS = [
  'fast-food', 'car', 'medkit', 'game-controller', 'school', 'ellipsis-horizontal',
  'home', 'cart', 'airplane', 'build', 'shirt', 'gift', 'fitness', 'paw', 'cafe', 'beer',
  'card', 'business', 'flash', 'bulb', 'tv', 'play-circle', 'wallet', 'logo-netflix'
];

export const AVAILABLE_EMOJIS = [
  '💳', '🏦', '💡', '⚡', '📺', '🎬', '💰', '🍔', '🚗', '🏠', 
  '✈️', '🎮', '🏥', '👕', '🎁', '💪', '🐾', '☕', '🍺', '📱'
];

export const ALL_ICONS = [...AVAILABLE_ICONS, ...AVAILABLE_EMOJIS];
