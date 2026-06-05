import type { FastifyRequest, FastifyReply } from 'fastify';
import { GamingBadgeService } from '../Service/GamingBadgeService.js';

export class GamingBadgeController {
  private gamingBadgeService: GamingBadgeService;

  constructor() {
    this.gamingBadgeService = new GamingBadgeService();
  }

  async GetAccountAchievements(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const achievements = await this.gamingBadgeService.getAccountAchievements(
        accountNumber
      );

      return reply.status(200).send(achievements);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || 'Erro ao buscar conquistas.',
      });
    }
  }

  async GetAllAchievements(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const achievements = await this.gamingBadgeService.getAllAchievements(
        accountNumber
      );

      return reply.status(200).send(achievements);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || 'Erro ao buscar badges.',
      });
    }
  }

  async UnlockAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };
      const { achievementCode } = request.body as { achievementCode: string };

      const result = await this.gamingBadgeService.unlockAchievement(
        accountNumber,
        achievementCode
      );

      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || 'Erro ao desbloquear conquista.',
      });
    }
  }
}