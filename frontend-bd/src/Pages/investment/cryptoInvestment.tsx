import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { CryptoService } from "../../Service/CryptoService";

const { width } = Dimensions.get("window");

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
};

type Crypto = {
  id: string;
  name: string;
  symbol: string;
};

type CryptoAsset = Crypto & {
  price: number;
  variation: number;
  chart: number[];
};

const cryptos: Crypto[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" }
];

const initialState = {
  loading: false,
  watchlist: [] as CryptoAsset[],
  error: null as string | null
};

const ACTIONS = {
  START: "start",
  SUCCESS: "success",
  ERROR: "error"
};

function reducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true, error: null };
    case ACTIONS.SUCCESS:
      return { ...state, loading: false, watchlist: action.payload, error: null };
    case ACTIONS.ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function CryptoInvestment({ navigation }: any) {
  const [selectedCryptos, setSelectedCryptos] = useState<Crypto[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const formatVariation = (value: number) => {
    const formatted = Number(value || 0).toFixed(2).replace(".", ",");
    return `${value >= 0 ? "+" : ""}${formatted}%`;
  };

  const toggleCrypto = (crypto: Crypto) => {
    const alreadySelected = selectedCryptos.some(item => item.id === crypto.id);

    if (alreadySelected) {
      const updatedCryptos = selectedCryptos.filter(item => item.id !== crypto.id);
      setSelectedCryptos(updatedCryptos);
      return;
    }

    setSelectedCryptos([...selectedCryptos, crypto]);
  };

  const fetchCryptoData = async () => {
    if (selectedCryptos.length === 0) {
      dispatch({ type: ACTIONS.SUCCESS, payload: [] });
      setSelectedCrypto(null);
      return;
    }

    dispatch({ type: ACTIONS.START });

    try {
      const cryptoService = new CryptoService();
      const ids = selectedCryptos.map(crypto => crypto.id);
      const prices = await cryptoService.getCryptosPrice(ids);

      const cryptosWithChart = await Promise.all(
        prices.map(async (cryptoPrice: any) => {
          const cryptoInfo = selectedCryptos.find(crypto => crypto.id === cryptoPrice.id);
          const chart = await cryptoService.getCriptoWeek(cryptoPrice.id);

          return {
            id: cryptoPrice.id,
            name: cryptoInfo?.name ?? cryptoPrice.id,
            symbol: cryptoInfo?.symbol ?? cryptoPrice.id.toUpperCase(),
            price: cryptoPrice.price,
            variation: cryptoPrice.variation,
            chart
          };
        })
      );

      dispatch({ type: ACTIONS.SUCCESS, payload: cryptosWithChart });
      setSelectedCrypto(cryptosWithChart[0] ?? null);
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error.message || "Erro ao buscar criptomoedas"
      });
    }
  };

  useEffect(() => {
    fetchCryptoData();
  }, [selectedCryptos]);

  useEffect(() => {
    if (state.watchlist.length > 0 && selectedCrypto && !state.watchlist.some((crypto: any) => crypto.id === selectedCrypto.id)) {
      setSelectedCrypto(state.watchlist[0]);
    }
  }, [state.watchlist, selectedCrypto]);

  const chartValues = selectedCrypto?.chart?.length ? selectedCrypto.chart : [0, 0, 0, 0, 0, 0];

  const chartLabels = useMemo(() => {
    return chartValues.map((_, index) => {
      const total = chartValues.length;

      if (total <= 6) return String(index + 1);

      const step = Math.ceil(total / 4);

      return index % step === 0 ? String(index + 1) : "";
    });
  }, [chartValues]);

  const positiveCryptos = state.watchlist.filter((crypto: any) => crypto.variation >= 0).length;

  if (state.loading) {
    return (
      <View style={styles.center_container}>
        <ActivityIndicator size="large" color={CORES.ORANGE} />
        <Text style={styles.center_text}>Carregando criptomoedas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => navigation.navigate("MainTabs")} style={styles.back_btn}>
        <View style={styles.back_btn_content}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          <Text style={styles.btn_text}>Voltar</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.title}>Criptomoedas</Text>
      <Text style={styles.subtitle}>Acompanhe Bitcoin, Ethereum, Solana e outras moedas digitais</Text>

      <Text style={styles.section_title}>Selecionar criptomoedas</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {cryptos.map(crypto => {
          const isSelected = selectedCryptos.some(item => item.id === crypto.id);

          return (
            <TouchableOpacity
              key={crypto.id}
              style={[styles.filter_button, isSelected && styles.filter_button_active]}
              onPress={() => toggleCrypto(crypto)}
            >
              <Text style={[styles.filter_text, isSelected && styles.filter_text_active]}>
                {crypto.symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {state.error && (
        <View style={styles.empty_card}>
          <Text style={styles.error_text}>{state.error}</Text>
        </View>
      )}

      {selectedCrypto && !state.error && (
        <View style={styles.chart_card}>
          <Text style={styles.section_title}>Variação de {selectedCrypto.symbol}</Text>

          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartValues }]
            }}
            width={width - 68}
            height={190}
            yAxisLabel="R$ "
            chartConfig={{
              backgroundGradientFrom: "#F8F8F8",
              backgroundGradientTo: "#F8F8F8",
              decimalPlaces: 2,
              color: () => CORES.ORANGE,
              labelColor: () => "#777",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: CORES.ORANGE
              }
            }}
            bezier
            withDots
            style={styles.chart}
          />
        </View>
      )}

      <Text style={styles.section_title}>Criptomoedas acompanhadas</Text>

      {state.watchlist.length > 0 ? (
        state.watchlist.map((crypto: any) => (
          <TouchableOpacity
            key={crypto.id}
            style={[styles.asset_card, selectedCrypto?.id === crypto.id && styles.asset_card_active]}
            onPress={() => setSelectedCrypto(crypto)}
          >
            <View style={styles.asset_left}>
              <Text style={styles.asset_symbol}>{crypto.symbol}</Text>
              <Text style={styles.asset_name}>{crypto.name}</Text>
              <Text style={styles.asset_type}>Criptomoeda</Text>
            </View>

            <View style={styles.asset_right}>
              <Text style={styles.asset_price}>{formatCurrency(crypto.price)}</Text>
              <Text style={[styles.variation_small, crypto.variation >= 0 ? styles.positive : styles.negative]}>
                {formatVariation(crypto.variation)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.empty_card}>
          <Text style={styles.empty_text}>Nenhuma criptomoeda selecionada.</Text>
          <Text style={styles.empty_text}>Escolha uma moeda acima para acompanhar sua variação.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.WHITE
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  center_container: {
    flex: 1,
    backgroundColor: CORES.WHITE,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  center_text: {
    marginTop: 12,
    color: "#777",
    fontSize: 15,
    fontFamily: "Poppins_400Regular"
  },
  error_text: {
    color: CORES.MIDNIGHT,
    fontSize: 14,
    fontFamily: "Poppins_700Bold"
  },
  back_btn: {
    backgroundColor: CORES.ORANGE,
    width: 120,
    height: 44,
    marginTop: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  back_btn_content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  btn_text: {
    color: CORES.WHITE,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginLeft: 6
  },
  title: {
    fontSize: 34,
    color: CORES.MIDNIGHT,
    marginTop: 26,
    fontFamily: "Poppins_700Bold"
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginTop: 4,
    marginBottom: 20,
    fontFamily: "Poppins_400Regular"
  },
  summary_card: {
    backgroundColor: CORES.MIDNIGHT,
    borderRadius: 28,
    padding: 24,
    marginBottom: 18
  },
  summary_label: {
    color: "#AAA",
    fontSize: 15,
    fontFamily: "Poppins_400Regular"
  },
  summary_symbol: {
    color: CORES.WHITE,
    fontSize: 20,
    fontFamily: "Poppins_700Bold"
  },
  summary_price: {
    color: CORES.WHITE,
    fontSize: 34,
    fontFamily: "Poppins_700Bold"
  },
  variation: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold"
  },
  market_row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18
  },
  market_card: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEE"
  },
  market_label: {
    fontSize: 12,
    color: "#777",
    fontFamily: "Poppins_600SemiBold"
  },
  market_value: {
    fontSize: 22,
    color: CORES.MIDNIGHT,
    marginTop: 4,
    fontFamily: "Poppins_700Bold"
  },
  filters: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    paddingRight: 20
  },
  filter_button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#F3F3F3"
  },
  filter_button_active: {
    backgroundColor: CORES.ORANGE
  },
  filter_text: {
    color: "#555",
    fontSize: 14,
    fontFamily: "Poppins_700Bold"
  },
  filter_text_active: {
    color: CORES.WHITE
  },
  chart_card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    overflow: "hidden"
  },
  chart: {
    borderRadius: 16,
    marginTop: 8
  },
  section_title: {
    fontSize: 18,
    color: CORES.MIDNIGHT,
    marginBottom: 12,
    fontFamily: "Poppins_700Bold"
  },
  asset_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE"
  },
  asset_card_active: {
    borderColor: CORES.ORANGE
  },
  asset_left: {
    flex: 1,
    paddingRight: 10
  },
  asset_symbol: {
    fontSize: 18,
    color: CORES.MIDNIGHT,
    fontFamily: "Poppins_700Bold"
  },
  asset_name: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    fontFamily: "Poppins_400Regular"
  },
  asset_type: {
    fontSize: 12,
    color: CORES.ORANGE,
    marginTop: 6,
    fontFamily: "Poppins_700Bold"
  },
  asset_right: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  asset_price: {
    fontSize: 16,
    color: CORES.MIDNIGHT,
    fontFamily: "Poppins_700Bold"
  },
  variation_small: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Poppins_700Bold"
  },
  empty_card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE"
  },
  empty_text: {
    color: "#777",
    fontFamily: "Poppins_400Regular"
  },
  positive: {
    color: "#28A745"
  },
  negative: {
    color: "#E53935"
  }
});