import { supabase } from "../database/database.js";
import type { CreateTransactionDTO } from "../Interface/CreateTransactionDTO.js";
import * as DBQuery from '../database/queries.js'

export class TransactionService {

  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  private async detectFraud(
    transactionId: string,
    accountNumber: string,
    latitude: number,
    longitude: number
  ) {
    const { data: recentTransactions } = await DBQuery.GET_RECENT_TRANSACTIONS_WITH_LOCATION(
      accountNumber,
      transactionId as any
    );

    if (!recentTransactions) return;

    for (const transaction of recentTransactions) {
      const loc = Array.isArray(transaction.transaction_locations)
        ? transaction.transaction_locations[0]
        : transaction.transaction_locations;

      if (!loc || loc.latitude === null || loc.longitude === null) continue;

      const distanceKm = this.calculateDistanceKm(
        latitude,
        longitude,
        Number(loc.latitude),
        Number(loc.longitude)
      );

      const minutesDiff =
        Math.abs(
          new Date().getTime() -
          new Date(transaction.created_at).getTime()
        ) /
        (1000 * 60);

      if (distanceKm >= 5 && minutesDiff <= 15) {
        const { data: existingAlert } = await DBQuery.CHECK_FRAUD_ALERT_EXISTS(
          transactionId as any,
          transaction.id
        );

        if (existingAlert && existingAlert.length > 0) {
          continue;
        }

        await DBQuery.CREATE_FRAUD_ALERT({
          account_number: accountNumber,
          transaction_id: transactionId as any,
          compared_transaction_id: transaction.id,
          distance_km: Number(distanceKm.toFixed(2)),
          time_difference_minutes: Math.round(minutesDiff),
          message: 'Possível fraude detectada. Duas despesas ocorreram em locais distantes em um curto período.'
        });
      }
    }
  }

  async createTransaction(data: CreateTransactionDTO) {
    try {
      const status = data.status ?? "completed";

      if (data.category_id && data.subcategory_id) {
        const { data: validationRes } = await supabase
          .from('subcategories')
          .select('id')
          .eq('id', data.subcategory_id)
          .eq('category_id', data.category_id);

        if (!validationRes || validationRes.length === 0) {
          throw new Error("A subcategoria não pertence à categoria informada.");
        }
      }

      if (status === "completed" && data.type === "expense" && data.envelope_id) {
        const { data: envelopeRes } = await supabase
          .from('envelopes')
          .select('id, name, current_amount')
          .eq('id', data.envelope_id)
          .eq('account_number', data.account_number);

        if (!envelopeRes || envelopeRes.length === 0) {
          throw new Error("Envelope não encontrado.");
        }

        const envelope = envelopeRes[0];

        if (!envelope) {
          throw new Error("Envelope não encontrado.");
        }

        if (Number(envelope.current_amount) < data.amount) {
          throw new Error(`Saldo insuficiente no envelope "${envelope.name}".`);
        }

        const { error: updateEnvErr } = await supabase
          .from('envelopes')
          .update({ current_amount: Number(envelope.current_amount) - data.amount })
          .eq('id', data.envelope_id)
          .eq('account_number', data.account_number);

        if (updateEnvErr) throw updateEnvErr;
      }

      const transactionPayload = {
        account_number: data.account_number,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category ?? null,
        subcategory: data.subcategory ?? null,
        category_id: data.category_id ?? null,
        subcategory_id: data.subcategory_id ?? null,
        envelope_id: data.envelope_id ?? null,
        status
      };

      const transactionInsert = await DBQuery.CREATE_TRASACTION(transactionPayload);
      if (transactionInsert.error) throw transactionInsert.error;

      const transaction = Array.isArray(transactionInsert.data)
        ? transactionInsert.data[0]
        : transactionInsert.data;

      if (
        data.type === "expense" &&
        data.latitude !== undefined &&
        data.longitude !== undefined
      ) {
        const locationPayload = {
          transaction_id: transaction.id,
          latitude: data.latitude,
          longitude: data.longitude,
          location_name: data.location_name ?? null
        };

        const locInsert = await DBQuery.INSERT_TRANSACTION_LOCATION(locationPayload);
        if (locInsert.error) throw locInsert.error;

        await this.detectFraud(
          transaction.id,
          data.account_number,
          data.latitude,
          data.longitude
        );
      }

      if (status === "completed") {
        const { data: accountRes } = await supabase
          .from('accounts')
          .select('balance')
          .eq('account_number', data.account_number)
          .single();

        const currentBalance = accountRes ? Number(accountRes.balance) : 0;
        const newBalance = data.type === "expense"
          ? currentBalance - data.amount
          : currentBalance + data.amount;

        const { error: balanceErr } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('account_number', data.account_number);

        if (balanceErr) throw balanceErr;
      }

      return transaction;
    } catch (error: any) {
      if (error.code === "23503") {
        throw new Error("Categoria, subcategoria ou transação inválida.");
      }
      throw error;
    }
  }

