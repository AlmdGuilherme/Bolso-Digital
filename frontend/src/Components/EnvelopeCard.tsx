import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

interface EnvelopeProps {
  name: string;
  allocated: number;
  current: number;
  onPress: () => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export const EnvelopeCard = ({ name, allocated, current, onPress }: EnvelopeProps) => {
  const percentage = Math.max(0, Math.min(100, (current / allocated) * 100));
  const icons = {
    "Mercado": <MaterialCommunityIcons name="shopping" size={16} />,
    "Reserva": <MaterialCommunityIcons name="piggy-bank" size={16} />,
    "Lazer": <MaterialCommunityIcons name="soccer" size={16} />,
    "Alimentação": <MaterialCommunityIcons name="food" size={16} />,
    "Stream": <MaterialCommunityIcons name="television" size={16} />,
    "Academia": <MaterialCommunityIcons name='weight-lifter' size={16} />
  }

  const getBarColor = () => {
    if (percentage < 20) return '#FF3B30';
    if (percentage < 50) return '#FFCC00';
    return '#F34A23';
  };

  const cardIcon = icons[name as keyof typeof icons]

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={.075}>
      <View style={styles.card}>
        <View style={styles.header}>
          {cardIcon}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.amount}>
            {formatCurrency(current)}
          </Text>
        </View>

        <View style={styles.progress_bg}>
          <View
            style={[
              styles.progress_fill,
              { width: `${percentage}%`, backgroundColor: getBarColor() }
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    width: width * .45,
    height: width * .3,
    justifyContent: 'center',
    borderWidth: 1,
    gap: 5,
    borderColor: '#EEE',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#161616'
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161616'
  },
  total: {
    color: '#888',
    fontWeight: '400'
  },
  progress_bg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progress_fill: {
    height: '100%',
    borderRadius: 4
  }
});