import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, TouchableOpacity, View, Text } from "react-native";

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c",
};

const { width } = Dimensions.get("window");

type ShortCardProps = {
  type: string;
  onPress: () => void;
};

export default function ShortCard({ type, onPress }: ShortCardProps) {
  const cardData = {
    simulation: {
      icon: "calculator",
      label: "Simulação",
    },
    balance_change: {
      icon: "cash-sync",
      label: "Despesa",
    },
    coin_cotation: {
      icon: "swap-horizontal",
      label: "Câmbio",
    },
    investment: {
      icon: "chart-areaspline-variant",
      label: "Investimentos",
    },
    cripto: {
      icon: "bitcoin",
      label: "Criptos",
    },
    goals: {
      icon: "target",
      label: "Metas",
    },
    nfc: {
      icon: "nfc",
      label: "NFC",
    },
    qr_code: {
      icon: "qrcode",
      label: "QR Code",
    },
    qr_scanner: {
      icon: "qrcode-scan",
      label: "Escanear",
    },
    pending_transactions: {
      icon: 'clipboard-list-outline',
      label: 'Pendências',
    },
    transaction_history: {
      icon: "history",
      label: "Histórico",
    },
    fixed_expenses: {
      icon: "calendar-sync",
      label: "Fixas",
    },
    gaming_badges: {
      icon: "trophy-award",
      label: "Badges",
    },
    export_csv: {
      icon: "file-export-outline",
      label: "Exportar",
    },
  };

  const current = cardData[type as keyof typeof cardData];

  if (!current) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.shortCard}>
        <MaterialCommunityIcons
          name={current.icon as any}
          size={42}
          color={CORES.O_SHADOW}
        />
      </View>

      <Text style={styles.label}>
        {current.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: width * 0.22,
  },

  shortCard: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: 18,
    backgroundColor: CORES.O_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  label: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: CORES.O_SHADOW,
    textAlign: "center",
  },
});