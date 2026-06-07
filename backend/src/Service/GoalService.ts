import { supabase } from "../database/database.js";

type CreateGoalDTO = {
  account_number: string;
  name: string;
  target_amount: number;
  monthly_deposit: number;
  auto_deposit?: boolean;
};

export class GoalService {
  private getNextDepositDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  async createGoal(data: CreateGoalDTO) {
    const trimmedName = data.name?.trim();
    const autoDeposit = data.auto_deposit ?? false;
    const nextDepositDate = autoDeposit ? this.getNextDepositDate().toISOString() : null;

    if (!data.account_number) {
      throw new Error("Número da conta é obrigatório.");
    }

    if (!trimmedName) {
      throw new Error("O nome da meta é obrigatório.");
    }

    if (!data.target_amount || isNaN(data.target_amount) || data.target_amount <= 0) {
      throw new Error("O valor alvo deve ser maior que zero.");
    }

    if (!data.monthly_deposit || isNaN(data.monthly_deposit) || data.monthly_deposit <= 0) {
      throw new Error("O depósito mensal deve ser maior que zero.");
    }

    const { data: existingGoal, error: fetchErr } = await supabase
      .from('goals')
      .select('id')
      .eq('account_number', data.account_number)
      .ilike('name', trimmedName);

    if (fetchErr) throw fetchErr;
    if (existingGoal && existingGoal.length > 0) {
      throw new Error("Já existe uma meta com esse nome nesta conta.");
    }

    const { data: result, error: insertErr } = await supabase
      .from('goals')
      .insert([{
        account_number: data.account_number,
        name: trimmedName,
        target_amount: data.target_amount,
        current_amount: 0,
        monthly_deposit: data.monthly_deposit,
        auto_deposit: autoDeposit,
        next_deposit_date: nextDepositDate
      }])
      .select('*');

    if (insertErr) throw insertErr;
    return result[0];
  }

  async getGoalsByAccount(accountNumber: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('id, account_number, name, target_amount, current_amount, monthly_deposit, auto_deposit, next_deposit_date, created_at')
      .eq('account_number', accountNumber)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(goal => {
      const target = Number(goal.target_amount);
      const current = Number(goal.current_amount);
      const progress = target > 0 ? Number(((current / target) * 100).toFixed(2)) : 0;

      return {
        ...goal,
        progress
      };
    });
  }

  async depositToGoal(goalId: number, amount: number) {
    try {
      if (!goalId) {
        throw new Error("Id da meta é obrigatório.");
      }

      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error("O valor do depósito deve ser maior que zero.");
      }

      const { data: goalRes, error: goalErr } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId);

      if (goalErr) throw goalErr;
      if (!goalRes || goalRes.length === 0) {
        throw new Error("Meta não encontrada.");
      }

      const goal = goalRes[0];

      const { data: accountRes, error: accErr } = await supabase
        .from('accounts')
        .select('account_number, balance')
        .eq('account_number', goal.account_number);

      if (accErr) throw accErr;

      const account = accountRes?.[0];

      if (!account) {
        throw new Error("Conta não encontrada.");
      }

      const accountBalance = Number(account.balance);

      if (amount > accountBalance) {
        throw new Error(`Saldo insuficiente. Saldo disponível: R$ ${accountBalance.toFixed(2)}`);
      }

      const remainingAmount = Number(goal.target_amount) - Number(goal.current_amount);
      const depositAmount = Math.min(amount, remainingAmount);

      const { error: accUpdateErr } = await supabase
        .from('accounts')
        .update({ balance: accountBalance - depositAmount })
        .eq('account_number', goal.account_number);

      if (accUpdateErr) throw accUpdateErr;

      const { data: updatedGoalRes, error: goalUpdateErr } = await supabase
        .from('goals')
        .update({ current_amount: Number(goal.current_amount) + depositAmount })
        .eq('id', goalId)
        .select('*');

      if (goalUpdateErr) throw goalUpdateErr;

