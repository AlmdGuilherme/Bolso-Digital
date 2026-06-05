import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLiteMode } from '../Context/LiteModeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const screenWidth = Dimensions.get('window').width;

export const BalanceCard = ({ type, title, data, chart, totals, loading, cardId, activeCardId }: any) => {
  const [expanded, setExpanded] = useState(false);
  const { animationEnabled } = useLiteMode();

  useEffect(() => {
    if (activeCardId !== cardId && expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);
    }
  }, [activeCardId]);

  if (loading) {
    return (
      <View style={styles.card_container}>
        <ActivityIndicator size="large" color="#F34A23" />
      </View>
    );
  }

  const isBalance = type === 'BALANCE';
  const isIncome = type === 'INCOME';
  const themeColor = isBalance ? "#F34A23" : (isIncome ? "#4CAF50" : "#F44336");

  const displayValue = isBalance
    ? data?.balance
    : (isIncome ? totals?.income : totals?.expense);

  const currentChart = isBalance
    ? chart?.balanceChart
    : (isIncome ? chart?.incomeChart : chart?.expenseChart);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const formatChartData = (chartData: any) => {
    if (!chartData || !chartData.labels) return { labels: [], datasets: [{ data: [0] }] };

    const labels = chartData.labels.map((label: string, index: number) => {
      if (chartData.labels.length > 6) {
        return index % Math.ceil(chartData.labels.length / 4) === 0 ? label : "";
      }
      return label;
    });

    return {
      labels: labels,
      datasets: [{
        data: chartData.values,
        color: (opacity = 1) => themeColor,
        strokeWidth: 3
      }]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: "#1f1f1f",
    backgroundGradientTo: "#1f1f1f",
    decimalPlaces: 0,
    color: (opacity = 1) => themeColor,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
    propsForLabels: {
      fontSize: 10,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: themeColor
    }
  };

  const formatCurrency = (value: number | string) => {
    const numeric = typeof value === 'number'
      ? value
      : Number(String(value).replace(',', '.'));

    return numeric.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card_container, { borderColor: expanded ? themeColor : '#2a2a2a' }]}
      onPress={toggleExpand}
      activeOpacity={0.9}
    >
      <Text style={[styles.label, { color: themeColor }]}>{title}</Text>

      <View style={styles.row}>
        <Text style={styles.balance_text}>
          {formatCurrency(displayValue ?? 0)}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={32}
          color={themeColor}
        />
      </View>

      {expanded && (
        <View style={styles.expanded_content}>
          <View style={styles.divider} />

          <Text style={styles.chart_title}>Evolução (Mês)</Text>
          {currentChart?.values && currentChart.values.length > 0 ? (
            <LineChart
              data={formatChartData(currentChart)}
              width={screenWidth * 0.85}
              height={165}
              chartConfig={chartConfig}
              bezier={animationEnabled}
              withDots={animationEnabled}
              withInnerLines={false}
              withOuterLines={false}
              style={styles.chart_style}
            />
          ) : (
            <View style={styles.no_data_chart}>
              <Text style={styles.no_data_text}>Sem dados para o gráfico</Text>
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.footer_text}>ID: {data?.account_number}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card_container: {
    width: screenWidth * 0.9,
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 5
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  balance_text: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  expanded_content: {
    marginTop: 10,
    alignItems: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginVertical: 15
  },
  chart_title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
    opacity: 0.6
  },
  chart_style: {
    borderRadius: 16,
    paddingRight: 40,
    marginLeft: 35
  },
  no_data_chart: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center'
  },
  no_data_text: {
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12
  },
  footer_text: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center'
  }
});