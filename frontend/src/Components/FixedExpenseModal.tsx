import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TransactionService } from '../Service/TransactionService';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
  GREEN: '#1FA463',
};

type FixedExpense = {
  description: string;
  category?: string;
  subcategory?: string;
  averageAmount: number;
  occurrences: number;
  monthsDetected: number;
  confidence: 'alta' | 'média' | 'baixa';
  lastOccurrence: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  accountNumber?: string;
};

export function FixedExpensesModal({
  visible,
  onClose,
  accountNumber,
}: Props) {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(false);

  const transactionService = new TransactionService();

  useEffect(() => {
    if (visible && accountNumber) {
      loadFixedExpenses();
    }

    if (!visible) {
      setFixedExpenses([]);
    }
  }, [visible, accountNumber]);

  const loadFixedExpenses = async () => {
    try {
      if (!accountNumber) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      setLoading(true);

      const data = await transactionService.detectFixedExpenses(accountNumber);
      setFixedExpenses(data);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível detectar despesas fixas.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getConfidenceLabel = (confidence: string) => {
    if (confidence === 'alta') return 'Alta confiança';
    if (confidence === 'média') return 'Média confiança';
    return 'Baixa confiança';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.overlay}>
        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Despesas Fixas</Text>

          <Text style={styles.description}>
            Detectamos despesas que se repetem em meses diferentes com valores parecidos.
          </Text>

          {loading ? (
            <View style={styles.loading_container}>
              <ActivityIndicator color={CORES.ORANGE} size="large" />
              <Text style={styles.loading_text}>Analisando despesas...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {fixedExpenses.length === 0 ? (
                <View style={styles.empty_container}>
                  <Text style={styles.empty_title}>Nenhuma despesa fixa detectada</Text>
                  <Text style={styles.empty_text}>
                    Cadastre despesas recorrentes por alguns meses para que o sistema consiga identificar padrões.
                  </Text>
                </View>
              ) : (
                fixedExpenses.map((expense, index) => (
                  <View key={`${expense.description}-${index}`} style={styles.card}>
                    <View style={styles.card_header}>
                      <View style={styles.card_info}>
                        <Text style={styles.expense_title}>
                          {expense.description}
                        </Text>

                        <Text style={styles.expense_category}>
                          {expense.category || 'Sem categoria'}
                          {expense.subcategory ? ` • ${expense.subcategory}` : ''}
                        </Text>
                      </View>

                      <Text style={styles.amount}>
                        {formatCurrency(expense.averageAmount)}
                      </Text>
                    </View>

                    <View style={styles.details}>
                      <Text style={styles.detail_text}>
                        {expense.occurrences} ocorrência(s)
                      </Text>

                      <Text style={styles.detail_text}>
                        {expense.monthsDetected} mês(es)
                      </Text>

                      <Text style={styles.detail_text}>
                        Última: {formatDate(expense.lastOccurrence)}
                      </Text>
                    </View>

                    <View style={styles.confidence_badge}>
                      <Text style={styles.confidence_text}>
                        {getConfidenceLabel(expense.confidence)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.close_button} onPress={onClose}>
            <Text style={styles.close_button_text}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  modal_container: {
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 18,
  },
  loading_container: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading_text: {
    marginTop: 12,
    color: '#666',
    fontWeight: '600',
  },
  empty_container: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  empty_title: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 8,
    textAlign: 'center',
  },
  empty_text: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: CORES.LIGHT_GRAY,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CORES.BORDER,
  },
  card_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card_info: {
    flex: 1,
  },
  expense_title: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
  },
  expense_category: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: CORES.ORANGE,
  },
  details: {
    marginTop: 12,
    gap: 4,
  },
  detail_text: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  confidence_badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#E5F7ED',
    justifyContent: 'center',
  },
  confidence_text: {
    fontSize: 12,
    fontWeight: '700',
    color: CORES.GREEN,
  },
  close_button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  close_button_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
    fontSize: 15,
  },
});