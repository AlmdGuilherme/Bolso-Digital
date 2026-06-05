import argon2 from "argon2";
import type { Account } from "../Entity/Account.js";
import { pool } from "../database/database.js";
import * as DBQuery from '../database/queries.js'
import { v4 as uuidv4, type UUIDTypes } from "uuid";
import type { UpdateUserDTO } from "../Interface/UpdateUserDTO.js";

class AccountService {
  async createUser(accountData: Account) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const addressValues = [
        accountData.user.address.getCep(),
        accountData.user.address.getStreet(),
        accountData.user.address.getNeighborhood(),
        accountData.user.address.getCity(),
        accountData.user.address.getState(),
        accountData.user.address.getNumber(),
        accountData.user.address.getComplement()
      ]

      const addressInsert = await client.query(DBQuery.ADDRESS_INTSERT, addressValues);
      const addressId = addressInsert.rows[0].id

      const userValues = [
        accountData.user.getName(),
        accountData.user.getSurname(),
        accountData.user.getBirthDateFormated(),
        accountData.user.getCPF(),
        addressId,
      ];

      const userInsert = await client.query(DBQuery.USER_INSERT, userValues);
      const userId = userInsert.rows[0].id

      const hashedPassword = await argon2.hash(accountData.getPassword());
      const hashedPin = await argon2.hash(accountData.getPin());
      const accoutValues = [
        accountData.getAccountNumber(),
        accountData.getEmail(),
        hashedPassword,
        hashedPin,
        accountData.getPhone(),
        userId
      ]

      await client.query(DBQuery.ACCOUNT_INSERT, accoutValues);
      await client.query("COMMIT")
      return { message: "Conta criada com sucesso!" }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release()
    }
  }

  async readUser(id: any) {
    const userData = await pool.query(DBQuery.GET_USER, [+id])
    if (userData.rows.length === 0) {
      throw new Error("Usuário não encontrado!")
    }

    const user = userData.rows[0];
    return {
      name: user.name,
      surname: user.surname,
      cpf: user.cpf,
      email: user.email
    }
  }

  async readUserAccount(id: any) {
    const userData = await pool.query(DBQuery.GET_USER_ACCOUNT, [+id])
    if (userData.rows.length === 0) {
      throw new Error("Usuário não encontrado!")
    }

    const user = userData.rows[0];
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      cpf: user.cpf,
      email: user.email,
      balance: user.balance,
      account_number: user.account_number,
      phone: user.phone
    }
  }

  async userData(id: UUIDTypes) {
    const userData = await pool.query(DBQuery.GET_USER_DATA, [id]);
    if (userData.rows.length === 0) {
      throw new Error("Usuário não encontrado!")
    }
    const user = userData.rows[0];
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      cpf: user.cpf,
      email: user.email,
      account_number: user.account_number,
      balance: user.balance,
      password: user.password,
      pin: user.pin,
      phone: user.phone
    }
  }

  async updateUser(id: UUIDTypes, updateData: UpdateUserDTO) {
    const user = await this.userData(id)
    const userId = user.id

    const emailToValide = updateData.email !== user.email ? updateData.email : undefined
    const cpfToValidate = updateData.cpf !== user.cpf ? updateData.cpf : undefined
    const phoneToValidate = updateData.phone !== user.phone ? updateData.phone : undefined
    if (emailToValide || cpfToValidate || phoneToValidate) {
      await this.checkIfUserExists(emailToValide, cpfToValidate, phoneToValidate)
    }

    const finalName = updateData.name ?? user.name
    const finalSurname = updateData.surname ?? user.surname
    const finalCpf = updateData.cpf ?? user.cpf
    const finalEmail = updateData.email ?? user.email
    const finalPassword = updateData.password ? await argon2.hash(updateData.password) : user.password
    const finalPin = updateData.pin ? await argon2.hash(updateData.pin) : user.pin
    const finalPhone = updateData.phone ?? user.phone

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      await client.query(DBQuery.UPDATE_USER_DATA, [finalName, finalSurname, finalCpf, userId])
      await client.query(DBQuery.UPDATE_ACCOUNT_DATA, [finalEmail, finalPassword, finalPin, finalPhone, userId])

      await client.query("COMMIT")
      return { message: "Conta atualizada com sucesso!" }
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async deleteUser(id: UUIDTypes) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN")

      const result = await client.query(DBQuery.DELETE_USER, [id])
      const addressId = result.rows[0]?.address_id
      if (addressId) await client.query(DBQuery.DELETE_ADDRESS, [addressId])
      await client.query("COMMIT")
      return { message: "Dados do usuário deletados com sucesso!" }
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release();
    }
  }

  async checkIfUserExists(email?: string, cpf?: string, phone?: string) {
    if (email) {
      const doesEmailExists = await pool.query(DBQuery.VERIFY_EMAIL, [email])
      if (doesEmailExists.rows.length > 0) {
        throw new Error("Email já cadastrado!")
      }
    }

    if (cpf) {
      const doesCPFExists = await pool.query(DBQuery.VERIFY_CPF, [cpf]);
      if (doesCPFExists.rows.length > 0) {
        throw new Error("CPF já cadastrado!")
      }
    }

    if (phone) {
      const doesPhoneExists = await pool.query(DBQuery.VERIFY_PHONE, [phone]);
      if (doesPhoneExists.rows.length > 0) {
        throw new Error("Telefone já cadastrado!")
      }
    }
  }

  async updateUserPin(userId: string, pin: string) {
    const hashedPin = await argon2.hash(pin)

    await pool.query(
      `UPDATE accounts SET pin = $1 WHERE user_id = $2`,
      [hashedPin, userId]
    )

    return { message: "PIN atualizado com sucesso!" }
  }

}

export { AccountService }