import type { FastifyReply, FastifyRequest } from "fastify";
import { AccountService } from "../Service/AccountService.js";
import { Account } from "../Entity/Account.js";
import type { CreateUserDTO } from "../Interface/CreateUserDTO.js";
import { Address } from "../Entity/Address.js";
import { User } from "../Entity/User.js";
import { v4 as uuidv4, type UUIDTypes } from "uuid";
import type { UpdateUserDTO } from "../Interface/UpdateUserDTO.js";

class AccountController {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  async CreateUser(request: FastifyRequest, reply: FastifyReply) {
    const { email, password, pin, phone, user } = request.body as CreateUserDTO

    const addressData = new Address(
      user.address.cep, user.address.street, user.address.neighborhood,
      user.address.city, user.address.state, user.address.number, user.address.complement
    );

    const userBirthDate = new Date(user.birthDate)
    const userData = new User(
      user.name, user.surname, userBirthDate, user.cpf, addressData
    );

    const accountNumber = uuidv4();
    const accountData = new Account(
      accountNumber, email, password, userData, phone, pin
    )

    try {
      const createdUser = await this.accountService.createUser(accountData);
      return reply.status(201).send({
        message: createdUser.message
      })

    } catch (error: any) {
      console.error("🔥 ERRO INTERNO DO BACKEND:", error.stack);
      console.error("🔥 OBJETO BRUTO:", error);
      return reply.status(400).send({
        message: error.message || 'Erro ao cadastrar usuário!'
      })
    }
  }

  async ReadUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    try {
      const dbUser = await this.accountService.readUser(id as any)
      return reply.status(200).send({
        user: dbUser
      })

    } catch (error: any) {
      return reply.status(404).send({
        message: error.message || 'Usuário não encontrado!'
      })
    }
  }

  async ReadUserAccount(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    try {
      const accountDB = await this.accountService.readUserAccount(id as any)
      return reply.status(200).send({
        account: accountDB
      })
    } catch (error: any) {
      return reply.status(404).send({
        message: error.message || "Conta não encontrada!"
      })
    }
  }

  async UpdateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const updatedData = request.body as UpdateUserDTO
    try {
      const result = await this.accountService.updateUser(id as any, updatedData)
      return reply.status(200).send({
        message: result.message
      })
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao atualizar o usuário!"
      })
    }
  }

  async UpdatePin(request: FastifyRequest, reply: FastifyReply) {
    const { pin } = request.body as any
    const { id } = request.params as { id: string }

    await this.accountService.updateUserPin(id, pin)

    return reply.send({ message: "PIN atualizado com sucesso" })
  }

  async DeleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    try {
      const result = await this.accountService.deleteUser(id as any);
      return reply.status(200).send({
        message: result.message
      })
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao deletar usuário!"
      })
    }
  }
}

export { AccountController }