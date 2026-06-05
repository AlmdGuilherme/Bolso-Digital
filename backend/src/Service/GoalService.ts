import { pool } from "../database/database.js";

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
    const nextDepositDate = autoDeposit ? this.getNextDepositDate() : null;

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

    const existingGoal = await pool.query(
      `
        SELECT id
        FROM goals
        WHERE account_number = $1
          AND LOWER(name) = LOWER($2)
      `,
      [data.account_number, trimmedName]
    );

    if (existingGoal.rows.length > 0) {
      throw new Error("Já existe uma meta com esse nome nesta conta.");
    }

    const result = await pool.query(
      `
        INSERT INTO goals (
          account_number,
          name,
          target_amount,
          current_amount,
          monthly_deposit,
          auto_deposit,
          next_deposit_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        data.account_number,
        trimmedName,
        data.target_amount,
        0,
        data.monthly_deposit,
        autoDeposit,
        nextDepositDate
      ]
    );

    return result.rows[0];
  }

  async getGoalsByAccount(accountNumber: string) {
    const result = await pool.query(
      `
        SELECT
          id,
          account_number,
          name,
          target_amount,
          current_amount,
          monthly_deposit,
          auto_deposit,
          next_deposit_date,
          created_at,
          CASE
            WHEN target_amount > 0
              THEN ROUND((current_amount / target_amount) * 100, 2)
            ELSE 0
          END AS progress
        FROM goals
        WHERE account_number = $1
        ORDER BY created_at DESC
      `,
      [accountNumber]
    );

    return result.rows;
  }

  async depositToGoal(goalId: number, amount: number) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      if (!goalId) {
        throw new Error("Id da meta é obrigatório.");
      }

      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error("O valor do depósito deve ser maior que zero.");
      }

      const goalResult = await client.query(
        `
          SELECT *
          FROM goals
          WHERE id = $1
          FOR UPDATE
        `,
        [goalId]
      );

      if (goalResult.rows.length === 0) {
        throw new Error("Meta não encontrada.");
      }

      const goal = goalResult.rows[0];

      const accountResult = await client.query(
        `
          SELECT account_number, balance
          FROM accounts
          WHERE account_number = $1
          FOR UPDATE
        `,
        [goal.account_number]
      );

      if (accountResult.rows.length === 0) {
        throw new Error("Conta não encontrada.");
      }

      const account = accountResult.rows[0];
      const accountBalance = Number(account.balance);

      if (amount > accountBalance) {
        throw new Error(`Saldo insuficiente. Saldo disponível: R$ ${accountBalance.toFixed(2)}`);
      }

      const remainingAmount = Number(goal.target_amount) - Number(goal.current_amount);
      const depositAmount = Math.min(amount, remainingAmount);

      await client.query(
        `
          UPDATE accounts
          SET balance = balance - $1
          WHERE account_number = $2
        `,
        [depositAmount, goal.account_number]
      );

      const updatedGoal = await client.query(
        `
          UPDATE goals
          SET current_amount = current_amount + $1
          WHERE id = $2
          RETURNING *
        `,
        [depositAmount, goalId]
      );

      await client.query(
        `
          INSERT INTO transactions (
            account_number,
            amount,
            type,
            description
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          goal.account_number,
          -depositAmount,
          "goal_deposit",
          `Depósito para meta: ${goal.name}`
        ]
      );

      await client.query("COMMIT");

      return updatedGoal.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateGoal(goalId: number, data: {
    name?: string;
    target_amount?: number;
    monthly_deposit?: number;
    auto_deposit?: boolean;
  }) {
    const currentGoal = await pool.query(
      `
        SELECT *
        FROM goals
        WHERE id = $1
      `,
      [goalId]
    );

    if (currentGoal.rows.length === 0) {
      throw new Error("Meta não encontrada.");
    }

    const goal = currentGoal.rows[0];

    const name = data.name?.trim() || goal.name;
    const targetAmount = data.target_amount ?? Number(goal.target_amount);
    const monthlyDeposit = data.monthly_deposit ?? Number(goal.monthly_deposit);
    const autoDeposit = data.auto_deposit ?? goal.auto_deposit;
    const nextDepositDate = autoDeposit && !goal.next_deposit_date
      ? this.getNextDepositDate()
      : goal.next_deposit_date;

    if (!name) {
      throw new Error("O nome da meta é obrigatório.");
    }

    if (targetAmount <= 0) {
      throw new Error("O valor alvo deve ser maior que zero.");
    }

    if (monthlyDeposit <= 0) {
      throw new Error("O depósito mensal deve ser maior que zero.");
    }

    const result = await pool.query(
      `
        UPDATE goals
        SET
          name = $1,
          target_amount = $2,
          monthly_deposit = $3,
          auto_deposit = $4,
          next_deposit_date = $5
        WHERE id = $6
        RETURNING *
      `,
      [
        name,
        targetAmount,
        monthlyDeposit,
        autoDeposit,
        nextDepositDate,
        goalId
      ]
    );

    return result.rows[0];
  }

  async deleteGoal(goalId: number) {
    const result = await pool.query(
      `
        DELETE FROM goals
        WHERE id = $1
        RETURNING *
      `,
      [goalId]
    );

    if (result.rows.length === 0) {
      throw new Error("Meta não encontrada.");
    }

    return result.rows[0];
  }

  async processAutomaticGoalDeposits() {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const goals = await client.query(`
        SELECT *
        FROM goals
        WHERE auto_deposit = true
          AND next_deposit_date <= CURRENT_DATE
          AND current_amount < target_amount
        FOR UPDATE
      `);

      for (const goal of goals.rows) {
        const accountResult = await client.query(
          `
            SELECT account_number, balance
            FROM accounts
            WHERE account_number = $1
            FOR UPDATE
          `,
          [goal.account_number]
        );

        if (accountResult.rows.length === 0) {
          continue;
        }

        const account = accountResult.rows[0];
        const accountBalance = Number(account.balance);
        const remainingAmount = Number(goal.target_amount) - Number(goal.current_amount);
        const depositAmount = Math.min(Number(goal.monthly_deposit), remainingAmount);

        if (accountBalance < depositAmount) {
          await client.query(
            `
              UPDATE goals
              SET next_deposit_date = next_deposit_date + INTERVAL '1 month'
              WHERE id = $1
            `,
            [goal.id]
          );

          continue;
        }

        await client.query(
          `
            UPDATE accounts
            SET balance = balance - $1
            WHERE account_number = $2
          `,
          [depositAmount, goal.account_number]
        );

        await client.query(
          `
            UPDATE goals
            SET current_amount = current_amount + $1,
                next_deposit_date = next_deposit_date + INTERVAL '1 month'
            WHERE id = $2
          `,
          [depositAmount, goal.id]
        );

        await client.query(
          `
            INSERT INTO transactions (
              account_number,
              amount,
              type,
              description
            )
            VALUES ($1, $2, $3, $4)
          `,
          [
            goal.account_number,
            -depositAmount,
            "goal_deposit",
            `Depósito automático para meta: ${goal.name}`
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}