  async getTransactionsByAccount(accountNumber: string) {
    const { data, error } = await DBQuery.GET_TRANSACTIONS_BY_ACCOUNT(accountNumber);
    if (error) throw error;

    return (data || []).map(t => {
      const receiptData = Array.isArray(t.transaction_receipts)
        ? t.transaction_receipts
        : [t.transaction_receipts].filter(Boolean);

      return {
        ...t,
        has_receipt: receiptData.length > 0
      };
    });
  }

  async getDashboardData(accountNumber: string) {
    const { data, error } = await DBQuery.GET_DASHBOARD_DATA(accountNumber);
    if (error) throw error;
    return data || [];
  }

  async getBalanceAccountChart(accountNumber: string) {
    const [resBal, resInc, resExp, resSum] = await Promise.all([
      DBQuery.GET_BALANCE_EVOLUTION(accountNumber),
      DBQuery.GET_INCOME_EVOLUTION(accountNumber),
      DBQuery.GET_EXPENSE_EVOLUTION(accountNumber),
      DBQuery.GET_SUMMARY_EVOLUTION(accountNumber)
    ]);

    if (resBal.error) throw resBal.error;
    if (resInc.error) throw resInc.error;
    if (resExp.error) throw resExp.error;
    if (resSum.error) throw resSum.error;

    const totals = { income: 0, expense: 0 };
    (resSum.data || []).forEach((row: any) => {
      if (row.type === 'income') totals.income = parseFloat(row.amount);
      if (row.type === 'expense') totals.expense = parseFloat(Math.abs(row.amount).toString());
    });

    return {
      balanceChart: {
        labels: (resBal.data || []).map((r: any) => r.label),
        values: (resBal.data || []).map((r: any) => parseFloat(r.value))
      },
      incomeChart: {
        labels: (resInc.data || []).map((r: any) => r.label),
        values: (resInc.data || []).map((r: any) => parseFloat(r.value))
      },
      expenseChart: {
        labels: (resExp.data || []).map((r: any) => r.label),
        values: (resExp.data || []).map((r: any) => parseFloat(r.value))
      },
      totals
    };
  }

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getSubcategoriesByCategory(categoryId: number) {
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getDailyExpenses(account_number: string) {
    const { data, error } = await DBQuery.GET_DAILY_EXPENSES(account_number);
    if (error) throw error;
    return data || [];
  }

  async confirmPendingTransaction(transactionId: number, accountNumber: string) {
    try {
      const { data: transactionRes, error: fetchErr } = await supabase
        .from('transactions')
        .select('id, account_number, amount, type, status')
        .eq('id', transactionId)
        .eq('account_number', accountNumber);

      if (fetchErr) throw fetchErr;
      const transaction = transactionRes?.[0];
      if (!transaction) {
        throw new Error('Transação não encontrada.');
      }
      if (transaction.status !== 'pending') {
        throw new Error('Essa transação não está pendente.');
      }
      const { data: accountRes } = await supabase
        .from('accounts')
        .select('balance')
        .eq('account_number', accountNumber)
        .single();

      const currentBalance = accountRes ? Number(accountRes.balance) : 0;
      const newBalance = transaction.type === 'expense'
        ? currentBalance - Number(transaction.amount)
        : currentBalance + Number(transaction.amount);

      const { error: balanceErr } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('account_number', accountNumber);

      if (balanceErr) throw balanceErr;

      const { data: updateTransactionRes, error: updateTxErr } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId)
        .eq('account_number', accountNumber)
        .select('*');

      if (updateTxErr) throw updateTxErr;

      return updateTransactionRes[0];
    } catch (error) {
      throw error;
    }
  }

  async cancelPendingTransaction(transactionId: number, accountNumber: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', transactionId)
      .eq('account_number', accountNumber)
      .eq('status', 'pending')
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Transação pendente não encontrada.');
    }

