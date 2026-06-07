import React, { useEffect, useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import { useLiteMode } from '../Context/LiteModeContext';
import { AuthContext } from '../Context/AuthContext';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: {
    description: string;
    amount: number;
    type: 'income';
    status: 'completed';
    account_number: string;
  }) => void;
  loading?: boolean;
};

export function CreateIncomeModal({
  visible,
  onClose,
  onCreate,
  loading = false,
}: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | null>(0);

  const { animationEnabled } = useLiteMode();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (visible) {
      setDescription('');
      setAmount(0);
    }
  }, [visible]);

  const isAvailableToSend = description.trim().length > 0 && (amount ?? 0) > 0;

  const handleCreate = () => {
    const parsedAmount = amount ?? 0;

    if (!user) {
      Alert.alert('Erro', 'Sessão do usuário não encontrada.');
      return;
    }

    const targetAccountIdentifier = user.account_number ?? user.id;

    if (!targetAccountIdentifier) {
      Alert.alert('Erro', 'Identificador da conta não localizado.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Informe a descrição do depósito.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Erro', 'Informe um valor válido maior que zero.');
      return;
    }

    onCreate({
      description: description.trim(),
      amount: parsedAmount,
      type: 'income',
      status: 'completed',
      account_number: targetAccountIdentifier,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationEnabled ? 'slide' : 'none'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Realizar Depósito</Text>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Pix recebido, Depósito mensal"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Valor do Depósito</Text>
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
              <TouchableOpacity style={styles.cancel_button} onPress={onClose}>
                <Text style={styles.cancel_text}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirm_button,
                  (loading || !isAvailableToSend) && { opacity: 0.7 },
                ]}
                onPress={handleCreate}
                disabled={loading || !isAvailableToSend}
              >
                <Text style={styles.confirm_text}>
                  {loading ? 'Processando...' : 'Confirmar'}
                </Text>
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
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '80%',
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
    color: '#161616',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#161616',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
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
    color: '#161616',
    fontWeight: '600',
    fontSize: 15,
  },
  confirm_text: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});