import * as DBQuery from '../database/queries.js'
import argon2 from "argon2";

class AuthService {
  async Login(email: string, password?: string, pin?: string) {
    const { data, error } = await DBQuery.LOGIN_QUERY(email);
    
    if (error || !data) {
      throw new Error("Credenciais inválidas!");
    }

    const userData = Array.isArray(data.users) ? data.users[0] : data.users;

    if (password && await argon2.verify(data.password, password)) {
      return { 
        id: data.user_id, 
        email: data.email, 
        name: userData?.name, 
        account_number: (data as any).account_number 
      };
    }

    if (pin && await argon2.verify(data.pin, pin)) {
      return { 
        id: data.user_id, 
        email: data.email, 
        name: userData?.name, 
        account_number: (data as any).account_number 
      };
    }

    throw new Error("Credenciais inválidas!");
  }

  async UpdateSession(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    
    const { error } = await DBQuery.UPDATE_SESSION_QUERY(+userId, {
      refresh_token: token,
      token_expires_at: expiresAt.toISOString()
    });

    if (error) throw error;
  }

  async Logout(userId: string) {
    try {
      const { error } = await DBQuery.REMOVE_SESSION_QUERY(+userId);
      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error("Erro ao deslogar!");
    }
  }
}

export { AuthService };