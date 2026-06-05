import type { FastifyReply, FastifyRequest } from "fastify";
import { SMSService } from "../Service/SMSService.js";

class SMSController {
  private smsService: SMSService

  constructor() {
    this.smsService = new SMSService()
  }

  async sendVerificationCode(request: FastifyRequest, reply: FastifyReply) {
    const { phoneNumber } = request.body as any
    try {
      await this.smsService.sendVerificationCode(phoneNumber)
      return reply.status(200).send({
        message: "SMS enviado com sucesso!"
      })
    } catch (error: any) {
      return reply.status(401).send({
        message: error.message || "Erro ao enviar SMS!"
      })
    }
  }

  async resendVerificationCode(request: FastifyRequest, reply: FastifyReply) {
    const { phoneNumber } = request.body as any
    try {
      await this.smsService.resendVerificationCode(phoneNumber)
      return reply.status(200).send({
        message: "Código reenviado com sucesso!"
      })
    } catch (error: any) {
      return reply.status(401).send({
        message: error.message || "Erro ao reenviar SMS!"
      })
    }
  }

  async validateCode(request: FastifyRequest, reply: FastifyReply) {
    const { phoneNumber, code } = request.body as any
    try {
      const result = await this.smsService.verifyCode(phoneNumber, code)
      return reply.status(200).send({
        message: result.message,
        validated: result.validated
      })
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao validar código!"
      })
    }
  }
}

export { SMSController }