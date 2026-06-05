import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../Service/AuthService.js";

class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password, pin } = request.body as any
    try {
      const userData = await this.authService.Login(email, password, pin);

      const auth_token = await reply.jwtSign(
        { sub: userData.id, email: userData.email },
        { expiresIn: '1d' }
      );

      await this.authService.UpdateSession(userData.id, auth_token);

      return reply.status(200).send({
        auth_token,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email
        }
      })
    } catch (error: any) {
      return reply.status(401).send({
        message: error.message || "Erro ao realizar login!"
      })
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { sub } = request.user as any;
      await this.authService.Logout(sub);
      return reply.status(200).send({ message: "Sessão encerrada!" });
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }
}

export { AuthController }