import React, { useReducer } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import CurrencyInput from 'react-native-currency-input';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  O_SHADOW: '#C42500',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

type State = {
  description: string;
  amount: number | null;
  qrValue: string;
  error: string;
};

const ACTIONS = {
  SET_DESCRIPTION: 'set_description',
  SET_AMOUNT: 'set_amount',
  SET_QR_VALUE: 'set_qr_value',
  SET_ERROR: 'set_error',
  RESET: 'reset',
};

const initialState: State = {
  description: '',
  amount: null,
  qrValue: '',
  error: '',
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case ACTIONS.SET_DESCRIPTION:
      return { ...state, description: action.payload, error: '', qrValue: '' };

    case ACTIONS.SET_AMOUNT:
      return { ...state, amount: action.payload, error: '', qrValue: '' };

    case ACTIONS.SET_QR_VALUE:
      return { ...state, qrValue: action.payload, error: '' };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

export function QRCodeExpenseModal({ visible, onClose }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleClose = () => {
    dispatch({ type: ACTIONS.RESET });
    onClose();
  };

  const handleGenerateQRCode = () => {
    const description = state.description.trim();
    const amount = state.amount ?? 0;

    if (!description) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Informe a descrição da cobrança.',
      });
      return;
    }

    if (amount <= 0) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Informe um valor válido.',
      });
      return;
    }

    const payload = {
      type: 'expense_request',
      description,
      amount,
    };

    dispatch({
      type: ACTIONS.SET_QR_VALUE,
      payload: JSON.stringify(payload),
    });
  };

  const isAbleToGenerate = state.description.trim().length > 0 && Number(state.amount) > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.keyboard_container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.overlay}>
          <View style={styles.modal_container}>
            <View style={styles.handle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scroll_content}
            >
              <Text style={styles.title}>Gerar QR Code</Text>

              <Text style={styles.description}>
                Crie uma cobrança para outra pessoa escanear e registrar como despesa pendente.
              </Text>

              <Text style={styles.label}>Descrição</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex: Pizza, almoço, mercado..."
                placeholderTextColor="#999"
                value={state.description}
                onChangeText={(value) =>
                  dispatch({
                    type: ACTIONS.SET_DESCRIPTION,
                    payload: value,
                  })
                }
              />

              <Text style={styles.label}>Valor</Text>

              <CurrencyInput
                style={styles.input}
                value={state.amount}
                onChangeValue={(value) =>
                  dispatch({
                    type: ACTIONS.SET_AMOUNT,
                    payload: value,
                  })
                }
                prefix="R$ "
                delimiter="."
                separator=","
                precision={2}
                minValue={0}
                keyboardType="numeric"
                placeholder="R$ 0,00"
                placeholderTextColor="#999"
              />

              {state.error ? <Text style={styles.error_text}>{state.error}</Text> : null}

              {state.qrValue ? (
                <View style={styles.qr_container}>
                  <QRCode value={state.qrValue} size={180} />
                  <Text style={styles.qr_text}>Mostre este QR Code para a outra pessoa.</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancel_button} onPress={handleClose}>
                  <Text style={styles.cancel_text}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirm_button, !isAbleToGenerate && { opacity: 0.6 }]}
                  onPress={handleGenerateQRCode}
                  disabled={!isAbleToGenerate}
                >
                  <Text style={styles.confirm_text}>
                    {state.qrValue ? 'Gerar novamente' : 'Gerar QR Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard_container: {
    flex: 1,
  },
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
  scroll_content: {
    paddingBottom: 4,
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
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    backgroundColor: CORES.LIGHT_GRAY,
    paddingHorizontal: 14,
    fontSize: 15,
    color: CORES.MIDNIGHT,
    marginBottom: 12,
  },
  error_text: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  qr_container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.LIGHT_GRAY,
    borderRadius: 18,
    padding: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  qr_text: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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