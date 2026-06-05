import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TransactionService } from '../Service/TransactionService';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F4F4F4',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  accountNumber?: string;
};

export function ExportCSVModal({
  visible,
  onClose,
  accountNumber,
}: Props) {
  const [loading, setLoading] = useState(false);

  const exportCSV = async () => {
    try {
      if (!accountNumber) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      setLoading(true);

      const transactionService = new TransactionService();

      const csv = await transactionService.exportTransactionsCSV(
        accountNumber
      );

      const file = new File(
        Paths.document,
        'transacoes-bolso-digital.csv'
      );

      file.write(csv);

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert(
          'Erro',
          'Compartilhamento não disponível neste dispositivo.'
        );
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Transações',
        UTI: 'public.comma-separated-values-text',
      });

      onClose();
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível exportar as transações.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      <View style={styles.overlay}>
        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <View style={styles.icon_container}>
            <MaterialCommunityIcons
              name="file-export-outline"
              size={54}
              color={CORES.ORANGE}
            />
          </View>

          <Text style={styles.title}>
            Exportar para Google Sheets
          </Text>

          <Text style={styles.description}>
            Gere um arquivo CSV contendo todas as suas transações.
            O arquivo poderá ser aberto diretamente no Google Sheets,
            Excel ou qualquer aplicativo de planilhas.
          </Text>

          <View style={styles.info_card}>
            <Text style={styles.info_text}>
              ✓ Histórico completo de transações
            </Text>

            <Text style={styles.info_text}>
              ✓ Categorias e subcategorias
            </Text>

            <Text style={styles.info_text}>
              ✓ Valores e status
            </Text>

            <Text style={styles.info_text}>
              ✓ Compatível com Google Sheets
            </Text>
          </View>

          <TouchableOpacity
            style={styles.export_button}
            onPress={exportCSV}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={CORES.WHITE} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="download"
                  size={20}
                  color={CORES.WHITE}
                />

                <Text style={styles.export_button_text}>
                  Exportar CSV
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancel_button}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancel_button_text}>
              Voltar
            </Text>
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
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 20,
  },

  icon_container: {
    alignSelf: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: CORES.MIDNIGHT,
    marginBottom: 10,
  },

  description: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },

  info_card: {
    backgroundColor: CORES.LIGHT_GRAY,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },

  info_text: {
    fontSize: 14,
    color: CORES.MIDNIGHT,
    marginBottom: 8,
  },

  export_button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  export_button_text: {
    color: CORES.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  cancel_button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  cancel_button_text: {
    color: CORES.MIDNIGHT,
    fontSize: 15,
    fontWeight: '700',
  },
});