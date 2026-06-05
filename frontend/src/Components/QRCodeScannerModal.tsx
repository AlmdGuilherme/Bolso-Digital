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
import { CameraView, useCameraPermissions } from 'expo-camera';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  O_SHADOW: '#C42500',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

type QRExpense = {
  description: string;
  amount: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onQRCodeRead: (expense: QRExpense) => void;
};

type State = {
  scanned: boolean;
  expense: QRExpense | null;
  error: string;
};

const ACTIONS = {
  SCANNED: 'scanned',
  ERROR: 'error',
  RESET: 'reset',
};

const initialState: State = {
  scanned: false,
  expense: null,
  error: '',
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case ACTIONS.SCANNED:
      return {
        scanned: true,
        expense: action.payload,
        error: '',
      };

    case ACTIONS.ERROR:
      return {
        scanned: true,
        expense: null,
        error: action.payload,
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

export function QRCodeScannerModal({ visible, onClose, onQRCodeRead }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [permission, requestPermission] = useCameraPermissions();

  const handleClose = () => {
    dispatch({ type: ACTIONS.RESET });
    onClose();
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (state.scanned) return;

    try {
      const parsed = JSON.parse(data);

      if (parsed.type !== 'expense_request') {
        throw new Error('QR Code inválido para despesa.');
      }

      if (!parsed.description || !parsed.amount || Number(parsed.amount) <= 0) {
        throw new Error('QR Code não possui dados válidos.');
      }

      dispatch({
        type: ACTIONS.SCANNED,
        payload: {
          description: String(parsed.description),
          amount: Number(parsed.amount),
        },
      });
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error?.message || 'Não foi possível ler o QR Code.',
      });
    }
  };

  const handleConfirm = () => {
    if (!state.expense) return;

    onQRCodeRead(state.expense);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Escanear QR Code</Text>

          <Text style={styles.description}>
            Aponte a câmera para um QR Code de cobrança para registrar uma despesa pendente.
          </Text>

          {!permission ? (
            <View style={styles.feedback_area}>
              <ActivityIndicator size="large" color={CORES.ORANGE} />
              <Text style={styles.feedback_text}>Verificando permissão da câmera...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.feedback_area}>
              <Text style={styles.feedback_text}>
                O app precisa acessar a câmera para escanear QR Codes.
              </Text>

              <TouchableOpacity style={styles.read_button} onPress={handleRequestPermission}>
                <Text style={styles.read_button_text}>Permitir câmera</Text>
              </TouchableOpacity>
            </View>
          ) : state.expense ? (
            <View style={styles.result_area}>
              <Text style={styles.success_title}>Cobrança encontrada</Text>

              <Text style={styles.expense_description}>{state.expense.description}</Text>

              <Text style={styles.expense_amount}>
                R$ {state.expense.amount.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ) : (
            <View style={styles.camera_container}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={state.scanned ? undefined : handleBarCodeScanned}
              />

              <View style={styles.scanner_frame} />
            </View>
          )}

          {state.error ? <Text style={styles.error_text}>{state.error}</Text> : null}

          {state.error ? (
            <TouchableOpacity
              style={styles.read_button}
              onPress={() => dispatch({ type: ACTIONS.RESET })}
            >
              <Text style={styles.read_button_text}>Tentar novamente</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel_button} onPress={handleClose}>
              <Text style={styles.cancel_text}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirm_button, !state.expense && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={!state.expense}
            >
              <Text style={styles.confirm_text}>Usar cobrança</Text>
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
    backgroundColor: CORES.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '92%',
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
  camera_container: {
    height: 310,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: CORES.MIDNIGHT,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  scanner_frame: {
    width: 210,
    height: 210,
    borderWidth: 3,
    borderColor: CORES.ORANGE,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  feedback_area: {
    minHeight: 220,
    borderRadius: 18,
    backgroundColor: CORES.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    marginBottom: 12,
  },
  feedback_text: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  result_area: {
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
    paddingHorizontal: 18,
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