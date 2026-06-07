import { GamingBadgeService } from "./GamingBadgeService";
// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

export class GoalService {
  async getGoalsByAccount(accountNumber: string) {
    const response = await fetch(`${baseUrl}/accounts/goals/${accountNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao buscar metas.");
    }

    return data;
  }

  async createGoal(data: {
    accountNumber: string;
    name: string;
    target_amount: number;
    monthly_deposit: number;
    auto_deposit: boolean;
  }) {
    const response = await fetch(`${baseUrl}/accounts/goals/${data.accountNumber}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        target_amount: data.target_amount,
        monthly_deposit: data.monthly_deposit,
        auto_deposit: data.auto_deposit
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erro ao criar meta.");
    }

    try {
      const gamingBadgeService = new GamingBadgeService();
      await gamingBadgeService.unlockAchievement(data.accountNumber, "FIRST_GOAL");
    } catch (error) {
      console.log("Badge de primeira meta já desbloqueada ou não aplicada.");
    }

    return result;
  }

  async depositToGoal(goalId: number, amount: number) {
    const response = await fetch(`${baseUrl}/accounts/goals/${goalId}/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao depositar na meta.");
    }

    return data;
  }
  async deleteGoal(goalId: number) {
    const response = await fetch(`${baseUrl}/accounts/goals/${goalId}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao remover meta.");
    }

    return data;
  }
}