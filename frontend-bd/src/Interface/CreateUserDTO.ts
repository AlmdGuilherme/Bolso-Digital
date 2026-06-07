interface CreateUserDTO {
  email: string;
  password: string;
  pin?: string;
  phone: string;
  user: {
    name: string;
    surname: string;
    birthDate: string;
    cpf: string;
    address: {
      cep: string;
      street: string;
      neighborhood: string;
      city: string;
      state: string;
      number: number;
      complement?: string;
    }
  }
}

export type { CreateUserDTO }