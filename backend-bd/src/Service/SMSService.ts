import twilio from 'twilio';
import argon2 from 'argon2';
import { pool } from '../database/database.js';
import * as DBQuery from '../database/queries.js';

export class SMSService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async saveAndSend(phoneNumber: string, code: string) {
    const hashedCode = await argon2.hash(code);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await pool.query(DBQuery.UPSERT_VERIFICATION, [phoneNumber, hashedCode, expiresAt]);

    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is not set')
    }

    await this.client.messages.create({
      body: `Bolso Digital: Seu código de verificação é ${code}`,
      from: fromNumber,
      to: `+55${phoneNumber}`
    });
  }

  async sendVerificationCode(phoneNumber: string) {
    const doesPhoneExists = await pool.query(DBQuery.DOES_PHONE_EXISTS, [phoneNumber])
    if (doesPhoneExists.rows.length > 0) {
      throw new Error("Este número já está vinculado a uma conta.");
    }
    const code = this.generateRandomCode();
    await this.saveAndSend(phoneNumber, code);
  }

  async resendVerificationCode(phoneNumber: string) {
    const code = this.generateRandomCode();
    await this.saveAndSend(phoneNumber, code);
  }

  async verifyCode(phoneNumber: string, codeToValidate: string) {
    const result = await pool.query(DBQuery.VERIFY_CODE, [phoneNumber]);
    if (result.rows.length === 0) {
      throw new Error("Código expirado ou inexistente!");
    }

    const hashedCode = result.rows[0].code;

    if (await argon2.verify(hashedCode, codeToValidate)) {
      await pool.query(DBQuery.DELETE_SMS_CODE, [phoneNumber]);
      return { message: "Código validado!", validated: true };
    }
    return { message: "Os códigos não coincidem!", validated: false };
  }
}