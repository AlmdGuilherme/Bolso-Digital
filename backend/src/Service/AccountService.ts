import argon2 from "argon2";
import type { Account } from "../Entity/Account.js";
import * as DBQuery from '../database/queries.js'
import type { UUIDTypes } from "uuid";
import type { UpdateUserDTO } from "../Interface/UpdateUserDTO.js";
import { supabase } from "../database/database.js";

class AccountService {
  async createUser(accountData: Account) {
    try {
      const addressData = {
        cep: accountData.user.address.getCep(),
        street: accountData.user.address.getStreet(),
        neighborhood: accountData.user.address.getNeighborhood(),
        city: accountData.user.address.getCity(),
        state: accountData.user.address.getState(),
        number: accountData.user.address.getNumber(),
        complement: accountData.user.address.getComplement()
      };

      const addressInsert = await DBQuery.ADDRESS_INTSERT(addressData);
      if (addressInsert.error) throw addressInsert.error;
      const addressId = addressInsert.data.id;

      const userData = {
        name: accountData.user.getName(),
        surname: accountData.user.getSurname(),
        birth_date: accountData.user.getBirthDateFormated(),
        cpf: accountData.user.getCPF(),
        address_id: addressId
      };

      const userInsert = await DBQuery.USER_INSERT(userData);
      if (userInsert.error) throw userInsert.error;
      const userId = userInsert.data.id;

      const hashedPassword = await argon2.hash(accountData.getPassword());
      const hashedPin = await argon2.hash(accountData.getPin());

      const accountPayload = {
        account_number: accountData.getAccountNumber(),
        email: accountData.getEmail(),
        password: hashedPassword,
        pin: hashedPin,
        phone: accountData.getPhone(),
        user_id: userId
      };

      const accountInsert = await DBQuery.ACCOUNT_INSERT(accountPayload);
      if (accountInsert.error) throw accountInsert.error;

      return { message: "Conta criada com sucesso!" };
    } catch (error) {
      throw error;
    }
  }

  async readUser(id: any) {
    const { data, error } = await DBQuery.GET_USER(+id);
    
    if (error || !data) {
      throw new Error("Usuário não encontrado!");
    }

    const accountData = Array.isArray(data.accounts) ? data.accounts[0] : data.accounts;

    return {
      name: data.name,
      surname: data.surname,
      cpf: data.cpf,
      email: accountData?.email
    };
  }

  async readUserAccount(id: any) {
    const { data, error } = await DBQuery.GET_USER_ACCOUNT(+id);

    if (error || !data) {
      throw new Error("Usuário não encontrado!");
    }

    const accountData = Array.isArray(data.accounts) ? data.accounts[0] : data.accounts;

    return {
      id: data.id,
      name: data.name,
      surname: data.surname,
      cpf: data.cpf,
      email: accountData?.email,
      balance: accountData?.balance,
      account_number: accountData?.account_number,
      phone: accountData?.phone
    };
  }

  async userData(id: UUIDTypes) {
    const { data, error } = await DBQuery.GET_USER_DATA(id as any);

    if (error || !data) {
      throw new Error("Usuário não encontrado!");
    }

    const accountData = Array.isArray(data.accounts) ? data.accounts[0] : data.accounts;

    return {
      id: data.id,
      name: data.name,
      surname: data.surname,
      cpf: data.cpf,
      email: accountData?.email,
      account_number: accountData?.account_number,
      balance: accountData?.balance,
      password: accountData?.password,
      pin: accountData?.pin,
      phone: accountData?.phone
    };
  }

  async updateUser(id: UUIDTypes, updateData: UpdateUserDTO) {
    const user = await this.userData(id);
    const userId = user.id;

    const emailToValide = updateData.email !== user.email ? updateData.email : undefined;
    const cpfToValidate = updateData.cpf !== user.cpf ? updateData.cpf : undefined;
    const phoneToValidate = updateData.phone !== user.phone ? updateData.phone : undefined;
    
    if (emailToValide || cpfToValidate || phoneToValidate) {
      await this.checkIfUserExists(emailToValide, cpfToValidate, phoneToValidate);
    }

    const finalName = updateData.name ?? user.name;
    const finalSurname = updateData.surname ?? user.surname;
    const finalCpf = updateData.cpf ?? user.cpf;
    const finalEmail = updateData.email ?? user.email;
    const finalPassword = updateData.password ? await argon2.hash(updateData.password) : user.password;
    const finalPin = updateData.pin ? await argon2.hash(updateData.pin) : user.pin;
    const finalPhone = updateData.phone ?? user.phone;

    try {
      const userUpdate = await DBQuery.UPDATE_USER_DATA(userId, { name: finalName, surname: finalSurname, cpf: finalCpf });
      if (userUpdate.error) throw userUpdate.error;

      const accountUpdate = await DBQuery.UPDATE_ACCOUNT_DATA(userId, { email: finalEmail, password: finalPassword, pin: finalPin, phone: finalPhone });
      if (accountUpdate.error) throw accountUpdate.error;

      return { message: "Conta actualizada com sucesso!" };
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: UUIDTypes) {
    try {
      const userDelete = await DBQuery.DELETE_USER(id as any);
      if (userDelete.error) throw userDelete.error;
      
      const addressId = userDelete.data?.address_id;
      if (addressId) {
        const addressDelete = await DBQuery.DELETE_ADDRESS(addressId);
        if (addressDelete.error) throw addressDelete.error;
      }

      return { message: "Dados do usuário deletados com sucesso!" };
    } catch (error) {
      throw error;
    }
  }

  async checkIfUserExists(email?: string, cpf?: string, phone?: string) {
    if (email) {
      const { data } = await DBQuery.VERIFY_EMAIL(email);
      if (data && data.length > 0) {
        throw new Error("Email já cadastrado!");
      }
    }

    if (cpf) {
      const { data } = await DBQuery.VERIFY_CPF(cpf);
      if (data && data.length > 0) {
        throw new Error("CPF já cadastrado!");
      }
    }

    if (phone) {
      const { data } = await DBQuery.VERIFY_PHONE(phone);
      if (data && data.length > 0) {
        throw new Error("Telefone já cadastrado!");
      }
    }
  }

  async updateUserPin(userId: string, pin: string) {
    const hashedPin = await argon2.hash(pin);

    const { error } = await supabase
      .from('accounts')
      .update({ pin: hashedPin })
      .eq('user_id', userId);

    if (error) throw error;

    return { message: "PIN atualizado com sucesso!" };
  }
}

export { AccountService };