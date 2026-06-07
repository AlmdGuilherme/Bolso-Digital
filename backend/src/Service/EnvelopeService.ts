import { supabase } from "../database/database.js";

type BudgetPeriod = 'monthly' | 'yearly';

class EnvelopeService {
  async getEnvelopesByAccount(accountNumber: string) {
    try {
      const todayStr: string = new Date().toISOString().split('T')[0] as string;

      const { data, error } = await supabase
        .from('envelopes')
        .select('id, name, allocated_amount, current_amount, budget_period, period_start, period_end, auto_reset')
        .eq('account_number', accountNumber)
        .order('period_end', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(envelope => ({
        ...envelope,
        expired: todayStr > (envelope.period_end ?? '')
      }));
    } catch (error) {
      throw error;
    }
  }

  async transferBetweenEnvelopes(data: {
    source_envelope_id: number,
    target_envelope_id: number,
    amount: number,
    account_number: string
  }) {
    try {
      if (data.source_envelope_id === data.target_envelope_id) {
        throw new Error("O envelope de origem e destino não podem ser o mesmo.");
      }

      if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        throw new Error("O valor da transferência deve ser maior que zero.");
      }

      const { data: sourceRes, error: sourceErr } = await supabase
        .from('envelopes')
        .select('current_amount, name')
        .eq('id', data.source_envelope_id)
        .eq('account_number', data.account_number);

      if (sourceErr) throw sourceErr;

      const sourceEnvelope = sourceRes?.[0];

      if (!sourceEnvelope) {
        throw new Error("Envelope de origem não encontrado.");
      }

      if (Number(sourceEnvelope.current_amount) < data.amount) {
        throw new Error(`Saldo insuficiente no envelope "${sourceEnvelope.name}".`);
      }

      const { data: targetCheck, error: targetCheckErr } = await supabase
        .from('envelopes')
        .select('current_amount')
        .eq('id', data.target_envelope_id)
        .eq('account_number', data.account_number);

      if (targetCheckErr) throw targetCheckErr;

      const targetEnvelope = targetCheck?.[0];

      if (!targetEnvelope) {
        throw new Error("Envelope de destino não encontrado nesta conta.");
      }

      const { error: subErr } = await supabase
        .from('envelopes')
        .update({ current_amount: Number(sourceEnvelope.current_amount) - data.amount })
        .eq('id', data.source_envelope_id)
        .eq('account_number', data.account_number);

      if (subErr) throw subErr;

      const { error: addErr } = await supabase
        .from('envelopes')
        .update({ current_amount: Number(targetEnvelope.current_amount) + data.amount })
        .eq('id', data.target_envelope_id)
        .eq('account_number', data.account_number);

      if (addErr) throw addErr;

      const { error: logErr } = await supabase
        .from('transactions')
        .insert([{
          account_number: data.account_number,
          description: `Transferência interna entre envelopes`,
          amount: data.amount,
          type: 'transfer',
          category: 'Ajuste',
          subcategory: 'Envelope',
          envelope_id: data.target_envelope_id
        }]);

      if (logErr) throw logErr;

      return { message: "Transferência realizada com sucesso!" };
    } catch (error) {
      throw error;
    }
  }

