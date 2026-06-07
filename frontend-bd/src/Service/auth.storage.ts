import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = '@BolsoDigital:token';
const USER_KEY = '@BolsoDigital:user';

export async function saveAuthData(token: string, user: object) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getAuthData() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const user = await SecureStore.getItemAsync(USER_KEY);
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
}

export async function removeAuthData() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}