    return data[0];
  }

  async getPendingTransactions(accountNumber: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_number', accountNumber)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addReceipt(transactionId: string, accountNumber: string, imageUri: string) {
    const { data: transactionRes, error: txErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('account_number', accountNumber)
      .eq('type', 'expense');

    if (txErr) throw txErr;
    if (!transactionRes || transactionRes.length === 0) {
      throw new Error("Despesa não encontrada.");
    }

    const { data, error } = await supabase
      .from('transaction_receipts')
      .insert([{ transaction_id: transactionId, image_uri: imageUri }])
      .select('*');

    if (error) throw error;
    return data[0];
  }

  async getReceiptsByTransaction(transactionId: string, accountNumber: string) {
    const { data: transactionRes, error: txErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('account_number', accountNumber);

    if (txErr) throw txErr;
    if (!transactionRes || transactionRes.length === 0) {
      throw new Error("Transação não encontrada.");
    }

    const { data, error } = await supabase
      .from('transaction_receipts')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deleteReceipt(receiptId: string, accountNumber: string) {
    const { data: trRes, error: fetchErr } = await supabase
      .from('transaction_receipts')
      .select('id, transaction_id, transactions!inner(account_number)')
      .eq('id', receiptId)
      .eq('transactions.account_number', accountNumber);

    if (fetchErr || !trRes || trRes.length === 0) {
      throw new Error("Recibo não encontrado.");
    }

    const { data, error } = await supabase
      .from('transaction_receipts')
      .delete()
      .eq('id', receiptId)
      .select('*');

    if (error) throw error;
    return data[0];
  }

  async detectFixedExpenses(accountNumber: string) {
    const { data: expenses, error } = await DBQuery.GET_CONCLUDED_EXPENSES(accountNumber);
    if (error || !expenses) return [];

    const groupedExpenses = new Map<string, any[]>();

    for (const expense of expenses) {
      const description = String(expense.description || "")
        .trim()
        .toLowerCase();

      if (!description) continue;

      if (!groupedExpenses.has(description)) {
        groupedExpenses.set(description, []);
      }

      groupedExpenses.get(description)?.push(expense);
    }

    const fixedExpenses = [];

    for (const [description, items] of groupedExpenses.entries()) {
      const months = new Set(
        items.map((item) => {
          const date = new Date(item.created_at);
          return `${date.getFullYear()}-${date.getMonth() + 1}`;
        })
      );

      if (months.size < 2) continue;

      const amounts = items.map((item) => Number(item.amount));
      const averageAmount =
        amounts.reduce((sum, value) => sum + value, 0) / amounts.length;

      const similarAmounts = amounts.filter((amount) => {
        const difference = Math.abs(amount - averageAmount);
        return difference <= averageAmount * 0.1;
      });

      const confidence =
        similarAmounts.length === amounts.length
          ? "alta"
          : similarAmounts.length >= 2
            ? "média"
            : "baixa";

      if (confidence === "baixa") continue;

      fixedExpenses.push({
        description: items[0].description,
        category: items[0].category,
        subcategory: items[0].subcategory,
        averageAmount: Number(averageAmount.toFixed(2)),
        occurrences: items.length,
        monthsDetected: months.size,
        confidence,
        lastOccurrence: items[0].created_at,
      });
    }

    return fixedExpenses.sort((a, b) => b.occurrences - a.occurrences);
  }

  async exportTransactionsCSV(accountNumber: string) {
    const { data: transactions, error } = await DBQuery.GET_TRANSACTIONS_BY_ACCOUNT(accountNumber);
    if (error || !transactions) return '';

    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Subcategoria',
      'Tipo',
      'Valor',
      'Status',
    ];

    const rows = transactions.map((transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString('pt-BR');
      const type = transaction.type === 'expense' ? 'Despesa' : 'Receita';

      return [
        date,
        transaction.description || '',
        transaction.category || '',
        transaction.subcategory || '',
        type,
        String(Math.abs(Number(transaction.amount))).replace('.', ','),
        transaction.status || '',
      ];
    });

    const csv = [
      headers.join(';'),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(';')
      ),
    ].join('\n');

    return csv;
  }

  async getSuggestedGeofences(accountNumber: string) {
    const { data, error } = await DBQuery.GET_SUGGESTED_GEOFENCES(accountNumber);
    if (error || !data) return [];

    return data.map((item: any) => ({
      identifier: `${String(item.category)
        .toLowerCase()
        .replace(/\s+/g, '_')}_${item.latitude_group}_${item.longitude_group}`,
      category: item.category,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      radius: 150,
      transaction_count: Number(item.transaction_count),
      total_amount: Number(item.total_amount),
    }));
  }

  async getFraudAlerts(accountNumber: string) {
    const { data, error } = await DBQuery.GET_FRAUD_ALERTS(accountNumber);
    if (error) throw error;
    return data || [];
  }
}