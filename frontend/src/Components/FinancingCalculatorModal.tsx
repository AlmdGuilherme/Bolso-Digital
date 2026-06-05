import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F3F3F3',
  GRAY: '#777',
  BORDER: '#E5E5E5',
};

type FinancingType = 'PRICE' | 'SAC';

type InstallmentRow = {
  installment: number;
  payment: number;
  interest: number;
  amortization: number;
  balance: number;
};

type FinancingResult = {
  schedule: InstallmentRow[];
  totalPaid: number;
  totalInterest: number;
  firstPayment: number;
  lastPayment: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

function calculatePrice(
  principal: number,
  monthlyRatePercent: number,
  installments: number
): FinancingResult {
  const rate = monthlyRatePercent / 100;
  const schedule: InstallmentRow[] = [];

  if (principal <= 0 || installments <= 0) {
    return {
      schedule: [],
      totalPaid: 0,
      totalInterest: 0,
      firstPayment: 0,
      lastPayment: 0,
    };
  }

  let payment = 0;

  if (rate === 0) {
    payment = principal / installments;
  } else {
    payment =
      principal *
      ((rate * Math.pow(1 + rate, installments)) /
        (Math.pow(1 + rate, installments) - 1));
  }

  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;

  for (let i = 1; i <= installments; i++) {
    const interest = balance * rate;
    let amortization = payment - interest;

    if (i === installments) {
      amortization = balance;
    }

    const currentPayment = amortization + interest;
    balance -= amortization;

    if (balance < 0.01) balance = 0;

    totalPaid += currentPayment;
    totalInterest += interest;

    schedule.push({
      installment: i,
      payment: Number(currentPayment.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      amortization: Number(amortization.toFixed(2)),
      balance: Number(balance.toFixed(2)),
    });
  }

  return {
    schedule,
    totalPaid: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    firstPayment: schedule[0]?.payment || 0,
    lastPayment: schedule[schedule.length - 1]?.payment || 0,
  };
}

function calculateSAC(
  principal: number,
  monthlyRatePercent: number,
  installments: number
): FinancingResult {
  const rate = monthlyRatePercent / 100;
  const schedule: InstallmentRow[] = [];

  if (principal <= 0 || installments <= 0) {
    return {
      schedule: [],
      totalPaid: 0,
      totalInterest: 0,
      firstPayment: 0,
      lastPayment: 0,
    };
  }

  const amortization = principal / installments;
  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;

  for (let i = 1; i <= installments; i++) {
    const interest = balance * rate;
    const payment = amortization + interest;

    balance -= amortization;
    if (balance < 0.01) balance = 0;

    totalPaid += payment;
    totalInterest += interest;

    schedule.push({
      installment: i,
      payment: Number(payment.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      amortization: Number(amortization.toFixed(2)),
      balance: Number(balance.toFixed(2)),
    });
  }

  return {
    schedule,
    totalPaid: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    firstPayment: schedule[0]?.payment || 0,
    lastPayment: schedule[schedule.length - 1]?.payment || 0,
  };
}

import CurrencyInput from 'react-native-currency-input';
import { useLiteMode } from '../Context/LiteModeContext';

export function FinancingCalculatorModal({ visible, onClose }: Props) {
  const [type, setType] = useState<FinancingType>('PRICE');
  const [principal, setPrincipal] = useState<number | null>(0);
  const [monthlyRate, setMonthlyRate] = useState('');
  const [installments, setInstallments] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [result, setResult] = useState<FinancingResult | null>(null);
  const { animationEnabled } = useLiteMode();

  const isAvailbleToCalculate =
    (principal ?? 0) > 0 &&
    monthlyRate.trim().length > 0 &&
    installments.trim().length > 0;

  const parsedPrincipal = principal ?? 0;

  const parsedRate = useMemo(
    () => Number(monthlyRate.replace(',', '.')),
    [monthlyRate]
  );

  const parsedInstallments = useMemo(
    () => Number(installments),
    [installments]
  );

  const handleCalculate = () => {
    if (!parsedPrincipal || parsedPrincipal <= 0) {
      alert('Informe um valor financiado válido.');
      return;
    }

    if (parsedRate < 0 || Number.isNaN(parsedRate)) {
      alert('Informe uma taxa de juros válida.');
      return;
    }

    if (!parsedInstallments || parsedInstallments <= 0) {
      alert('Informe a quantidade de parcelas.');
      return;
    }

    const calculation =
      type === 'PRICE'
        ? calculatePrice(parsedPrincipal, parsedRate, parsedInstallments)
        : calculateSAC(parsedPrincipal, parsedRate, parsedInstallments);

    setResult(calculation);
    setHasCalculated(true);
  };

  const handleClear = () => {
    setType('PRICE');
    setPrincipal(0);
    setMonthlyRate('');
    setInstallments('');
    setHasCalculated(false);
    setResult(null);
  };
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const renderInstallment = ({ item }: { item: InstallmentRow }) => (
    <View style={styles.rowCard}>
      <Text style={styles.rowTitle}>Parcela {item.installment}</Text>
      <Text style={styles.rowText}>Prestação: {formatCurrency(item.payment)}</Text>
      <Text style={styles.rowText}>Juros: {formatCurrency(item.interest)}</Text>
      <Text style={styles.rowText}>Amortização: {formatCurrency(item.amortization)}</Text>
      <Text style={styles.rowText}>Saldo devedor: {formatCurrency(item.balance)}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationEnabled ? "slide" : "none"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Calculadora de Financiamento</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Sistema</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'PRICE' && styles.typeButtonActive]}
                onPress={() => setType('PRICE')}
              >
                <Text style={[styles.typeButtonText, type === 'PRICE' && styles.typeButtonTextActive]}>
                  Price
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, type === 'SAC' && styles.typeButtonActive]}
                onPress={() => setType('SAC')}
              >
                <Text style={[styles.typeButtonText, type === 'SAC' && styles.typeButtonTextActive]}>
                  SAC
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Valor financiado</Text>
            <CurrencyInput
              style={styles.input}
              value={principal ?? 0}
              onChangeValue={setPrincipal}
              prefix="R$ "
              delimiter="."
              separator=","
              precision={2}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Taxa de juros mensal (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 1.5"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={monthlyRate}
              onChangeText={setMonthlyRate}
            />

            <Text style={styles.label}>Número de parcelas</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 24"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={installments}
              onChangeText={setInstallments}
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleClear}>
                <Text style={styles.secondaryButtonText}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, !isAvailbleToCalculate && { opacity: 0.5 }]}
                onPress={handleCalculate}
                disabled={!isAvailbleToCalculate}
              >
                <Text style={styles.primaryButtonText}>Calcular</Text>
              </TouchableOpacity>
            </View>

            {hasCalculated && result && (
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumo</Text>
                  <Text style={styles.summaryText}>Total pago: R$ {result.totalPaid.toFixed(2)}</Text>
                  <Text style={styles.summaryText}>Total de juros: R$ {result.totalInterest.toFixed(2)}</Text>
                  <Text style={styles.summaryText}>Primeira parcela: R$ {result.firstPayment.toFixed(2)}</Text>
                  <Text style={styles.summaryText}>Última parcela: R$ {result.lastPayment.toFixed(2)}</Text>
                </View>

                <Text style={styles.tableTitle}>Tabela de amortização</Text>

                <FlatList
                  data={result.schedule}
                  keyExtractor={(item) => String(item.installment)}
                  renderItem={renderInstallment}
                  scrollEnabled={false}
                  contentContainerStyle={styles.scheduleList}
                />
              </>
            )}
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
    backgroundColor: CORES.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginTop: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    paddingHorizontal: 14,
    fontSize: 16,
    color: CORES.MIDNIGHT,
    backgroundColor: CORES.WHITE,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: CORES.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: CORES.ORANGE,
  },
  typeButtonText: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
  },
  typeButtonTextActive: {
    color: CORES.WHITE,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: CORES.WHITE,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: CORES.MIDNIGHT,
    marginBottom: 6,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 12,
  },
  scheduleList: {
    paddingBottom: 10,
  },
  rowCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 10,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 14,
    color: CORES.MIDNIGHT,
    marginBottom: 4,
  },
});