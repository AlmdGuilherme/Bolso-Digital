import React, { createContext, useContext, useState } from "react";
import { DarkTheme, LightTheme } from "../theme/themes";

type ThemeType = typeof LightTheme

type ThemeContextType = {
  theme: ThemeType
  isDark: boolean
  setDarkMode: (value: boolean) => void
}

const ThemeContext = createContext({} as ThemeContextType)

export function ThemeProvider({ children }: any) {
  const [isDark, setIsDark] = useState(false)

  function setDarkMode(value: boolean) {
    setIsDark(value)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: isDark ? DarkTheme : LightTheme,
        isDark,
        setDarkMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}