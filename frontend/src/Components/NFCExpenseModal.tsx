import React, { useReducer } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLiteMode } from '../Context/LiteModeContext';
import { NFCService } from '../Service/NFCService';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  O_SHADOW: '#C42500',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

type NfcExpense = {
  description: string;
  amount: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onExpenseRead: (expense: NfcExpense) => void;
};

type State = {
  loading: boolean;
  expense: NfcExpense | null;
  error: string;
};

const ACTIONS = {
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error',
  RESET: 'reset',
};

const initialState: State = {
  loading: false,
  expense: null,
  error: '',
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case ACTIONS.START:
      return {
        ...state,
        loading: true,
        expense: null,
        error: '',
      };

    case ACTIONS.SUCCESS:
      return {
        ...state,
        loading: false,
        expense: action.payload,
        error: '',
      };

    case ACTIONS.ERROR:
      return {
        ...state,
        loading: false,
        expense: null,
        error: action.payload,
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

export function NfcExpenseModal({ visible, onClose, onExpenseRead }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { animationEnabled } = useLiteMode();

  const handleClose = () => {
    dispatch({ type: ACTIONS.RESET });
    onClose();
  };

  const handleReadNfc = async () => {
    try {
      dispatch({ type: ACTIONS.START });

      const nfcService = new NFCService();
      const data = await nfcService.readTag();

      dispatch({
        type: ACTIONS.SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error.message || 'Não foi possível ler a tag NFC.',
      });
    }
  };

  const handleConfirm = () => {
    if (!state.expense) return;

    onExpenseRead(state.expense);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationEnabled ? 'slide' : 'none'}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Despesa por NFC</Text>

          <Text style={styles.description}>
            Aproxime o celular da tag NFC para identificar uma despesa rápida.
          </Text>

          <View style={styles.nfc_area}>
            {state.loading ? (
              <>
                <ActivityIndicator size="large" color={CORES.ORANGE} />
                <Text style={styles.nfc_text}>Aguardando aproximação...</Text>
              </>
            ) : state.expense ? (
              <>
                <Text style={styles.success_title}>Despesa encontrada</Text>
                <Text style={styles.expense_description}>
                  {state.expense.description}
                </Text>
                <Text style={styles.expense_amount}>
                  R$ {state.expense.amount.toFixed(2).replace('.', ',')}
                </Text>
              </>
            ) : (
              <Text style={styles.nfc_text}>Nenhuma tag lida ainda</Text>
            )}
          </View>

          {state.error ? <Text style={styles.error_text}>{state.error}</Text> : null}

          <TouchableOpacity
            style={[styles.read_button, state.loading && { opacity: 0.7 }]}
            onPress={handleReadNfc}
            disabled={state.loading}
          >
            <Text style={styles.read_button_text}>
              {state.loading ? 'Lendo...' : 'Ler tag NFC'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel_button} onPress={handleClose}>
              <Text style={styles.cancel_text}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirm_button, !state.expense && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={!state.expense}
            >
              <Text style={styles.confirm_text}>Usar despesa</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#FFF',
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
  nfc_area: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    backgroundColor: CORES.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    marginBottom: 12,
  },
  nfc_text: {
    fontSize: 15,
    color: '#444',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  success_title: {
    fontSize: 14,
    color: CORES.ORANGE,
    fontWeight: '700',
    marginBottom: 8,
  },
  expense_description: {
    fontSize: 20,
    color: CORES.MIDNIGHT,
    fontWeight: '700',
    marginBottom: 6,
  },
  expense_amount: {
    fontSize: 24,
    color: CORES.ORANGE,
    fontWeight: '800',
  },
  error_text: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  read_button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.O_SHADOW,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  read_button_text: {
    color: CORES.WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancel_button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirm_button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancel_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '600',
    fontSize: 15,
  },
  confirm_text: {
    color: CORES.WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
});