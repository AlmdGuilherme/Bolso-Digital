import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Home from '../Pages/dashboard/home';
import Profile from '../Pages/main-pages/Profile'
import ConfigPin from '../Pages/main-pages/ConfigPin'
import InvestmentPage from '../Pages/investment/investment';
import CryptoInvestment from '../Pages/investment/cryptoInvestment';
import Goals from '../Pages/goals/goals';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabRoutes() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F34A23',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_400Regular',
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Início"
        component={Home}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "home" : "home-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={Profile}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "account" : "account-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabRoutes} />
      <Stack.Screen name="ConfigPin" component={ConfigPin} />
      <Stack.Screen name="Investment" component={InvestmentPage} />
      <Stack.Screen name="CryptoInvestment" component={CryptoInvestment} />
      <Stack.Screen name="Goals" component={Goals} />
    </Stack.Navigator>
  );
}