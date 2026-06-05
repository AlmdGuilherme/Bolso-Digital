import React, { useReducer, useEffect, useContext, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../../Context/AuthContext';
import { AccountService } from '../../Service/AccountService';
import { TransactionService } from '../../Service/TransactionService';
import { GamingBadgeService } from '../../Service/GamingBadgeService';
import { BalanceCard } from '../../Components/BalanceCard';
import { EnvelopeCard } from '../../Components/EnvelopeCard';
import { EnvelopeTransferModal } from '../../Components/EnvelopeModalTransfer';
import { EnvelopeService } from '../../Service/EnvelopeService';
import { CreateEnvelopeModal } from '../../Components/CreateEnvelopeModal';
import { NfcExpenseModal } from '../../Components/NFCExpenseModal';
import { QuickExpenseModal } from '../../Components/FastExpenseModal';
import { QRCodeExpenseModal } from '../../Components/QRCodeModal';
import { QRCodeScannerModal } from '../../Components/QRCodeScannerModal';
import { PendingTransactionsModal } from '../../Components/PendingTransactionModal';
import { TransactionHistoryModal } from '../../Components/TransactionHistoryModal';
import { GamingBadgesModal } from '../../Components/GamingBadgesModal';
import { FixedExpensesModal } from '../../Components/FixedExpenseModal';
import { ExportCSVModal } from '../../Components/ExportCSVModal';
import ShortCard from '../../Components/ShortCard';
import { FinancingCalculatorModal } from '../../Components/FinancingCalculatorModal';
import { CreateExpenseModal } from '../../Components/CreateExpenseModal';
import CoinCotationModal from '../../Components/CoinCotationModal';
import { useLiteMode } from '../../Context/LiteModeContext';
import { useTheme } from '../../Context/ThemeContext';
import { BarChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
};

const ACTIONS = {
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error',
};

const initialState = {
  loading: false,
  data: null,
  chartData: null,
  envelopes: [],
  dailyExpenses: [],
  error: null,
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true };
    case ACTIONS.SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload.data,
        chartData: action.payload.chartData,
        envelopes: action.payload.envelopes,
        dailyExpenses: action.payload.dailyExpenses,
        error: null,
      };
    case ACTIONS.ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

const DASHBOARD_CARDS = [
  { id: '1', type: 'BALANCE', title: 'Saldo Atual' },
  { id: '2', type: 'INCOME', title: 'Receitas' },
  { id: '3', type: 'EXPENSE', title: 'Despesas' },
];

