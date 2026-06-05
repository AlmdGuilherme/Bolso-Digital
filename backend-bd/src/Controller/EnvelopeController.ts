import type { FastifyReply, FastifyRequest } from "fastify";
import { EnvelopeService } from "../Service/EnvelopeService.js"

class EnvelopeController {
  private envelopeService: EnvelopeService;

  constructor() {
    this.envelopeService = new EnvelopeService();
  }

  async CreateEnvelope(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const {
        name,
        allocated_amount,
        budget_period = 'monthly',
        auto_reset = false
      } = request.body as {
        name: string;
        allocated_amount: number;
        budget_period?: 'monthly' | 'yearly';
        auto_reset?: boolean;
      };

      if (!accountNumber || !name || allocated_amount === undefined) {
        return reply.status(400).send({
          message: "Número da conta, nome e valor alocado são obrigatórios."
        });
      }

      const envelope = await this.envelopeService.createEnvelope({
        account_number: accountNumber,
        name,
        allocated_amount,
        budget_period,
        auto_reset
      });

      return reply.status(201).send(envelope);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao criar envelope."
      });
    }
  }

  async GetEnvelopesByAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };
      const envelopes = await this.envelopeService.getEnvelopesByAccount(accountNumber);
      return reply.status(200).send(envelopes);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async TransferBetweenEnvelopes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const { source_envelope_id, target_envelope_id, amount } = request.body as {
        source_envelope_id: number;
        target_envelope_id: number;
        amount: number;
      };

      const result = await this.envelopeService.transferBetweenEnvelopes({
        account_number: accountNumber,
        source_envelope_id,
        target_envelope_id,
        amount,
      });

      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async GetEnvelopeHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { envelopeId } = request.params as { envelopeId: string };
      if (!envelopeId) {
        return reply.status(400).send({
          message: "Id do envelope é obrigatório."
        });
      }
      const history = await this.envelopeService.getEnvelopeHistory(Number(envelopeId));
      return reply.status(200).send(history);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao buscar histórico do envelope."
      });
    }
  }
}

export { EnvelopeController }