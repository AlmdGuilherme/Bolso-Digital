import React, { createContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

export const AuthContext = createContext({} as any)

export function AuthProvider({ children }: any) {
  const [userToken, setUserToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = await SecureStore.getItemAsync('auth_token')
    const userData = await SecureStore.getItemAsync('user_data')
    
    setUserToken(token)
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    setLoading(false)
  }

  const getLastUser = async () => {
    const res = await SecureStore.getItemAsync('last_user')
    return res ? JSON.parse(res) : null
  }

  const signIn = async (token: string, userData: any) => {
    const formattedUser = {
      ...userData,
      name: userData.name || userData.email?.split('@')[0] || 'Usuário'
    }

    await SecureStore.setItemAsync('auth_token', token)
    await SecureStore.setItemAsync('user_data', JSON.stringify(formattedUser))
    await SecureStore.setItemAsync('last_user', JSON.stringify(formattedUser))
    
    setUserToken(token)
    setUser(formattedUser)
  }

  const signOut = async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('user_data')
    setUserToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ userToken, user, signIn, signOut, loading, getLastUser }}>
      {children}
    </AuthContext.Provider>
  )
}