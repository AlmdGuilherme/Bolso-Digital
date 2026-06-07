import React, { useContext } from 'react'
import { AuthContext } from '../Context/AuthContext'
import AppRoutes from './AppRoutes'
import AuthRoutes from './AuthRoutes'

export default function Routes() {
  const { userToken, loading } = useContext(AuthContext)

  if (loading) return null

  return userToken ? <AppRoutes /> : <AuthRoutes />
}