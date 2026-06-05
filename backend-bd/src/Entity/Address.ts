class Address {
  protected cep: string;
  protected street: string;
  protected neighborhood: string;
  protected city: string;
  protected state: string;
  protected number: number;
  protected complement?: string;

  constructor(cep: string, street: string, neighborhood: string, city: string, state: string, number: number, complement?: string,) {
    this.cep = cep;
    this.street = street;
    this.neighborhood = neighborhood;
    this.city = city;
    this.state = state;
    this.number = number
    this.complement =  complement ?? '';
  }

  getCep(): string {
    return this.cep;
  }

  getStreet(): string {
    return this.street;
  }

  getNeighborhood(): string{
    return this.neighborhood;
  }

  getCity(): string{
    return this.city;
  }

  getState(): string{
    return this.state;
  }

  getNumber(): number{
    return this.number;
  }

  getComplement(): string | undefined | null{
    return this.complement 
  }

  toString(): string{
    const comp = this.getComplement() ? `- ${this.getComplement()}` : ''
    return `Rua ${this.street}, ${this.number}${comp}, ${this.neighborhood} - ${this.state} | ${this.cep}`;
  }

}

export {Address}