import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useReducer, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native";
import CurrencyInput from "react-native-currency-input";
import { CotationService } from "../Service/CotationService";
import { useLiteMode } from "../Context/LiteModeContext";

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
}

type CoinCotationProps = {
  visible: boolean;
  onClose: () => void;
}

const ACTIONS = {
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error'
}

const initialState = {
  loading: false,
  data: null,
  error: null
}

function reducer(state: any, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true }
    case ACTIONS.SUCCESS:
      return { ...state, loading: false, data: action.payload, error: null }
    case ACTIONS.ERROR:
      return { ...state, loading: false, data: null, error: action.payload }
    default:
      return state
  }
}

export default function CoinCotationModal({ visible, onClose }: CoinCotationProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [amount, setAmount] = useState(0)
  const [fromCoin, setFromCoin] = useState("USD")
  const [convertCoint, setConvertCoin] = useState("BRL")
  const { animationEnabled } = useLiteMode()

  const availableCoins = [
    { code: "BRL", name: "Real Brasileiro" },
    { code: "USD", name: "Dólar Americano" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "Libra Esterlina" },
    { code: "ARS", name: "Peso Argentino" },
    { code: "CAD", name: "Dólar Canadense" },
    { code: "CHF", name: "Franco Suíço" },
    { code: "JPY", name: "Iene Japonês" },
    { code: "AUD", name: "Dólar Australiano" },
  ];

  const isAbleToConvert =
    amount > 0 &&
    fromCoin.trim().length > 0 &&
    convertCoint.trim().length > 0 &&
    fromCoin !== convertCoint;

  const handleConvert = async () => {
    dispatch({ type: ACTIONS.START })

    try {
      const cotationService = new CotationService()
      const value = await cotationService.convertCurrency(fromCoin, convertCoint, amount)

      console.log("VALOR CONVERTIDO:", value)

      dispatch({ type: ACTIONS.SUCCESS, payload: Number(value) })
    } catch (error: any) {
      console.log("ERRO:", error.message)
      dispatch({ type: ACTIONS.ERROR, payload: error.message })
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationEnabled ? "slide" : "none"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS == 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal_container}>
          <View style={styles.handle} />
          <Text style={styles.title}>Câmbio Digital</Text>
          <Text style={styles.label}>Valor</Text>
          <CurrencyInput
            value={amount}
            onChangeValue={(value) => setAmount(value ?? 0)}
            delimiter="."
            separator=","
            precision={2}
            style={styles.input}
            keyboardType="numeric"
          />
          <View style={styles.pickers_container}>
            <View style={styles.picker_container}>
              <Text style={styles.label}>Moeda de Origem</Text>
              <View style={styles.picker_wrapper}>
                <Picker selectedValue={fromCoin} onValueChange={setFromCoin}>
                  {availableCoins.map((coin) => (
                    <Picker.Item key={coin.code} label={`${coin.code} - ${coin.name}`} value={coin.code} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.picker_container}>
              <Text style={styles.label}>Converter para</Text>
              <View style={styles.picker_wrapper}>
                <Picker selectedValue={convertCoint} onValueChange={setConvertCoin}>
                  {availableCoins.map((coin) => (
                    <Picker.Item key={coin.code} label={`${coin.code} - ${coin.name}`} value={coin.code} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirm_button, (state.loading || !isAbleToConvert) && { opacity: 0.7 }]}
              disabled={state.loading || !isAbleToConvert}
              onPress={handleConvert}
            >
              <Text style={styles.confirm_text}>
                {state.loading ? "Convertendo..." : "Converter"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.result}>
            <Text style={styles.result_label}>Resultado</Text>
            <Text style={styles.result_value}>
              {state.loading
                ? "Carregando..."
                : typeof state.data === "number"
                  ? state.data.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: convertCoint || "BRL",
                  })
                  : "R$ 0,00"}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
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
    fontWeight: '700'
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#161616',
    marginBottom: 10,
  },
  pickers_container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  picker_container: {
    flex: 1,
  },
  picker_wrapper: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  confirm_button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirm_text: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  result: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F4F6F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  result_label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  result_value: {
    fontSize: 26,
    fontWeight: '700',
    color: '#161616',
  },
})