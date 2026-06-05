import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import { useLiteMode } from '../Context/LiteModeContext';

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
}

type CreateEnvelopProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    allocated_amount: number;
    budget_period: 'monthly' | 'yearly';
    auto_reset: boolean;
  }) => void;
  loading?: boolean;
};

export function CreateEnvelopeModal({ visible, onClose, onCreate, loading = false }: CreateEnvelopProps) {
  const [name, setName] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState<number | null>(0);
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [autoReset, setAutoReset] = useState(false);
  const { animationEnabled } = useLiteMode();

  const isAvaibleToCreate = (allocatedAmount ?? 0) > 0 && name.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setName('');
      setAllocatedAmount(0);
      setBudgetPeriod('monthly');
      setAutoReset(false);
    }
  }, [visible]);

  const handleCreate = () => {
    const parsedAmount = allocatedAmount ?? 0;

    if (!name.trim()) {
      alert('Informe o nome do envelope.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      alert('Informe um valor alocado válido.');
      return;
    }

    onCreate({
      name: name.trim(),
      allocated_amount: parsedAmount,
      budget_period: budgetPeriod,
      auto_reset: autoReset
    });
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Criar envelope</Text>

          <Text style={styles.label}>Nome do envelope</Text>

          <TextInput
            style={styles.input}
            placeholder="Ex: Mercado"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Valor alocado</Text>

          <CurrencyInput
            style={styles.input}
            value={allocatedAmount ?? 0}
            onChangeValue={setAllocatedAmount}
            prefix="R$ "
            delimiter="."
            separator=","
            precision={2}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Período</Text>

          <View style={styles.period_container}>
            <TouchableOpacity
              style={[
                styles.period_button,
                budgetPeriod === 'monthly' && styles.period_button_active
              ]}
              onPress={() => setBudgetPeriod('monthly')}
            >
              <Text
                style={[
                  styles.period_text,
                  budgetPeriod === 'monthly' && styles.period_text_active
                ]}
              >
                Mensal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.period_button,
                budgetPeriod === 'yearly' && styles.period_button_active
              ]}
              onPress={() => setBudgetPeriod('yearly')}
            >
              <Text
                style={[
                  styles.period_text,
                  budgetPeriod === 'yearly' && styles.period_text_active
                ]}
              >
                Anual
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.auto_reset_container}
            onPress={() => setAutoReset(!autoReset)}
          >
            <View style={[styles.checkbox, autoReset && styles.checkbox_active]}>
              {autoReset && <Text style={styles.checkbox_icon}>✓</Text>}
            </View>

            <Text style={styles.auto_reset_text}>
              Reiniciar automaticamente ao fim do período
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel_button} onPress={onClose}>
              <Text style={styles.cancel_text}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirm_button, (loading || !isAvaibleToCreate) && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={loading || !isAvaibleToCreate}
            >
              <Text style={styles.confirm_text}>
                {loading ? 'Criando...' : 'Criar'}
              </Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modal_container: {
    backgroundColor: CORES.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  handle: {
    width: 50,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },

  input: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    fontSize: 16,
    color: CORES.MIDNIGHT,
    marginBottom: 18,
  },

  period_container: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  period_button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },

  period_button_active: {
    backgroundColor: CORES.ORANGE,
    borderColor: CORES.ORANGE,
  },

  period_text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  period_text_active: {
    color: '#FFF',
  },

  auto_reset_container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkbox_active: {
    backgroundColor: CORES.ORANGE,
    borderColor: CORES.ORANGE,
  },

  checkbox_icon: {
    color: '#FFF',
    fontWeight: '700',
  },

  auto_reset_text: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
  },

  cancel_button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEFEF',
  },

  cancel_text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },

  confirm_button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.ORANGE,
  },

  confirm_text: {
    fontSize: 15,
    fontWeight: '700',
    color: CORES.WHITE,
  },
});