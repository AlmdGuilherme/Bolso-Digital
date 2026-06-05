import React, { useReducer, useEffect, useState, useContext } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserService } from '../../Service/UserService'
import { AuthContext } from '../../Context/AuthContext'

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
}

const ACTIONS = {
  START: 'start',
  SUCCESS: 'success',
  ERROR: 'error'
}

const initialState = {
  loading: false,
  success: false,
  error: null
}

function reducer(state: any, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true }
    case ACTIONS.SUCCESS:
      return { ...state, loading: false, data: action.payload, error: null }
    case ACTIONS.ERROR:
      return { loading: false, data: null, error: action.payload }
    default:
      return state
  }
}

export default function Login({ navigation }: any) {
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setuserPassword] = useState('')
  const [lastUser, setLastUser] = useState<any>(null)
  const [isPinMode, setIsPinMode] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)

  const { signIn, getLastUser } = useContext(AuthContext)

  useEffect(() => {
    async function checkLastUser() {
      const savedUser = await getLastUser()
      if (savedUser && savedUser.id) {
        setLastUser(savedUser)
        setUserEmail(savedUser.email)

        const pinPreference = await AsyncStorage.getItem(`@bolso_digital:use_pin:${savedUser.id}`)

        if (pinPreference === 'true') {
          setPinEnabled(true)
          setIsPinMode(true)
        } else {
          setPinEnabled(false)
          setIsPinMode(false)
        }
      }
    }
    checkLastUser()
  }, [])

  const getInitials = (name: string) => {
    if (!name) return 'UBD'
    const names = name.trim().split(/\s+/)
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0].substring(0, 2).toUpperCase()
  }

  const isAbleToSignIn = userEmail.trim() !== '' && userPassword.trim() !== ''

  const handleSignIn = async () => {
    dispatch({ type: ACTIONS.START })
    try {
      const userService = new UserService()

      const response = await userService.Login(
        userEmail,
        isPinMode ? undefined : userPassword,
        isPinMode ? userPassword : undefined
      )

      const userData = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email
      }

      await signIn(response.auth_token, userData)
      dispatch({ type: ACTIONS.SUCCESS, payload: response })
    } catch (error: any) {
      dispatch({ type: ACTIONS.ERROR, payload: error.message })
    }
  }

  const toggleLoginMode = () => {
    if (!pinEnabled) return
    setIsPinMode(!isPinMode)
    setuserPassword('')
  }

  return (
    <View style={styles.top_container}>
      <View style={styles.middle_container}>
        <View style={styles.inside_container}>
          <View style={styles.user_icon}>
            <View style={styles.avatar}>
              <Text style={styles.abbreviation}>
                {lastUser ? getInitials(lastUser.name) : 'UBD'}
              </Text>
            </View>
            <Text style={styles.username}>
              {lastUser ? lastUser.name : 'Usuário do BD'}
            </Text>
          </View>

          <View style={styles.login_form}>
            <View style={styles.input_field}>
              <Text style={styles.label}>Email:</Text>
              <View style={styles.input_group}>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  value={userEmail}
                  onChangeText={setUserEmail}
                  autoCapitalize="none"
                />
                <MaterialCommunityIcons name="email-outline" size={24} color={CORES.ORANGE} />
              </View>
            </View>

            <View style={styles.input_field}>
              <Text style={styles.label}>{isPinMode ? 'PIN de Acesso:' : 'Senha:'}</Text>
              <View style={styles.input_group}>
                <TextInput
                  key={isPinMode ? 'pin' : 'password'}
                  style={styles.input}
                  placeholder={isPinMode ? "000000" : "******"}
                  secureTextEntry={true}
                  value={userPassword}
                  onChangeText={setuserPassword}
                  keyboardType={isPinMode ? "numeric" : "default"}
                  maxLength={isPinMode ? 6 : undefined}
                />
                <MaterialCommunityIcons
                  name={isPinMode ? "numeric" : "lock-outline"}
                  size={24}
                  color={CORES.ORANGE}
                />
              </View>

              <TouchableOpacity onPress={toggleLoginMode} disabled={!pinEnabled}>
                <Text style={[
                  styles.password_reset,
                  !pinEnabled && { opacity: 0.5 }
                ]}>
                  {isPinMode ? "Entrar com senha padrão" : "Entrar com PIN"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.login_button,
              !isAbleToSignIn && { opacity: .5 }
            ]}
            disabled={!isAbleToSignIn || state.loading}
            onPress={handleSignIn}
          >
            <Text style={styles.login_text}>
              {state.loading ? 'Carregando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {state.error && (
            <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
              {state.error}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.footer_text}>Não possui uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={state.loading}
            >
              <Text style={styles.footer_link}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  top_container: {
    flex: 1,
    backgroundColor: CORES.MIDNIGHT,
    justifyContent: 'flex-end'
  },
  middle_container: {
    backgroundColor: CORES.ORANGE,
    height: '85%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
  },
  inside_container: {
    backgroundColor: CORES.WHITE,
    width: '100%',
    height: '97%',
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    display: 'flex',
    alignItems: 'center'
  },
  user_icon: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: CORES.O_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CORES.O_SHADOW,
    marginTop: 35,
  },
  abbreviation: {
    fontSize: 30,
    fontWeight: 'bold',
    color: CORES.ORANGE
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: "#000",
  },
  login_form: {
    width: '100%',
    display: 'flex',
    alignItems: 'center'
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input_field: {
    width: '75%'
  },
  input_group: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.ORANGE,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  password_reset: {
    alignSelf: 'flex-start',
    color: CORES.ORANGE,
    fontWeight: '500',
    marginTop: -10,
    marginBottom: 30
  },
  login_button: {
    backgroundColor: CORES.ORANGE,
    width: '50%',
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    boxShadow: `0 7px 0 .5px ${CORES.O_SHADOW}`
  },
  login_text: {
    color: CORES.WHITE,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    marginTop: 15,
    alignItems: 'center',
  },
  footer_text: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  footer_link: {
    fontSize: 16,
    color: CORES.ORANGE,
    fontWeight: 'bold',
  }
});