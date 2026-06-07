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
    "Academia": <MaterialCommunityIcons name="weight-lifter" size={16} />,
    "Viagem": <MaterialCommunityIcons name="airplane" size={16} />,
    "Transporte": <MaterialCommunityIcons name="car" size={16} />,
    "Combustível": <MaterialCommunityIcons name="gas-station" size={16} />,
    "Moradia": <MaterialCommunityIcons name="home" size={16} />,
    "Aluguel": <MaterialCommunityIcons name="key" size={16} />,
    "Contas": <MaterialCommunityIcons name="lightning-bolt" size={16} />,
    "Internet": <MaterialCommunityIcons name="wifi" size={16} />,
    "Celular": <MaterialCommunityIcons name="cellphone" size={16} />,
    "Saúde": <MaterialCommunityIcons name="hospital-box" size={16} />,
    "Farmácia": <MaterialCommunityIcons name="pill" size={16} />,
    "Médico": <MaterialCommunityIcons name="stethoscope" size={16} />,
    "Educação": <MaterialCommunityIcons name="school" size={16} />,
    "Cursos": <MaterialCommunityIcons name="book-open-page-variant" size={16} />,
    "Pets": <MaterialCommunityIcons name="paw" size={16} />,
    "Ração": <MaterialCommunityIcons name="bone" size={16} />,
    "Investimentos": <MaterialCommunityIcons name="chart-line" size={16} />,
    "Criptomoedas": <MaterialCommunityIcons name="bitcoin" size={16} />,
    "Ações": <MaterialCommunityIcons name="finance" size={16} />,
    "Presentes": <MaterialCommunityIcons name="gift" size={16} />,
    "Natal": <MaterialCommunityIcons name="gift-outline" size={16} />,
    "Tecnologia": <MaterialCommunityIcons name="laptop" size={16} />,
    "Eletrônicos": <MaterialCommunityIcons name="devices" size={16} />,
    "Roupas": <MaterialCommunityIcons name="hanger" size={16} />,
    "Beleza": <MaterialCommunityIcons name="face-woman" size={16} />,
    "Seguros": <MaterialCommunityIcons name="shield-check" size={16} />,
    "Impostos": <MaterialCommunityIcons name="file-document" size={16} />,
    "Emergência": <MaterialCommunityIcons name="alert-circle" size={16} />,
    "Objetivos": <MaterialCommunityIcons name="target" size={16} />,
    "Carro": <MaterialCommunityIcons name="car-wrench" size={16} />,
    "Casa": <MaterialCommunityIcons name="home-heart" size={16} />,
    "Outros": <MaterialCommunityIcons name="dots-horizontal-circle" size={16} />,
  };

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