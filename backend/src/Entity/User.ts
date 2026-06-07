import type { Address } from "./Address.js";

class User {
  public name: string;
  public surname: string;
  public birthDate: Date;
  private cpf: string;
  public address: Address;

  constructor(name: string, surname: string, birthDate: Date, cpf: string, address: Address) {
    this.name = name;
    this.surname = surname;
    this.birthDate = birthDate;
    this.cpf = cpf;
    this.address = address;
  }

  getName(): string {
    return this.name;
  }

  getSurname(): string {
    return this.surname;
  }

  getBirthDate(): Date {
    return this.birthDate;
  }

  getBirthDateFormated(): string {
    const year = this.birthDate.getUTCFullYear();
    const month = String(this.birthDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(this.birthDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getCPF(): string {
    return this.cpf;
  }

  getAddress(): Address {
    return this.address;
  }

  getAddressData(): string {
    return this.address.toString();
  }

  setName(name: string): void {
    this.name = name;
  }

  setSurname(surname: string): void {
    this.surname = surname;
  }

  setBirthDate(birthDate: Date): void {
    this.birthDate = birthDate;
  }

  private setCPF(cpf: string): void {
    this.cpf = cpf;
  }

  private setAddress(address: Address): void {
    this.address = address;
  }

  toString(): string {
    return (
      `Nome: ${this.getName()}\n` +
      `Sobrenome: ${this.getSurname()}\n` +
      `CPF: ${this.getCPF()}\n` +
      `Data de nascimento: ${this.getBirthDateFormated()}\n` +
      `Endereço: ${this.getAddressData()}`
    );
  }
}

export { User };