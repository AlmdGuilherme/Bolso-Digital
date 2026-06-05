import { NavigationContainer } from '@react-navigation/native'
import { AuthProvider } from './src/Context/AuthContext'
import { Poppins_400Regular, Poppins_500Medium, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins'
import React, { useEffect } from 'react'
import * as NavigationBar from 'expo-navigation-bar'
import { StatusBar } from 'expo-status-bar'
import Routes from './src/Routes/Routes'
import { LiteModeProvider } from './src/Context/LiteModeContext'
import { ThemeProvider, useTheme } from './src/Context/ThemeContext'

function AppContent() {
  const { isDark } = useTheme()

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} translucent />
      <NavigationContainer>
        <Routes />
      </NavigationContainer>
    </>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold
  })

  useEffect(() => {
    const setupNavigationBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync("hidden")
        await NavigationBar.setBehaviorAsync("sticky-immersive" as any)
      } catch (e) {
        console.warn(e)
      }
    }

    setupNavigationBar()
  }, [])

  if (!fontsLoaded) return null

  return (
    <ThemeProvider>
      <LiteModeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LiteModeProvider>
    </ThemeProvider>
  )
}