      const { error: txErr } = await supabase
        .from('transactions')
        .insert([{
          account_number: goal.account_number,
          amount: -depositAmount,
          type: "goal_deposit",
          description: `Depósito para meta: ${goal.name}`
        }]);

      if (txErr) throw txErr;

      return updatedGoalRes[0];
    } catch (error) {
      throw error;
    }
  }

  async updateGoal(goalId: number, data: {
    name?: string;
    target_amount?: number;
    monthly_deposit?: number;
    auto_deposit?: boolean;
  }) {
    const { data: currentGoalRes, error: fetchErr } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId);

    if (fetchErr) throw fetchErr;
    if (!currentGoalRes || currentGoalRes.length === 0) {
      throw new Error("Meta não encontrada.");
    }

    const goal = currentGoalRes[0];

    const name = data.name?.trim() || goal.name;
    const targetAmount = data.target_amount ?? Number(goal.target_amount);
    const monthlyDeposit = data.monthly_deposit ?? Number(goal.monthly_deposit);
    const autoDeposit = data.auto_deposit ?? goal.auto_deposit;

    let nextDepositDate = goal.next_deposit_date;
    if (autoDeposit && !goal.next_deposit_date) {
      nextDepositDate = this.getNextDepositDate().toISOString();
    }

    if (!name) {
      throw new Error("O nome da meta é obrigatório.");
    }

    if (targetAmount <= 0) {
      throw new Error("O valor alvo deve ser maior que zero.");
    }

    if (monthlyDeposit <= 0) {
      throw new Error("O depósito mensal deve ser maior que zero.");
    }

    const { data: result, error: updateErr } = await supabase
      .from('goals')
      .update({
        name,
        target_amount: targetAmount,
        monthly_deposit: monthlyDeposit,
        auto_deposit: autoDeposit,
        next_deposit_date: nextDepositDate
      })
      .eq('id', goalId)
      .select('*');

    if (updateErr) throw updateErr;
    return result[0];
  }

  async deleteGoal(goalId: number) {
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Meta não encontrada.");
    }

    return data[0];
  }

  async processAutomaticGoalDeposits() {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const { data: goals, error: goalsErr } = await supabase
        .from('goals')
        .select('*')
        .eq('auto_deposit', true)
        .lte('next_deposit_date', todayStr);

      if (goalsErr || !goals) return;

      for (const goal of goals) {
        if (Number(goal.current_amount) >= Number(goal.target_amount)) continue;

        const { data: accountRes } = await supabase
          .from('accounts')
          .select('account_number, balance')
          .eq('account_number', goal.account_number);

        const account = accountRes?.[0];

        if (!account) continue;

        const accountBalance = Number(account.balance);
        const remainingAmount = Number(goal.target_amount) - Number(goal.current_amount);
        const depositAmount = Math.min(Number(goal.monthly_deposit), remainingAmount);

        const currentNextDeposit = new Date(goal.next_deposit_date);
        currentNextDeposit.setMonth(currentNextDeposit.getMonth() + 1);
        const updatedNextDepositStr = currentNextDeposit.toISOString().split('T')[0];

        if (accountBalance < depositAmount) {
          await supabase
            .from('goals')
            .update({ next_deposit_date: updatedNextDepositStr })
            .eq('id', goal.id);

          continue;
        }

        await supabase
          .from('accounts')
          .update({ balance: accountBalance - depositAmount })
          .eq('account_number', goal.account_number);

        await supabase
          .from('goals')
          .update({
            current_amount: Number(goal.current_amount) + depositAmount,
            next_deposit_date: updatedNextDepositStr
          })
          .eq('id', goal.id);

        await supabase
          .from('transactions')
          .insert([{
            account_number: goal.account_number,
            amount: -depositAmount,
            type: "goal_deposit",
            description: `Depósito automático para meta: ${goal.name}`
          }]);
      }
    } catch (error) {
      throw error;
    }
  }
}