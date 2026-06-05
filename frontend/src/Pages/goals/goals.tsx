import React, { useContext, useEffect, useReducer, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import CurrencyInput from "react-native-currency-input";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { GoalService } from "../../Service/GoalService";
import { AuthContext } from "../../Context/AuthContext";
import { AccountService } from "../../Service/AccountService";
import { useTheme } from "../../Context/ThemeContext";
import { useLiteMode } from '../../Context/LiteModeContext';


const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  GRAY: "#F4F4F4",
  TEXT_GRAY: "#666"
};

const ACTIONS = {
  START: "start",
  SUCCESS: "success",
  ERROR: "error"
};

type Goal = {
  id: number;
  name: string;
  target_amount: string | number;
  current_amount: string | number;
  monthly_deposit: string | number;
  auto_deposit: boolean;
  progress?: string | number;
};

const initialState = {
  loading: false,
  goals: [] as Goal[],
  error: null as string | null
};

function reducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true };
    case ACTIONS.SUCCESS:
      return { ...state, loading: false, goals: action.payload, error: null };
    case ACTIONS.ERROR:
      return { ...state, loading: false, goals: [], error: action.payload };
    default:
      return state;
  }
}

export default function Goals() {
  const navigation = useNavigation<any>();
  const { userToken } = useContext(AuthContext);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | null>(0);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number | null>(0);
  const [autoDeposit, setAutoDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | null>(0);
  const { theme } = useTheme()
  const { syncInterval } = useLiteMode();

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const resetCreateModal = () => {
    setName("");
    setTargetAmount(0);
    setMonthlyDeposit(0);
    setAutoDeposit(false);
  };

  const fetchGoals = async () => {
    if (!userToken) return;

    dispatch({ type: ACTIONS.START });

    try {
      const accountService = new AccountService();
      const accountResponse = await accountService.getUserAccount(userToken);
      const account = accountResponse?.account;

      if (!account?.account_number) {
        setAccountNumber(null);
        dispatch({ type: ACTIONS.SUCCESS, payload: [] });
        return;
      }

      setAccountNumber(account.account_number);

      const goalService = new GoalService();
      const goals = await goalService.getGoalsByAccount(account.account_number);

      dispatch({
        type: ACTIONS.SUCCESS,
        payload: Array.isArray(goals) ? goals : []
      });
    } catch (error: any) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error.message || "Erro ao buscar metas."
      });
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchGoals();
    }
  }, [userToken, syncInterval]);

  const handleCreateGoal = async () => {
    try {
      if (!accountNumber) {
        Alert.alert("Erro", "Conta não encontrada.");
        return;
      }

      if (!name.trim()) {
        Alert.alert("Erro", "Informe o nome da meta.");
        return;
      }

      if (!targetAmount || targetAmount <= 0) {
        Alert.alert("Erro", "Informe um valor alvo válido.");
        return;
      }

      if (!monthlyDeposit || monthlyDeposit <= 0) {
        Alert.alert("Erro", "Informe um depósito mensal válido.");
        return;
      }

      const goalService = new GoalService();

      await goalService.createGoal({
        accountNumber,
        name: name.trim(),
        target_amount: targetAmount,
        monthly_deposit: monthlyDeposit,
        auto_deposit: autoDeposit
      });

      resetCreateModal();
      setCreateModalVisible(false);

      Alert.alert("Sucesso", "Meta criada com sucesso.");
      await fetchGoals();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar meta.");
    }
  };

  const handleDepositToGoal = async () => {
    try {
      if (!selectedGoal) return;

      if (!depositAmount || depositAmount <= 0) {
        Alert.alert("Erro", "Informe um valor válido.");
        return;
      }

      const goalService = new GoalService();

      await goalService.depositToGoal(selectedGoal.id, depositAmount);

      setDepositAmount(0);
      setSelectedGoal(null);
      setDepositModalVisible(false);

      Alert.alert("Sucesso", "Depósito realizado com sucesso.");
      await fetchGoals();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao depositar na meta.");
    }
  };

  const openDepositModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setDepositAmount(0);
    setDepositModalVisible(true);
  };

  const closeCreateModal = () => {
    resetCreateModal();
    setCreateModalVisible(false);
  };

  const closeDepositModal = () => {
    setDepositAmount(0);
    setSelectedGoal(null);
    setDepositModalVisible(false);
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const currentAmount = Number(item.current_amount);
    const targetAmountNumber = Number(item.target_amount);
    const monthlyDepositNumber = Number(item.monthly_deposit);
    const progress = targetAmountNumber > 0 ? Math.min((currentAmount / targetAmountNumber) * 100, 100) : 0;
    const remaining = Math.max(targetAmountNumber - currentAmount, 0);
    const monthsLeft = monthlyDepositNumber > 0 ? Math.ceil(remaining / monthlyDepositNumber) : 0;

    return (
      <View style={styles.goal_card}>
        <View style={styles.goal_header}>
          <View style={styles.goal_info}>
            <Text style={[styles.goal_name, {color: theme.text}]}>{item.name}</Text>
            <Text style={styles.goal_status}>
              {item.auto_deposit ? "Depósito automático ativo" : "Depósito manual"}
            </Text>
          </View>

          <Text style={styles.goal_percentage}>{progress.toFixed(0)}%</Text>
        </View>

        <View style={styles.progress_bar}>
          <View style={[styles.progress_fill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.values_row}>
          <Text style={[styles.value_text, {color: theme.text}]}>{formatCurrency(currentAmount)}</Text>
          <Text style={[styles.value_text, {color: theme.text}]}>{formatCurrency(targetAmountNumber)}</Text>
        </View>

        <Text style={styles.remaining_text}>Faltam {formatCurrency(remaining)}</Text>

        <Text style={styles.months_text}>
          Previsão: {monthsLeft <= 0 ? "meta concluída" : `${monthsLeft} meses restantes`}
        </Text>

        <TouchableOpacity style={styles.deposit_button} onPress={() => openDepositModal(item)}>
          <Text style={styles.deposit_button_text}>Adicionar dinheiro</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.backgroundColor}]}>
      <TouchableOpacity onPress={() => navigation.navigate("MainTabs")} style={styles.back_btn}>
        <View style={styles.back_btn_content}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          <Text style={styles.btn_text}>Voltar</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Minhas metas</Text>

        <TouchableOpacity style={styles.create_button} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.create_button_text}>Nova meta</Text>
        </TouchableOpacity>
      </View>

      {state.loading ? (
        <ActivityIndicator size="large" color={CORES.ORANGE} />
      ) : (
        <FlatList
          data={state.goals}
          keyExtractor={(item: Goal) => String(item.id)}
          renderItem={renderGoal}
          contentContainerStyle={styles.list_content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty_text}>
              {state.error || "Nenhuma meta criada ainda."}
            </Text>
          }
        />
      )}

      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={closeCreateModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modal_overlay}>
          <Pressable style={styles.modal_backdrop} onPress={closeCreateModal} />

          <View style={styles.modal_wrapper}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modal_scroll_content}>
              <View style={styles.modal_container}>
                <Text style={styles.modal_title}>Criar meta</Text>

                <Text style={styles.label}>Nome da meta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Viagem"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.label}>Valor alvo</Text>
                <CurrencyInput
                  style={styles.input}
                  value={targetAmount ?? 0}
                  onChangeValue={setTargetAmount}
                  prefix="R$ "
                  delimiter="."
                  separator=","
                  precision={2}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Depósito mensal</Text>
                <CurrencyInput
                  style={styles.input}
                  value={monthlyDeposit ?? 0}
                  onChangeValue={setMonthlyDeposit}
                  prefix="R$ "
                  delimiter="."
                  separator=","
                  precision={2}
                  keyboardType="numeric"
                />

                <TouchableOpacity style={styles.auto_container} onPress={() => setAutoDeposit(!autoDeposit)}>
                  <View style={[styles.checkbox, autoDeposit && styles.checkbox_active]}>
                    {autoDeposit && <Text style={styles.checkbox_text}>✓</Text>}
                  </View>

                  <Text style={styles.auto_text}>Depositar automaticamente todo mês</Text>
                </TouchableOpacity>

                <View style={styles.modal_actions}>
                  <TouchableOpacity style={styles.cancel_button} onPress={closeCreateModal}>
                    <Text style={styles.cancel_button_text}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.confirm_button} onPress={handleCreateGoal}>
                    <Text style={styles.confirm_button_text}>Criar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={depositModalVisible} transparent animationType="slide" onRequestClose={closeDepositModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modal_overlay}>
          <Pressable style={styles.modal_backdrop} onPress={closeDepositModal} />

          <View style={styles.modal_wrapper}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modal_scroll_content}>
              <View style={styles.modal_container}>
                <Text style={styles.modal_title}>Depositar em {selectedGoal?.name}</Text>

                <Text style={styles.label}>Valor do depósito</Text>

                <CurrencyInput
                  style={styles.input}
                  value={depositAmount ?? 0}
                  onChangeValue={setDepositAmount}
                  prefix="R$ "
                  delimiter="."
                  separator=","
                  precision={2}
                  keyboardType="numeric"
                />

                <View style={styles.modal_actions}>
                  <TouchableOpacity style={styles.cancel_button} onPress={closeDepositModal}>
                    <Text style={styles.cancel_button_text}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.confirm_button} onPress={handleDepositToGoal}>
                    <Text style={styles.confirm_button_text}>Depositar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 56
  },
  back_btn: {
    alignSelf: "flex-start",
    backgroundColor: CORES.ORANGE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18
  },
  back_btn_content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  btn_text: {
    color: CORES.WHITE,
    fontWeight: "700",
    fontSize: 14
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: CORES.MIDNIGHT
  },
  create_button: {
    backgroundColor: CORES.ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14
  },
  create_button_text: {
    color: CORES.WHITE,
    fontWeight: "700"
  },
  list_content: {
    paddingBottom: 32
  },
  goal_card: {
    backgroundColor: CORES.GRAY,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16
  },
  goal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  goal_info: {
    flex: 1,
    paddingRight: 12
  },
  goal_name: {
    fontSize: 18,
    fontWeight: "700",
  },
  goal_status: {
    fontSize: 13,
    color: CORES.TEXT_GRAY,
    marginTop: 4
  },
  goal_percentage: {
    fontSize: 20,
    fontWeight: "800",
    color: CORES.ORANGE
  },
  progress_bar: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#DDD",
    overflow: "hidden",
    marginBottom: 10
  },
  progress_fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: CORES.ORANGE
  },
  values_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  value_text: {
    fontSize: 14,
    fontWeight: "600",
    color: CORES.MIDNIGHT
  },
  remaining_text: {
    fontSize: 14,
    color: CORES.TEXT_GRAY,
    marginBottom: 4
  },
  months_text: {
    fontSize: 14,
    color: CORES.TEXT_GRAY,
    marginBottom: 16
  },
  deposit_button: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.ORANGE
  },
  deposit_button_text: {
    color: CORES.WHITE,
    fontWeight: "700"
  },
  empty_text: {
    textAlign: "center",
    color: CORES.TEXT_GRAY,
    marginTop: 40
  },
  modal_overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)"
  },
  modal_backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modal_wrapper: {
    maxHeight: "88%",
    width: "100%"
  },
  modal_scroll_content: {
    flexGrow: 1,
    justifyContent: "flex-end"
  },
  modal_container: {
    backgroundColor: CORES.WHITE,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: Platform.OS === "ios" ? 36 : 24
  },
  modal_title: {
    fontSize: 22,
    fontWeight: "700",
    color: CORES.MIDNIGHT,
    marginBottom: 22
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: CORES.TEXT_GRAY,
    marginBottom: 8
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: CORES.GRAY,
    paddingHorizontal: 16,
    fontSize: 16,
    color: CORES.MIDNIGHT,
    marginBottom: 18
  },
  auto_container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center"
  },
  checkbox_active: {
    backgroundColor: CORES.ORANGE,
    borderColor: CORES.ORANGE
  },
  checkbox_text: {
    color: CORES.WHITE,
    fontWeight: "800"
  },
  auto_text: {
    flex: 1,
    fontSize: 14,
    color: CORES.TEXT_GRAY
  },
  modal_actions: {
    flexDirection: "row",
    gap: 12
  },
  cancel_button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.GRAY
  },
  cancel_button_text: {
    fontWeight: "700",
    color: CORES.TEXT_GRAY
  },
  confirm_button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.ORANGE
  },
  confirm_button_text: {
    fontWeight: "700",
    color: CORES.WHITE
  }
});