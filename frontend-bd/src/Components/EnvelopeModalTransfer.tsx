import CurrencyInput from 'react-native-currency-input';
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLiteMode } from '../Context/LiteModeContext';
import { ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { EnvelopeService } from '../Service/EnvelopeService';

const screenWidth = Dimensions.get('window').width;


const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
}

type Envelope = {
  id: number | string;
  name: string;
  allocated_amount: number;
  current_amount: number;
  budget_period: 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  auto_reset: boolean;
  expired: boolean;
};

type EnvelopeTransferModal = {
  visible: boolean;
  selectedEnvelope: Envelope | null;
  envelopes: Envelope[];
  onClose: () => void;
  onTransfer: (data: {
    source_envelope_id: string | number;
    target_envelope_id: string | number;
    amount: number;
  }) => void;
};

const ACTIONS = {
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error',
};

const initialState = {
  loading: false,
  data: [],
  error: null,
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true };
    case ACTIONS.SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null,
      };
    case ACTIONS.ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export function EnvelopeTransferModal({
  visible,
  selectedEnvelope,
  envelopes,
  onClose,
  onTransfer,
}: EnvelopeTransferModal) {
  const [destinationEnvelopeId, setDestinationEnvelopeId] = useState<number | string | null>(null);
  const [amount, setAmount] = useState<number | null>(0);
  const { animationEnabled } = useLiteMode();
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (visible && selectedEnvelope) {
      const loadEnvelopeData = async () => {
        dispatch({ type: ACTIONS.START })
        try {
          const envelopeService = new EnvelopeService()
          const history = await envelopeService.getEnvelopeHistory(Number(selectedEnvelope.id))
          console.log('ID selecionado:', selectedEnvelope.id);
          console.log('Histórico:', history);
          console.log('Valores gráfico:', chartValues);
          console.log(history)
          dispatch({ type: ACTIONS.SUCCESS, payload: history })
        } catch (error: any) {
          dispatch({ type: ACTIONS.ERROR, payload: error.message })
        }
      }

      loadEnvelopeData()
      setDestinationEnvelopeId(null);
      setAmount(0);
    }
  }, [visible, selectedEnvelope]);

  const destinationEnvelopes = useMemo(() => {
    if (!selectedEnvelope) return [];
    return envelopes.filter((env) => env.id !== selectedEnvelope.id);
  }, [envelopes, selectedEnvelope]);

  const isAbleToTransfer =
    destinationEnvelopeId !== null &&
    (amount ?? 0) > 0;

  const handleTransfer = () => {
    if (!selectedEnvelope) return;

    const parsedAmount = amount ?? 0;

    if (!destinationEnvelopeId) {
      alert('Selecione um envelope de destino.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    if (parsedAmount > Number(selectedEnvelope.current_amount)) {
      alert('O valor informado é maior que o saldo atual do envelope.');
      return;
    }

    onTransfer({
      source_envelope_id: selectedEnvelope.id,
      target_envelope_id: destinationEnvelopeId,
      amount: parsedAmount,
    });
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const chartValues = Array(12).fill(0);

  state.data?.forEach((item: any) => {
    const date = new Date(item.period_start);
    const monthIndex = date.getMonth();

    chartValues[monthIndex] = Number(item.allocated_amount);
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        data: chartValues
      }
    ]
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationEnabled ? "slide" : "none"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Detalhes do Envelope</Text>

            {selectedEnvelope && (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>Período</Text>

                  <Text style={styles.value}>
                    {selectedEnvelope.budget_period === 'monthly' ? 'Mensal' : 'Anual'}
                  </Text>

                  <Text style={styles.label}>Vigência</Text>

                  <Text style={styles.value}>
                    {!selectedEnvelope.period_start || !selectedEnvelope.period_end
                      ? 'Nenhuma data informada'
                      : `${new Date(selectedEnvelope.period_start).toLocaleDateString('pt-BR')} até ${new Date(selectedEnvelope.period_end).toLocaleDateString('pt-BR')}`}
                  </Text>

                  <Text style={styles.label}>Reinicialização automática</Text>

                  <Text style={styles.value}>
                    {selectedEnvelope.auto_reset ? 'Ativada' : 'Desativada'}
                  </Text>

                  <Text style={styles.label}>Status</Text>

                  <Text
                    style={[
                      styles.value,
                      { color: selectedEnvelope.expired ? '#D32F2F' : '#2E7D32' }
                    ]}
                  >
                    {selectedEnvelope.expired ? 'Expirado' : 'Ativo'}
                  </Text>
                </View>

                <Text style={styles.title}>Evolução do envelope</Text>

                <View style={styles.chartContainer}>
                  <LineChart
                    data={chartData}
                    width={screenWidth - 40}
                    height={220}
                    yAxisLabel="R$ "
                    yAxisSuffix=""
                    fromZero
                    chartConfig={{
                      backgroundColor: '#FFF',
                      backgroundGradientFrom: '#FFF',
                      backgroundGradientTo: '#FFF',
                      decimalPlaces: 0,
                      color: () => CORES.ORANGE,
                      labelColor: () => '#161616',
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: CORES.ORANGE
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </>
            )}

            <Text style={styles.subtitle}>Transferir para</Text>

            <FlatList
              data={destinationEnvelopes}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destinationList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = destinationEnvelopeId === item.id;

                return (
                  <TouchableOpacity
                    style={[styles.destinationCard, isSelected && styles.destinationCardSelected]}
                    onPress={() => setDestinationEnvelopeId(item.id)}
                  >
                    <Text style={[styles.destinationName, isSelected && styles.destinationNameSelected]}>
                      {item.name}
                    </Text>

                    <Text style={[styles.destinationAmount, isSelected && styles.destinationNameSelected]}>
                      {formatCurrency(Number(item.current_amount))}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <Text style={styles.subtitle}>Valor da transferência</Text>

            <CurrencyInput
              style={styles.input}
              value={amount ?? 0}
              onChangeValue={setAmount}
              prefix="R$ "
              delimiter="."
              separator=","
              precision={2}
              keyboardType="numeric"
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, !isAbleToTransfer && { opacity: 0.5 }]}
                onPress={handleTransfer}
                disabled={!isAbleToTransfer}
              >
                <Text style={styles.confirmText}>Transferir</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    minHeight: 500,
    maxHeight: '85%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 18,
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'center'
  },
  label: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 12,
  },
  destinationList: {
    paddingBottom: 12,
    gap: 12,
  },
  destinationCard: {
    width: 150,
    backgroundColor: '#F3F3F3',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    justifyContent: 'center'
  },
  destinationCardSelected: {
    borderColor: CORES.O_SHADOW,
    backgroundColor: CORES.O_SHADOW,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8,
  },
  destinationNameSelected: {
    color: '#FFF',
  },
  destinationAmount: {
    fontSize: 14,
    color: '#555',
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#161616',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#161616',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  chart: {
    borderRadius: 16,
  },
});