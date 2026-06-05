import type { FastifyReply, FastifyRequest } from "fastify";
import { GoalService } from "../Service/GoalService.js";

export class GoalController {
  private goalService: GoalService;

  constructor() {
    this.goalService = new GoalService();
  }

  async CreateGoal(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const {
        name,
        target_amount,
        monthly_deposit,
        auto_deposit
      } = request.body as {
        name: string;
        target_amount: number;
        monthly_deposit: number;
        auto_deposit?: boolean;
      };

      if (!accountNumber || !name || target_amount === undefined || monthly_deposit === undefined) {
        return reply.status(400).send({
          message: "Número da conta, nome, valor alvo e depósito mensal são obrigatórios."
        });
      }

      const goal = await this.goalService.createGoal({
        account_number: accountNumber,
        name,
        target_amount,
        monthly_deposit,
        auto_deposit: auto_deposit ?? false
      });

      return reply.status(201).send(goal);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao criar meta."
      });
    }
  }

  async GetGoalsByAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      if (!accountNumber) {
        return reply.status(400).send({
          message: "Número da conta é obrigatório."
        });
      }

      const goals = await this.goalService.getGoalsByAccount(accountNumber);

      return reply.status(200).send(goals);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao buscar metas."
      });
    }
  }

  async DepositToGoal(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { goalId } = request.params as { goalId: string };

      const { amount } = request.body as {
        amount: number;
      };

      if (!goalId || amount === undefined) {
        return reply.status(400).send({
          message: "Id da meta e valor são obrigatórios."
        });
      }

      const goal = await this.goalService.depositToGoal(Number(goalId), amount);

      return reply.status(200).send(goal);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao depositar na meta."
      });
    }
  }

  async DeleteGoal(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { goalId } = request.params as { goalId: string };

      if (!goalId) {
        return reply.status(400).send({
          message: "Id da meta é obrigatório."
        });
      }

      await this.goalService.deleteGoal(Number(goalId));

      return reply.status(200).send({
        message: "Meta removida com sucesso."
      });
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao remover meta."
      });
    }
  }
}