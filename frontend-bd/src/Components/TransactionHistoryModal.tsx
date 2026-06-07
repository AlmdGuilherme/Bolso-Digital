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
  Image,
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
  RED: '#D64545',
};

type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  type: 'expense' | 'income';
  category?: string;
  subcategory?: string;
  status?: string;
  created_at: string;
  has_receipt?: boolean;
};

type Receipt = {
  id: string;
  transaction_id: string;
  image_uri: string;
  created_at: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  accountNumber?: string;
};

export function TransactionHistoryModal({
  visible,
  onClose,
  accountNumber,
}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedReceiptUri, setSelectedReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const transactionService = new TransactionService();

  useEffect(() => {
    if (visible && accountNumber) {
      loadTransactions();
    }

    if (!visible) {
      setTransactions([]);
      setReceipts([]);
      setSelectedTransaction(null);
      setSelectedReceiptUri(null);
    }
  }, [visible, accountNumber]);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      if (!accountNumber) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      const data = await transactionService.getTransactionsByAccount(accountNumber);
      setTransactions(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao buscar histórico.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipts = async (transaction: Transaction) => {
    try {
      if (!accountNumber) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      setSelectedTransaction(transaction);
      setSelectedReceiptUri(null);
      setLoadingReceipts(true);

      const data = await transactionService.getReceiptsByTransaction(
        transaction.id,
        accountNumber
      );

      setReceipts(data);

      if (data.length === 0) {
        Alert.alert('Recibo', 'Essa transação não possui recibos.');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao buscar recibos.');
    } finally {
      setLoadingReceipts(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return Math.abs(Number(value)).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const closeReceiptView = () => {
    setSelectedReceiptUri(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.overlay}>
        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Histórico de Transações</Text>

          {loading ? (
            <View style={styles.loading_container}>
              <ActivityIndicator color={CORES.ORANGE} size="large" />
              <Text style={styles.loading_text}>Carregando histórico...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {transactions.length === 0 ? (
                <Text style={styles.empty_text}>Nenhuma transação encontrada.</Text>
              ) : (
                transactions.map((transaction) => {
                  const isExpense = transaction.type === 'expense';

                  return (
                    <View key={transaction.id} style={styles.transaction_card}>
                      <View style={styles.transaction_header}>
                        <View style={styles.transaction_info}>
                          <Text style={styles.transaction_description}>
                            {transaction.description}
                          </Text>

                          <Text style={styles.transaction_category}>
                            {transaction.category || 'Sem categoria'}
                            {transaction.subcategory ? ` • ${transaction.subcategory}` : ''}
                          </Text>

                          <Text style={styles.transaction_date}>
                            {formatDate(transaction.created_at)}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.transaction_amount,
                            { color: isExpense ? CORES.RED : CORES.GREEN },
                          ]}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </Text>
                      </View>

                      <View style={styles.transaction_footer}>
                        <View
                          style={[
                            styles.status_badge,
                            transaction.status === 'pending' && styles.pending_badge,
                          ]}
                        >
                          <Text style={styles.status_text}>
                            {transaction.status === 'pending' ? 'Pendente' : 'Concluída'}
                          </Text>
                        </View>

                        {transaction.has_receipt ? (
                          <TouchableOpacity
                            style={styles.receipt_button}
                            onPress={() => handleOpenReceipts(transaction)}
                          >
                            <Text style={styles.receipt_button_text}>Ver recibo</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.no_receipt_text}>Sem recibo</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {selectedTransaction && (
            <View style={styles.receipts_section}>
              <View style={styles.receipts_header}>
                <Text style={styles.receipts_title}>Recibos</Text>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedTransaction(null);
                    setReceipts([]);
                    setSelectedReceiptUri(null);
                  }}
                >
                  <Text style={styles.close_receipts_text}>Fechar</Text>
                </TouchableOpacity>
              </View>

              {loadingReceipts ? (
                <ActivityIndicator color={CORES.ORANGE} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {receipts.map((receipt) => (
                    <TouchableOpacity
                      key={receipt.id}
                      style={styles.receipt_thumb_container}
                      onPress={() => setSelectedReceiptUri(receipt.image_uri)}
                    >
                      <Image source={{ uri: receipt.image_uri }} style={styles.receipt_thumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.close_button} onPress={onClose}>
            <Text style={styles.close_button_text}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedReceiptUri && (
        <Modal visible transparent animationType="fade" onRequestClose={closeReceiptView}>
          <View style={styles.image_overlay}>
            <Pressable style={styles.image_backdrop} onPress={closeReceiptView} />

            <View style={styles.image_modal}>
              <Image source={{ uri: selectedReceiptUri }} style={styles.full_image} />

              <TouchableOpacity style={styles.image_close_button} onPress={closeReceiptView}>
                <Text style={styles.image_close_text}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    marginBottom: 16,
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
  empty_text: {
    textAlign: 'center',
    color: '#777',
    fontWeight: '600',
    marginVertical: 40,
  },
  transaction_card: {
    backgroundColor: CORES.LIGHT_GRAY,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CORES.BORDER,
  },
  transaction_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  transaction_info: {
    flex: 1,
  },
  transaction_description: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
  },
  transaction_category: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  transaction_date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  transaction_amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  transaction_footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status_badge: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#E5F7ED',
    justifyContent: 'center',
  },
  pending_badge: {
    backgroundColor: '#FFF0D8',
  },
  status_text: {
    fontSize: 12,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
  },
  receipt_button: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receipt_button_text: {
    color: CORES.WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  no_receipt_text: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  receipts_section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CORES.BORDER,
  },
  receipts_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receipts_title: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 10,
  },
  close_receipts_text: {
    color: CORES.ORANGE,
    fontWeight: '700',
  },
  receipt_thumb_container: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: CORES.BORDER,
  },
  receipt_thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  image_overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  image_backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  image_modal: {
    backgroundColor: CORES.WHITE,
    borderRadius: 20,
    padding: 14,
  },
  full_image: {
    width: '100%',
    height: 420,
    resizeMode: 'contain',
    borderRadius: 16,
    backgroundColor: '#111',
  },
  image_close_button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  image_close_text: {
    color: CORES.WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
});