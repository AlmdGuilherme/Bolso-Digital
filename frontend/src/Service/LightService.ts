import { SensorTypes, setUpdateIntervalForType, accelerometer } from "react-native-sensors";

setUpdateIntervalForType(SensorTypes.accelerometer, 1000)

export function startLightDetection(callback: (dark: boolean) => void) {
  const subscription = accelerometer.subscribe(({x, y, z}) => {
    const luminosity = Math.abs(x + y + z)

    if (luminosity < 1.5) {
      callback(true)
    } else {
      callback(false)
    }
  })

  return subscription
}