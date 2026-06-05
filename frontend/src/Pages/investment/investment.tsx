import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { InvestmentAsset, InvestmentService } from "../../Service/InvestmentService";
import { useLiteMode } from "../../Context/LiteModeContext";

const { width } = Dimensions.get("window");

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
};

const ACTIONS = {
  START: "start",
  SUCCESS: "success",
  ERROR: "error"
};

type InvestmentState = {
  loading: boolean;
  data: InvestmentAsset[];
  error: string | null;
};

const initialState: InvestmentState = {
  loading: true,
  data: [],
  error: null
};

function reducer(state: InvestmentState, action: any): InvestmentState {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true };
    case ACTIONS.SUCCESS:
      return { ...state, loading: false, data: action.payload, error: null };
    case ACTIONS.ERROR:
      return { ...state, loading: false, data: [], error: action.payload };
    default:
      return state;
  }
}

export default function InvestmentPage({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { animationEnabled, syncInterval } = useLiteMode();

  useEffect(() => {
    const loadAssets = async () => {
      dispatch({ type: ACTIONS.START });

      try {
        const investmentService = new InvestmentService();
        const data = await investmentService.getAssets();

        dispatch({ type: ACTIONS.SUCCESS, payload: data });
        setSelectedAsset(data[0] ?? null);
      } catch (error: any) {
        dispatch({
          type: ACTIONS.ERROR,
          payload: error.message || "Erro ao carregar ativos",
        });
      }
    };

    loadAssets();
  }, [syncInterval]);

  const assets = state.data;

  const filteredAssets = useMemo(() => {
    return selectedFilter === "Todos"
      ? assets
      : assets.filter((asset) => asset.type === selectedFilter);
  }, [selectedFilter, assets]);

  useEffect(() => {
    if (filteredAssets.length > 0 && selectedAsset && !filteredAssets.some((asset) => asset.symbol === selectedAsset.symbol)) {
      setSelectedAsset(filteredAssets[0]);
    }
  }, [filteredAssets, selectedAsset]);

  const chartValues = selectedAsset?.history?.length ? selectedAsset.history : [0, 0, 0, 0, 0, 0];

  const chartLabels = chartValues.map((_, index) => {
    const total = chartValues.length;

    if (total <= 6) return String(index + 1);

    const step = Math.ceil(total / 4);

    return index % step === 0 ? String(index + 1) : "";
  });

  const totalAssets = assets.length;
  const positiveAssets = assets.filter((asset) => asset.variation >= 0).length;
  const totalDividends = assets.reduce((total, asset) => total + asset.dividend, 0);

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatVariation = (value: number) => {
    const formatted = Number(value || 0).toFixed(2).replace(".", ",");
    return `${value >= 0 ? "+" : ""}${formatted}%`;
  };

  if (state.loading) {
    return (
      <View style={styles.center_container}>
        <ActivityIndicator size="large" color={CORES.ORANGE} />
        <Text style={styles.center_text}>Carregando ativos...</Text>
      </View>
    );
  }

  if (state.error || !selectedAsset) {
    return (
      <View style={styles.center_container}>
        <Text style={styles.error_text}>{state.error || "Nenhum ativo encontrado"}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")} style={styles.back_btn}>
          <View style={styles.back_btn_content}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            <Text style={styles.btn_text}>Voltar</Text>
          </View>
        </TouchableOpacity>
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

      <Text style={styles.title}>Modo Investidor</Text>
      <Text style={styles.subtitle}>Acompanhe ações, FIIs e Tesouro Direto</Text>

      <View style={styles.summary_card}>
        <Text style={styles.summary_label}>Ativo em destaque</Text>
        <Text style={styles.summary_symbol}>{selectedAsset.symbol}</Text>
        <Text style={styles.summary_price}>{formatCurrency(selectedAsset.price)}</Text>
        <Text style={[styles.variation, selectedAsset.variation >= 0 ? styles.positive : styles.negative]}>
          {formatVariation(selectedAsset.variation)}
        </Text>
      </View>

      <View style={styles.market_row}>
        <View style={styles.market_card}>
          <Text style={styles.market_label}>Ativos</Text>
          <Text style={styles.market_value}>{totalAssets}</Text>
        </View>

        <View style={styles.market_card}>
          <Text style={styles.market_label}>Em alta</Text>
          <Text style={styles.market_value}>{positiveAssets}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {["Todos", "Ação", "FII", "Tesouro"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filter_button, selectedFilter === filter && styles.filter_button_active]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filter_text, selectedFilter === filter && styles.filter_text_active]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.chart_card}>
        <Text style={styles.section_title}>Variação de {selectedAsset.symbol}</Text>

        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartValues }],
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
              stroke: CORES.ORANGE,
            },
          }}
          bezier={animationEnabled}
          withDots={animationEnabled}
          style={styles.chart}
        />
      </View>

      <Text style={styles.section_title}>Ativos acompanhados</Text>

      {filteredAssets.length > 0 ? (
        filteredAssets.map((asset) => (
          <TouchableOpacity
            key={asset.symbol}
            style={[styles.asset_card, selectedAsset.symbol === asset.symbol && styles.asset_card_active]}
            onPress={() => setSelectedAsset(asset)}
          >
            <View style={styles.asset_left}>
              <Text style={styles.asset_symbol}>{asset.symbol}</Text>
              <Text style={styles.asset_name}>{asset.name}</Text>
              <Text style={styles.asset_type}>{asset.type}</Text>
            </View>

            <View style={styles.asset_right}>
              <Text style={styles.asset_price}>{formatCurrency(asset.price)}</Text>
              <Text style={[styles.variation_small, asset.variation >= 0 ? styles.positive : styles.negative]}>
                {formatVariation(asset.variation)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.empty_card}>
          <Text style={styles.empty_text}>Nenhum ativo encontrado para este filtro.</Text>
        </View>
      )}

      <View style={styles.dividend_card}>
        <Text style={styles.section_title}>Dividendos e rendimentos</Text>

        {assets.map((asset) => (
          <View key={asset.symbol} style={styles.dividend_row}>
            <View style={styles.asset_left}>
              <Text style={styles.dividend_name}>{asset.symbol}</Text>
              <Text style={styles.dividend_description}>{asset.name}</Text>
            </View>

            <Text style={styles.dividend_value}>
              {asset.dividend > 0 ? formatCurrency(asset.dividend) : "Indisponível"}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.WHITE,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center_container: {
    flex: 1,
    backgroundColor: CORES.WHITE,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  center_text: {
    marginTop: 12,
    color: "#777",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  error_text: {
    color: CORES.MIDNIGHT,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    marginBottom: 18,
  },
  back_btn: {
    backgroundColor: CORES.ORANGE,
    width: 120,
    height: 44,
    marginTop: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  back_btn_content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btn_text: {
    color: CORES.WHITE,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginLeft: 6,
  },
  title: {
    fontSize: 34,
    color: CORES.MIDNIGHT,
    marginTop: 26,
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginTop: 4,
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
  },
  summary_card: {
    backgroundColor: CORES.MIDNIGHT,
    borderRadius: 28,
    padding: 24,
    marginBottom: 18,
  },
  summary_label: {
    color: "#AAA",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  summary_symbol: {
    color: CORES.WHITE,
    fontSize: 20,
    // marginTop: 14,
    fontFamily: "Poppins_700Bold",
  },
  summary_price: {
    color: CORES.WHITE,
    fontSize: 34,
    // marginTop: 8,
    fontFamily: "Poppins_700Bold",
  },
  variation: {
    fontSize: 20,
    // marginTop: 8,
    fontFamily: "Poppins_700Bold",
  },
  market_row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  market_card: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  market_label: {
    fontSize: 12,
    color: "#777",
    fontFamily: "Poppins_600SemiBold",
  },
  market_value: {
    fontSize: 22,
    color: CORES.MIDNIGHT,
    marginTop: 4,
    fontFamily: "Poppins_700Bold",
  },
  market_value_small: {
    fontSize: 14,
    color: CORES.MIDNIGHT,
    marginTop: 8,
    fontFamily: "Poppins_700Bold",
  },
  filters: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    paddingRight: 20,
  },
  filter_button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#F3F3F3",
  },
  filter_button_active: {
    backgroundColor: CORES.ORANGE,
  },
  filter_text: {
    color: "#555",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  filter_text_active: {
    color: CORES.WHITE,
  },
  chart_card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    overflow: "hidden",
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  section_title: {
    fontSize: 18,
    color: CORES.MIDNIGHT,
    marginBottom: 12,
    fontFamily: "Poppins_700Bold",
  },
  asset_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  asset_card_active: {
    borderColor: CORES.ORANGE,
  },
  asset_left: {
    flex: 1,
    paddingRight: 10,
  },
  asset_symbol: {
    fontSize: 18,
    color: CORES.MIDNIGHT,
    fontFamily: "Poppins_700Bold",
  },
  asset_name: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },
  asset_type: {
    fontSize: 12,
    color: CORES.ORANGE,
    marginTop: 6,
    fontFamily: "Poppins_700Bold",
  },
  asset_right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  asset_price: {
    fontSize: 16,
    color: CORES.MIDNIGHT,
    fontFamily: "Poppins_700Bold",
  },
  variation_small: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Poppins_700Bold",
  },
  empty_card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  empty_text: {
    color: "#777",
    fontFamily: "Poppins_400Regular",
  },
  dividend_card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
  },
  dividend_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  dividend_name: {
    color: CORES.MIDNIGHT,
    fontFamily: "Poppins_700Bold",
  },
  dividend_description: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },
  dividend_value: {
    color: "#555",
    fontFamily: "Poppins_700Bold",
    textAlign: "right",
  },
  positive: {
    color: "#28A745",
  },
  negative: {
    color: "#E53935",
  },
});