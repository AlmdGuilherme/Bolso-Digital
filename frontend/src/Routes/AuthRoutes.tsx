import React from 'react';
import { createStackNavigator } from '@react-navigation/stack'
import Login from '../Pages/auth/login';
import Register from '../Pages/auth/register';

const Stack = createStackNavigator();

export default function AuthRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Login' component={Login} />
      <Stack.Screen name='Register' component={Register} />
    </Stack.Navigator>
  )
}