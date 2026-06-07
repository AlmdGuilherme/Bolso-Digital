import React, { useEffect, useReducer } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { QRCodeService } from '../Service/QRCodeService';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  O_SHADOW: '#C42500',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
  RED: '#D32F2F',
  GREEN: '#2E7D32',
};

type PendingTransaction = {
  id: number;
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  accountNumber?: string;
  onUpdated?: () => Promise<void> | void;
};

type State = {
  loading: boolean;
  actionLoadingId: number | null;
  transactions: PendingTransaction[];
  error: string;
};

const ACTIONS = {
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error',
  ACTION_START: 'action_start',
  ACTION_END: 'action_end',
  RESET: 'reset',
};

const initialState: State = {
  loading: false,
  actionLoadingId: null,
  transactions: [],
  error: '',
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case ACTIONS.START:
      return {
        ...state,
        loading: true,
        error: '',
      };

    case ACTIONS.SUCCESS:
      return {
        ...state,
        loading: false,
        transactions: action.payload,
        error: '',
      };

    case ACTIONS.ERROR:
      return {
        ...state,
        loading: false,
        actionLoadingId: null,
        error: action.payload,
      };

    case ACTIONS.ACTION_START:
      return {
        ...state,
        actionLoadingId: action.payload,
        error: '',
      };

    case ACTIONS.ACTION_END:
      return {
        ...state,
        actionLoadingId: null,
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

export function PendingTransactionsModal({
  visible,
  onClose,
  accountNumber,
  onUpdated,
}: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadPendingTransactions = async () => {
    try {
      if (!accountNumber) {
        dispatch({
          type: ACTIONS.ERROR,
          payload: 'Conta não encontrada.',
        });
        return;
      }

      dispatch({ type: ACTIONS.START });

      const qrCodeService = new QRCodeService();
      const transactions = await qrCodeService.getPendingTransactions(accountNumber);

      dispatch({
        type: ACTIONS.SUCCESS,
        payload: transactions,
      });
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error?.message || 'Não foi possível buscar as pendências.',
      });
    }
  };

  const handleClose = () => {
    dispatch({ type: ACTIONS.RESET });
    onClose();
  };

  const handleConfirm = async (transactionId: number) => {
    try {
      if (!accountNumber) return;

      dispatch({
        type: ACTIONS.ACTION_START,
        payload: transactionId,
      });

      const qrCodeService = new QRCodeService();

      await qrCodeService.confirmPendingTransaction(transactionId, accountNumber);

      await loadPendingTransactions();

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error?.message || 'Não foi possível confirmar a pendência.',
      });
    } finally {
      dispatch({ type: ACTIONS.ACTION_END });
    }
  };

  const handleCancel = async (transactionId: number) => {
    try {
      if (!accountNumber) return;

      dispatch({
        type: ACTIONS.ACTION_START,
        payload: transactionId,
      });

      const qrCodeService = new QRCodeService();

      await qrCodeService.cancelPendingTransaction(transactionId, accountNumber);

      await loadPendingTransactions();

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error?.message || 'Não foi possível cancelar a pendência.',
      });
    } finally {
      dispatch({ type: ACTIONS.ACTION_END });
    }
  };

  useEffect(() => {
    if (visible) {
      loadPendingTransactions();
    }
  }, [visible, accountNumber]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Pendências</Text>

          <Text style={styles.description}>
            Confirme ou cancele as despesas geradas por QR Code.
          </Text>

          {state.loading ? (
            <View style={styles.feedback_area}>
              <ActivityIndicator size="large" color={CORES.ORANGE} />
              <Text style={styles.feedback_text}>Buscando pendências...</Text>
            </View>
          ) : state.transactions.length === 0 ? (
            <View style={styles.feedback_area}>
              <Text style={styles.empty_title}>Nenhuma pendência</Text>
              <Text style={styles.feedback_text}>
                Você não possui despesas pendentes no momento.
              </Text>
            </View>
          ) : (
            <FlatList
              data={state.transactions}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list_content}
              renderItem={({ item }) => {
                const isLoading = state.actionLoadingId === item.id;

                return (
                  <View style={styles.pending_card}>
                    <View>
                      <Text style={styles.pending_description}>{item.description}</Text>

                      <Text style={styles.pending_amount}>
                        R$ {Number(item.amount).toFixed(2).replace('.', ',')}
                      </Text>

                      <Text style={styles.pending_status}>Status: pendente</Text>
                    </View>

                    <View style={styles.card_actions}>
                      <TouchableOpacity
                        style={[styles.cancel_pending_button, isLoading && { opacity: 0.7 }]}
                        disabled={isLoading}
                        onPress={() => handleCancel(item.id)}
                      >
                        <Text style={styles.cancel_pending_text}>Cancelar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.confirm_pending_button, isLoading && { opacity: 0.7 }]}
                        disabled={isLoading}
                        onPress={() => handleConfirm(item.id)}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={CORES.WHITE} />
                        ) : (
                          <Text style={styles.confirm_pending_text}>Confirmar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {state.error ? <Text style={styles.error_text}>{state.error}</Text> : null}

          <TouchableOpacity style={styles.close_button} onPress={handleClose}>
            <Text style={styles.close_text}>Fechar</Text>
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
  feedback_area: {
    minHeight: 180,
    borderRadius: 18,
    backgroundColor: CORES.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    marginBottom: 12,
  },
  empty_title: {
    fontSize: 18,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 6,
  },
  feedback_text: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  list_content: {
    gap: 12,
    paddingBottom: 12,
  },
  pending_card: {
    borderRadius: 18,
    backgroundColor: CORES.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    padding: 14,
    gap: 12,
  },
  pending_description: {
    fontSize: 17,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 4,
  },
  pending_amount: {
    fontSize: 22,
    fontWeight: '800',
    color: CORES.ORANGE,
    marginBottom: 4,
  },
  pending_status: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  card_actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancel_pending_button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirm_pending_button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancel_pending_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
    fontSize: 14,
  },
  confirm_pending_text: {
    color: CORES.WHITE,
    fontWeight: '700',
    fontSize: 14,
  },
  error_text: {
    color: CORES.RED,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  close_button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.O_SHADOW,
    justifyContent: 'center',
    alignItems: 'center',
  },
  close_text: {
    color: CORES.WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
});