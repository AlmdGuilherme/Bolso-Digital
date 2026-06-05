import React, { createContext, useContext, useEffect, useState } from "react";
import * as Battery from 'expo-battery';

type LiteModeContextType = {
  batteryLevel: number;
  isLiteMode: boolean;
  syncInterval: number;
  animationEnabled: boolean
}

const LiteModeContext = createContext<LiteModeContextType>({
  batteryLevel: 1,
  isLiteMode: false,
  syncInterval: 10000,
  animationEnabled: true
})

export function LiteModeProvider({ children }: { children: React.ReactNode }) {
  const [batteryLevel, setBatteryLevel] = useState(1)
  const lowPowerMode = Battery.useLowPowerMode();

  useEffect(() => {
    async function loadBattery() {
      const level = await Battery.getBatteryLevelAsync();

      if (level >= 0) {
        setBatteryLevel(level)
      }
    }

    loadBattery();
    const subscription = Battery.addBatteryLevelListener(({batteryLevel}) => {
      setBatteryLevel(batteryLevel)
    });

    return () => {
      subscription.remove();
    }
  }, [])

  const isLiteMode = batteryLevel <= 0.2 || lowPowerMode;
  const syncInterval = isLiteMode ?  6000 : 10000;
  const animationEnabled = !isLiteMode

  return (
    <LiteModeContext.Provider value={{batteryLevel, isLiteMode, syncInterval, animationEnabled}} >
      {children}
    </LiteModeContext.Provider>
  )
}

export function useLiteMode() {
  return useContext(LiteModeContext);
}