export default function Home({ navigation }: any) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { userToken } = useContext(AuthContext);

  const [activeCardId, setActiveCardId] = useState<string>('1');
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState<any>(null);
  const [isCreateEnvelopeModalVisible, setIsCreateEnvelopeModalVisible] = useState(false);
  const [isCreatingEnvelope, setIsCreatingEnvelope] = useState(false);
  const [isFinancingModalVisible, setIsFinancingModalVisible] = useState(false);
  const [isCreateExpenseModalVisible, setIsCreateExpenseModalVisible] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [isCoinCotationModalVisible, setIsCoinCotationModalVisible] = useState(false);
  const [isNFCModalVisible, setIsNFCModalVisible] = useState(false);
  const [isQuickExpenseModalVisible, setIsQuickExpenseModalVisible] = useState(false);
  const [isQRCodeModalVisible, setIsQRCodeModalVisible] = useState(false);
  const [isQRCodeScannerModalVisible, setIsQRCodeScannerModalVisible] = useState(false);
  const [isPendingTransactionsModalVisible, setIsPendingTransactionsModalVisible] = useState(false);
  const [isTransactionHistoryModalVisible, setIsTransactionHistoryModalVisible] = useState(false);
  const [isGamingBadgesModalVisible, setIsGamingBadgesModalVisible] = useState(false);
  const [isFixedExpensesModalVisible, setIsFixedExpensesModalVisible] = useState(false);
  const [isExportCSVModalVisible, setIsExportCSVModalVisible] = useState(false);

  const { syncInterval } = useLiteMode();
  const { theme } = useTheme();

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 51,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveCardId(String(viewableItems[0].item.id));
    }
  }).current;

  const unlockBadgeSafely = async (achievementCode: string) => {
    try {
      if (!state.data?.account_number) return;

      const gamingBadgeService = new GamingBadgeService();

      await gamingBadgeService.unlockAchievement(
        state.data.account_number,
        achievementCode
      );
    } catch (error) {
      console.log('Badge não desbloqueada ou já existente:', achievementCode);
    }
  };

  const fetchUserData = async () => {
    if (!userToken) return;

    dispatch({ type: ACTIONS.START });

    try {
      const accountService = new AccountService();
      const transactionService = new TransactionService();
      const envelopeService = new EnvelopeService();

      const accountResponse = await accountService.getUserAccount(userToken);
      const account = accountResponse.account;

      if (account?.account_number) {
        const dashboardData = await transactionService.GetChartData(account.account_number);
        const envelopesData = await envelopeService.getEnvelopes(account.account_number);
        const dailyExpenses = await transactionService.getDailyExpenses(account.account_number);

        dispatch({
          type: ACTIONS.SUCCESS,
          payload: {
            data: account,
            chartData: dashboardData,
            envelopes: envelopesData || [],
            dailyExpenses: dailyExpenses || [],
          },
        });
      }
    } catch (error: any) {
      dispatch({ type: ACTIONS.ERROR, payload: error.message });
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchUserData();
    }
  }, [userToken, syncInterval]);

  const openEnvelopeModal = (envelope: any) => {
    setSelectedEnvelope(envelope);
    setIsTransferModalVisible(true);
  };

  const closeEnvelopeModal = () => {
    setSelectedEnvelope(null);
    setIsTransferModalVisible(false);
  };

  const handleCreateEnvelope = async (data: {
    name: string;
    allocated_amount: number;
    budget_period: 'monthly' | 'yearly';
    auto_reset: boolean;
  }) => {
    try {
      if (!state.data?.account_number) return;

      setIsCreatingEnvelope(true);

      const envelopeService = new EnvelopeService();

      await envelopeService.createEnvelope({
        accountNumber: state.data.account_number,
        name: data.name,
        allocated_amount: data.allocated_amount,
        budget_period: data.budget_period,
        auto_reset: data.auto_reset,
      });

      await unlockBadgeSafely('FIRST_ENVELOPE');

      Alert.alert('Sucesso', 'Envelope criado com sucesso.');
      setIsCreateEnvelopeModalVisible(false);
      await fetchUserData();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível criar o envelope.');
    } finally {
      setIsCreatingEnvelope(false);
    }
  };

  const handleTransfer = async ({
    source_envelope_id,
    target_envelope_id,
    amount,
  }: {
    source_envelope_id: number | string;
    target_envelope_id: number | string;
    amount: number;
  }) => {
    try {
      if (!state.data?.account_number) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      const envelopeService = new EnvelopeService();

      await envelopeService.transferBetweenEnvelopes({
        accountNumber: state.data.account_number,
        source_envelope_id: Number(source_envelope_id),
        target_envelope_id: Number(target_envelope_id),
        amount,
      });

      Alert.alert('Sucesso', 'Transferência realizada com sucesso.');
      closeEnvelopeModal();
      await fetchUserData();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível realizar a transferência.');
    }
  };

  const handleCreateExpense = async (data: {
    description: string;
    amount: number;
    category?: string;
    subcategory?: string;
    category_id?: number | null;
    subcategory_id?: number | null;
    envelope_id?: number | null;
    status?: 'pending' | 'completed' | 'cancelled';
    receiptUri?: string | null;
  }) => {
    try {
      if (!state.data?.account_number) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      setIsCreatingExpense(true);

      const transactionService = new TransactionService();

      const transaction = await transactionService.createTransaction({
        account_number: state.data.account_number,
        description: data.description,
        amount: data.amount,
        type: 'expense',
        category: data.category,
        subcategory: data.subcategory,
        category_id: data.category_id ?? null,
        subcategory_id: data.subcategory_id ?? null,
        envelope_id: data.envelope_id ?? null,
        status: data.status ?? 'completed',
      });

      await unlockBadgeSafely('FIRST_EXPENSE');

      if (data.receiptUri && transaction?.id) {
        await transactionService.addReceipt(
          transaction.id,
          state.data.account_number,
          data.receiptUri
        );

        await unlockBadgeSafely('FIRST_RECEIPT');
      }

      setIsCreateExpenseModalVisible(false);
      await fetchUserData();

      if (data.status !== 'pending') {
        Alert.alert('Sucesso', 'Despesa criada com sucesso.');
      }
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível criar a despesa.');
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const daysMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const chartValues = [0, 0, 0, 0, 0, 0, 0];

  state.dailyExpenses.forEach((item: any) => {
    const day = item.day.trim();
    const index = daysMap[day];

    if (index !== undefined) {
      chartValues[index] = Math.abs(Number(item.total));
    }
  });

  const dailyExpensesData = {
    labels,
    datasets: [
      {
        data: chartValues,
      },
    ],
  };

  const shortCards = [
    {
      id: 'simulation',
      type: 'simulation',
      onPress: () => setIsFinancingModalVisible(true),
    },
    {
      id: 'balance_change',
      type: 'balance_change',
      onPress: () => setIsCreateExpenseModalVisible(true),
    },
    {
      id: 'gaming_badges',
      type: 'gaming_badges',
      onPress: () => setIsGamingBadgesModalVisible(true),
    },
    {
      id: 'fixed_expenses',
      type: 'fixed_expenses',
      onPress: () => setIsFixedExpensesModalVisible(true),
    },
    {
      id: 'transaction_history',
      type: 'transaction_history',
      onPress: () => setIsTransactionHistoryModalVisible(true),
    },
    {
      id: 'export_csv',
      type: 'export_csv',
      onPress: () => setIsExportCSVModalVisible(true),
    },
    {
      id: 'quick_expense',
      type: 'quick_expense',
      onPress: () => setIsQuickExpenseModalVisible(true),
    },
    {
      id: 'qr_code',
      type: 'qr_code',
      onPress: () => setIsQRCodeModalVisible(true),
    },
    {
      id: 'qr_scanner',
      type: 'qr_scanner',
      onPress: () => setIsQRCodeScannerModalVisible(true),
    },
    {
      id: 'pending_transactions',
      type: 'pending_transactions',
      onPress: () => setIsPendingTransactionsModalVisible(true),
    },
    {
      id: 'coin_cotation',
      type: 'coin_cotation',
      onPress: () => setIsCoinCotationModalVisible(true),
    },
    {
      id: 'goals',
      type: 'goals',
      onPress: () => navigation.navigate('Goals'),
    },
    {
      id: 'nfc',
      type: 'nfc',
      onPress: () => setIsNFCModalVisible(true),
    },
  ];

  const investmentCards = [
    {
      id: 'investment',
      type: 'investment',
      onPress: () => navigation.navigate('Investment'),
    },
    {
      id: 'cripto',
      type: 'cripto',
      onPress: () => navigation.navigate('CryptoInvestment'),
    },
  ];

  const renderDashboardCard = ({ item }: any) => (
    <View style={{ width: screenWidth, alignItems: 'center' }}>
      <BalanceCard
        type={item.type}
        title={item.title}
        data={state.data}
        chart={state.chartData}
        totals={state.chartData?.totals}
        loading={state.loading}
        cardId={item.id}
        activeCardId={activeCardId}
      />
    </View>
  );

  const renderShortCard = ({ item }: any) => (
    <ShortCard type={item.type} onPress={item.onPress} />
  );

  return (
    <View style={[styles.main_container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll_content}
      >
        <View style={styles.header_section}>
          <FlatList
            data={DASHBOARD_CARDS}
            renderItem={renderDashboardCard}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </View>

        <View style={[styles.data_container, { backgroundColor: theme.backgroundColor }]}>
          <View style={styles.section}>
            <Text style={[styles.section_title, { color: theme.text }]}>Gastos semanais</Text>
          </View>

          <View style={[styles.chart_container, { backgroundColor: theme.backgroundColor }]}>
            <BarChart
              data={dailyExpensesData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="R$ "
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor: theme.backgroundColor,
                backgroundGradientFrom: theme.backgroundColor,
                backgroundGradientTo: theme.backgroundColor,
                decimalPlaces: 2,
                color: () => CORES.ORANGE,
                labelColor: () => theme.text,
                formatYLabel: (value) =>
                  Number(value).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.section_title, { color: theme.text }]}>Seus Envelopes</Text>

            <TouchableOpacity
              style={styles.create_envelope}
              onPress={() => setIsCreateEnvelopeModalVisible(true)}
            >
              <Text style={styles.create_envelope_text}>Criar envelope</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={state.envelopes}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.envelopes_scroll_container}
            style={styles.flatlist_grow}
            renderItem={({ item }) => (
              <EnvelopeCard
                name={item.name}
                allocated={Number(item.allocated_amount)}
                current={Number(item.current_amount)}
                onPress={() => openEnvelopeModal(item)}
              />
            )}
          />

          <View style={styles.section}>
            <Text style={[styles.section_title, { color: theme.text }]}>Diversos</Text>
          </View>

          <FlatList
            data={shortCards}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.short_cards_container}
            style={styles.short_cards_list}
            renderItem={renderShortCard}
          />

          <View style={styles.section}>
            <Text style={[styles.section_title, { color: theme.text }]}>Investimento</Text>
          </View>

          <FlatList
            data={investmentCards}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.short_cards_container}
            style={styles.short_cards_list}
            renderItem={renderShortCard}
          />
        </View>
      </ScrollView>

      <EnvelopeTransferModal
        visible={isTransferModalVisible}
        selectedEnvelope={selectedEnvelope}
        envelopes={state.envelopes}
        onClose={closeEnvelopeModal}
        onTransfer={handleTransfer}
      />

      <CreateEnvelopeModal
        visible={isCreateEnvelopeModalVisible}
        onClose={() => setIsCreateEnvelopeModalVisible(false)}
        onCreate={handleCreateEnvelope}
        loading={isCreatingEnvelope}
      />

      <FinancingCalculatorModal
        visible={isFinancingModalVisible}
        onClose={() => setIsFinancingModalVisible(false)}
      />

      <CreateExpenseModal
        visible={isCreateExpenseModalVisible}
        onClose={() => setIsCreateExpenseModalVisible(false)}
        onCreate={handleCreateExpense}
        envelopes={state.envelopes}
        loading={isCreatingExpense}
      />

      <GamingBadgesModal
        visible={isGamingBadgesModalVisible}
        onClose={() => setIsGamingBadgesModalVisible(false)}
        accountNumber={state.data?.account_number}
      />

      <FixedExpensesModal
        visible={isFixedExpensesModalVisible}
        onClose={() => setIsFixedExpensesModalVisible(false)}
        accountNumber={state.data?.account_number}
      />

      <TransactionHistoryModal
        visible={isTransactionHistoryModalVisible}
        onClose={() => setIsTransactionHistoryModalVisible(false)}
        accountNumber={state.data?.account_number}
      />

      <ExportCSVModal
        visible={isExportCSVModalVisible}
        onClose={() => setIsExportCSVModalVisible(false)}
        accountNumber={state.data?.account_number}
      />

      <CoinCotationModal
        visible={isCoinCotationModalVisible}
        onClose={() => setIsCoinCotationModalVisible(false)}
      />

      <NfcExpenseModal
        visible={isNFCModalVisible}
        onClose={() => setIsNFCModalVisible(false)}
        onExpenseRead={async (expense) => {
          setIsNFCModalVisible(false);

          await handleCreateExpense({
            description: expense.description,
            amount: expense.amount,
            category: undefined,
            subcategory: undefined,
            category_id: null,
            subcategory_id: null,
            envelope_id: null,
            status: 'completed',
          });
        }}
      />

      <QuickExpenseModal
        visible={isQuickExpenseModalVisible}
        onClose={() => setIsQuickExpenseModalVisible(false)}
        accountNumber={state.data?.account_number}
        onCreated={fetchUserData}
      />

      <QRCodeExpenseModal
        visible={isQRCodeModalVisible}
        onClose={() => setIsQRCodeModalVisible(false)}
      />

      <QRCodeScannerModal
        visible={isQRCodeScannerModalVisible}
        onClose={() => setIsQRCodeScannerModalVisible(false)}
        onQRCodeRead={async (expense) => {
          setIsQRCodeScannerModalVisible(false);

          await handleCreateExpense({
            description: expense.description,
            amount: expense.amount,
            category: undefined,
            subcategory: undefined,
            category_id: null,
            subcategory_id: null,
            envelope_id: null,
            status: 'pending',
          });

          setIsPendingTransactionsModalVisible(true);
        }}
      />

      <PendingTransactionsModal
        visible={isPendingTransactionsModalVisible}
        onClose={() => setIsPendingTransactionsModalVisible(false)}
        accountNumber={state.data?.account_number}
        onUpdated={fetchUserData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
  },
  scroll_content: {
    flexGrow: 1,
  },
  header_section: {
    paddingTop: 80,
    paddingBottom: 30,
    backgroundColor: '#161616',
  },
  data_container: {
    flexGrow: 1,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 20,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
  },
  create_envelope: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  create_envelope_text: {
    textAlign: 'center',
    textAlignVertical: 'center',
    color: CORES.WHITE,
    fontWeight: '800',
  },
  section_title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  chart_container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  chart: {
    borderRadius: 16,
  },
  envelopes_scroll_container: {
    gap: 16,
  },
  flatlist_grow: {
    flexGrow: 0,
  },
  short_cards_list: {
    flexGrow: 0,
    marginBottom: 20,
  },
  short_cards_container: {
    gap: 12,
    paddingRight: 10,
  },
});