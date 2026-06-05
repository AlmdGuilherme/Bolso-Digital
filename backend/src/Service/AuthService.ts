import { pool } from "../database/database.js"
import * as DBQuery from '../database/queries.js'
import argon2 from "argon2";

class AuthService {
  async Login(email: string, password?: string, pin?: string) {
    const account = await pool.query(DBQuery.LOGIN_QUERY, [email]);
    if (account.rows.length === 0) {
      throw new Error("Credenciais inválidas!");
    }
    const user = account.rows[0];

    if (password && await argon2.verify(user.password, password)) {
      return { id: user.user_id, email: user.email, name: user.name }
    }

    if (pin && await argon2.verify(user.pin, pin)) {
      return { id: user.user_id, email: user.email, name: user.name }
    }

    throw new Error("Credenciais inválidas!")
  }

  async UpdateSession(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    await pool.query(DBQuery.UPDATE_SESSION_QUERY, [token, expiresAt, userId]);
  }

  async Logout(userId: string) {
    try {
      await pool.query(DBQuery.REMOVE_SESSION_QUERY, [userId]);
      return true;
    } catch (error: any) {
      throw new Error("Erro ao deslogar!");
    }
  }
}

export { AuthService }