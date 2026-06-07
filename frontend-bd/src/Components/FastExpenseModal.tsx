import React, { useReducer } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TransactionService } from '../Service/TransactionService';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  O_SHADOW: '#C42500',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

const NAME_OPTIONS = [
  'Personalizar',
  'Café',
  'Almoço',
  'Janta',
  'Academia',
  'Uber',
  'Mercado',
  'Lanche',
  'Transporte',
];

const VALUE_OPTIONS = [
  'Personalizar',
  5,
  10,
  15,
  25,
  50,
  100,
  150,
  200,
];

type Props = {
  visible: boolean;
  onClose: () => void;
  accountNumber?: string;
  onCreated?: () => Promise<void> | void;
};

type State = {
  selectedName: string;
  customName: string;
  selectedValue: string | number;
  customValue: string;
  error: string;
  loading: boolean;
};

const ACTIONS = {
  SET_NAME: 'set_name',
  SET_CUSTOM_NAME: 'set_custom_name',
  SET_VALUE: 'set_value',
  SET_CUSTOM_VALUE: 'set_custom_value',
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error',
  RESET: 'reset',
};

const initialState: State = {
  selectedName: 'Personalizar',
  customName: '',
  selectedValue: 'Personalizar',
  customValue: '',
  error: '',
  loading: false,
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case ACTIONS.SET_NAME:
      return {
        ...state,
        selectedName: action.payload,
        customName: action.payload === 'Personalizar' ? state.customName : '',
        error: '',
      };

    case ACTIONS.SET_CUSTOM_NAME:
      return {
        ...state,
        customName: action.payload,
        error: '',
      };

    case ACTIONS.SET_VALUE:
      return {
        ...state,
        selectedValue: action.payload,
        customValue: action.payload === 'Personalizar' ? state.customValue : '',
        error: '',
      };

    case ACTIONS.SET_CUSTOM_VALUE:
      return {
        ...state,
        customValue: action.payload,
        error: '',
      };

    case ACTIONS.START:
      return {
        ...state,
        loading: true,
        error: '',
      };

    case ACTIONS.SUCCESS:
      return initialState;

    case ACTIONS.ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

export function QuickExpenseModal({
  visible,
  onClose,
  accountNumber,
  onCreated,
}: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleClose = () => {
    if (state.loading) return;

    dispatch({ type: ACTIONS.RESET });
    onClose();
  };

  const getAmount = () => {
    if (state.selectedValue !== 'Personalizar') {
      return Number(state.selectedValue);
    }

    return Number(state.customValue.replace(',', '.'));
  };

  const getDescription = () => {
    if (state.selectedName !== 'Personalizar') {
      return state.selectedName;
    }

    return state.customName.trim();
  };

  const handleCreate = async () => {
    try {
      const description = getDescription();
      const amount = getAmount();

      if (!accountNumber) {
        dispatch({
          type: ACTIONS.ERROR,
          payload: 'Conta não encontrada.',
        });
        return;
      }

      if (!description) {
        dispatch({
          type: ACTIONS.ERROR,
          payload: 'Informe o nome da despesa rápida.',
        });
        return;
      }

      if (!amount || amount <= 0) {
        dispatch({
          type: ACTIONS.ERROR,
          payload: 'Informe um valor válido.',
        });
        return;
      }

      dispatch({ type: ACTIONS.START });

      const transactionService = new TransactionService();

      await transactionService.createTransaction({
        account_number: accountNumber,
        description,
        amount,
        type: 'expense',
      });

      if (onCreated) {
        await onCreated();
      }

      dispatch({ type: ACTIONS.SUCCESS });
      onClose();
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error?.message || 'Não foi possível criar a despesa rápida.',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Despesa rápida</Text>

            <Text style={styles.description}>
              Escolha uma opção pronta ou personalize o nome e o valor da despesa.
            </Text>

            <Text style={styles.label}>Nome da despesa</Text>

            <View style={styles.options_container}>
              {NAME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option_button,
                    state.selectedName === option && styles.option_button_selected,
                ]}
                  disabled={state.loading}
                  onPress={() =>
                    dispatch({
                      type: ACTIONS.SET_NAME,
                      payload: option,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.option_text,
                      state.selectedName === option && styles.option_text_selected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {state.selectedName === 'Personalizar' && (
              <TextInput
                style={styles.input}
                placeholder="Digite o nome da despesa"
                placeholderTextColor="#999"
                value={state.customName}
                editable={!state.loading}
                onChangeText={(value) =>
                  dispatch({
                    type: ACTIONS.SET_CUSTOM_NAME,
                    payload: value,
                  })
                }
              />
            )}

            <Text style={styles.label}>Valor</Text>

            <View style={styles.options_container}>
              {VALUE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={String(option)}
                  style={[
                    styles.option_button,
                    state.selectedValue === option && styles.option_button_selected,
                  ]}
                  disabled={state.loading}
                  onPress={() =>
                    dispatch({
                      type: ACTIONS.SET_VALUE,
                      payload: option,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.option_text,
                      state.selectedValue === option && styles.option_text_selected,
                    ]}
                  >
                    {option === 'Personalizar' ? 'Personalizar' : `R$ ${option}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {state.selectedValue === 'Personalizar' && (
              <TextInput
                style={styles.input}
                placeholder="Digite o valor"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={state.customValue}
                editable={!state.loading}
                onChangeText={(value) =>
                  dispatch({
                    type: ACTIONS.SET_CUSTOM_VALUE,
                    payload: value,
                  })
                }
              />
            )}

            {state.error ? <Text style={styles.error_text}>{state.error}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancel_button, state.loading && { opacity: 0.7 }]}
                onPress={handleClose}
                disabled={state.loading}
              >
                <Text style={styles.cancel_text}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirm_button, state.loading && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={state.loading}
              >
                {state.loading ? (
                  <ActivityIndicator color={CORES.WHITE} />
                ) : (
                  <Text style={styles.confirm_text}>Criar despesa</Text>
                )}
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
  modal_container: {
    backgroundColor: CORES.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '85%', // Ajustado levemente para acomodar o teclado sem cortar elementos
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
  options_container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  option_button: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    backgroundColor: CORES.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  option_button_selected: {
    backgroundColor: CORES.O_SHADOW,
    borderColor: CORES.O_SHADOW,
  },
  option_text: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.MIDNIGHT,
  },
  option_text_selected: {
    color: CORES.WHITE,
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