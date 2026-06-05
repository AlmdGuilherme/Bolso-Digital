import type { UUIDTypes } from "uuid";
import { User } from "./User.js";

class Account {
    private accountNumber: UUIDTypes;
    private balance: number;
    private email: string;
    private password: string;
    private pin?: string;
    private phone: string;
    public isActive: boolean;
    public user: User;
    private refreshToken?: string | null;
    private tokenExpiresAt?: Date | null;

  constructor(
    accountNumber: UUIDTypes, email: string, password: string, user: User,
    phone: string, pin?: string, refreshToken?: string, tokenExpiresAt?: Date) {
    this.accountNumber = accountNumber
    this.balance = 0;
    this.email = email;
    this.password = password
    this.isActive = true;
    this.user = user;
    this.phone = phone
    this.pin = pin ?? '';
    this.refreshToken =  refreshToken ?? null;
    this.tokenExpiresAt = tokenExpiresAt ?? null;
  }

  getAccountNumber(): UUIDTypes {
    return this.accountNumber;
  }

  private getBalance(): number {
    return this.balance;
  }

  getEmail(): string {
    return this.email;
  }

  getPassword(): string {
    return this.password;
  }

  getPin(): string {
    return this.pin ?? ''
  }

  getPhone(): string {
    return this.phone
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getUser(): User {
    return this.user
  }

  getUserData(): string {
    return this.user.toString();
  }

  protected deposit(value: number): void {
    if (value > 0) {
      this.balance += value
    } else {
      throw Error("O valor precisa ser maior que zero.")
    }
  }

  protected withdraw(value: number): void {
    if (value <= 0) {
      throw Error("Tentativa de saque negada - valor inválido!")
    } else if (value > this.balance) {
      throw Error("Tentativa de saque negada - saldo insuficiente!")
    } else {
      this.balance -= value
    }
  }
}

export { Account }