  async getBudgetPeriod(period: BudgetPeriod) {
    const now = new Date();

    if (period === 'monthly') {
      return {
        period_start: new Date(now.getFullYear(), now.getMonth(), 1),
        period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }

    return {
      period_start: new Date(now.getFullYear(), 0, 1),
      period_end: new Date(now.getFullYear(), 11, 31)
    };
  }

  async createEnvelope(data: {
    account_number: string;
    name: string;
    allocated_amount: number;
    budget_period?: BudgetPeriod;
    auto_reset?: boolean;
  }) {
    try {
      const trimmedName = data.name?.trim();
      const budgetPeriod = data.budget_period ?? 'monthly';
      const autoReset = data.auto_reset ?? false;
      const allocatedAmount = Number(data.allocated_amount);

      if (!trimmedName) {
        throw new Error('O nome do envelope é obrigatório.');
      }

      if (!['monthly', 'yearly'].includes(budgetPeriod)) {
        throw new Error('Período de orçamento inválido.');
      }

      if (!allocatedAmount || isNaN(allocatedAmount) || allocatedAmount <= 0) {
        throw new Error('O valor alocado deve ser maior que zero.');
      }

      const { period_start, period_end } = await this.getBudgetPeriod(budgetPeriod);

      const { data: account, error: accErr } = await supabase
        .from('accounts')
        .select('account_number, balance')
        .eq('account_number', data.account_number)
        .single();

      if (accErr) throw accErr;

      if (!account) {
        throw new Error('Conta não encontrada.');
      }

      const accountBalance = Number(account.balance);

      if (allocatedAmount > accountBalance) {
        throw new Error(
          `Saldo insuficiente para criar o envelope. Disponível: R$ ${accountBalance.toFixed(2)}`
        );
      }

      const { data: existingEnvelope, error: existErr } = await supabase
        .from('envelopes')
        .select('id')
        .eq('account_number', data.account_number)
        .ilike('name', trimmedName);

      if (existErr) throw existErr;

      if (existingEnvelope && existingEnvelope.length > 0) {
        throw new Error('Já existe um envelope com esse nome nesta conta.');
      }

      const { data: envelopeResult, error: insertErr } = await supabase
        .from('envelopes')
        .insert([{
          account_number: data.account_number,
          name: trimmedName,
          allocated_amount: allocatedAmount,
          current_amount: allocatedAmount,
          budget_period: budgetPeriod,
          period_start: period_start.toISOString().split('T')[0],
          period_end: period_end.toISOString().split('T')[0],
          auto_reset: autoReset,
        }])
        .select('*');

      if (insertErr) throw insertErr;

      const envelope = envelopeResult?.[0];

      if (!envelope) {
        throw new Error('Não foi possível criar o envelope.');
      }

      const { error: transactionErr } = await supabase
        .from('transactions')
        .insert([{
          account_number: data.account_number,
          description: `Criação do envelope: ${trimmedName}`,
          amount: allocatedAmount,
          type: 'expense',
          category: 'Envelope',
          subcategory: budgetPeriod === 'monthly' ? 'Mensal' : 'Anual',
          envelope_id: envelope.id,
          status: 'completed',
        }]);

      if (transactionErr) throw transactionErr;

      const { error: balanceErr } = await supabase
        .from('accounts')
        .update({
          balance: accountBalance - allocatedAmount,
        })
        .eq('account_number', data.account_number);

      if (balanceErr) throw balanceErr;

      return envelope;
    } catch (error) {
      throw error;
    }
  } 

  getNextBudgetPeriod(period: 'monthly' | 'yearly', currentStart: Date) {
    const date = new Date(currentStart);

    if (period === 'monthly') {
      return {
        period_start: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        period_end: new Date(date.getFullYear(), date.getMonth() + 2, 0)
      };
    }

    return {
      period_start: new Date(date.getFullYear() + 1, 0, 1),
      period_end: new Date(date.getFullYear() + 1, 11, 31)
    };
  }

  async resetExpiredEnvelopes() {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const { data: expiredEnvelopes, error: fetchErr } = await supabase
        .from('envelopes')
        .select('*')
        .eq('auto_reset', true)
        .lt('period_end', todayStr);

      if (fetchErr || !expiredEnvelopes) return;

      for (const envelope of expiredEnvelopes) {
        const { error: histErr } = await supabase
          .from('envelope_history')
          .insert([{
            envelope_id: envelope.id,
            allocated_amount: envelope.allocated_amount,
            current_amount: envelope.current_amount,
            budget_period: envelope.budget_period,
            period_start: envelope.period_start,
            period_end: envelope.period_end
          }]);

        if (histErr) throw histErr;

        const { period_start, period_end } = this.getNextBudgetPeriod(
          envelope.budget_period,
          new Date(envelope.period_start)
        );

        const { error: updateErr } = await supabase
          .from('envelopes')
          .update({
            current_amount: envelope.allocated_amount,
            period_start: period_start.toISOString().split('T')[0],
            period_end: period_end.toISOString().split('T')[0]
          })
          .eq('id', envelope.id);

        if (updateErr) throw updateErr;
      }
    } catch (error) {
      throw error;
    }
  }

  async getEnvelopeHistory(envelopeId: number) {
    const { data, error } = await supabase
      .from('envelope_history')
      .select('id, envelope_id, allocated_amount, current_amount, budget_period, period_start, period_end, created_at')
      .eq('envelope_id', envelopeId)
      .order('period_start', { ascending: true });

    if (error) throw error;

    return data || [];
  }
}

export { EnvelopeService };