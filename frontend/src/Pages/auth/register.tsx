import React, { useEffect, useReducer, useState } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth"
import { UserService } from "../../Service/UserService"

const CORES = {
  WHITE: "#FFFFFF",
  MIDNIGHT: "#161616",
  ORANGE: "#F34A23",
  O_SHADOW: "#C42500",
  O_LIGHT: "#fecfc19c"
}

const ACTIONS = {
  START: "start",
  SUCESS: "success",
  ERROR: "error",
  CLEAR_ERROR: "clear_error"
}

const initialState = {
  loading: false,
  data: null,
  error: null
}

function reducer(state: any, action: any) {
  switch (action.type) {
    case ACTIONS.START:
      return { ...state, loading: true, error: null }
    case ACTIONS.SUCESS:
      return { ...state, loading: false, data: action.payload, error: null }
    case ACTIONS.ERROR:
      return { ...state, loading: false, data: null, error: action.payload }
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }
    default:
      return state
  }
}

export default function Register({ navigation }: any) {
  const [page, setPage] = useState(1)
  const [userAddress, setUserAddress] = useState({ cep: "", street: "", neighborhood: "", city: "", state: "", complement: "", number: "" })
  const [userData, setUserData] = useState({ name: "", surname: "", cpf: "", birthDate: "" })
  const [accountData, setAccountData] = useState({ email: "", ddd: "", number: "", password: "", confirmPassword: "" })
  const [smsCode, setSMSCode] = useState("")
  const [seconds, setSeconds] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [confirmResult, setConfirmResult] = useState<any>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (page !== 4) return

    if (seconds <= 0) {
      setCanResend(true)
      return
    }

    const timer = setTimeout(() => setSeconds(prev => prev - 1), 1000)

    return () => clearTimeout(timer)
  }, [seconds, page])

  useEffect(() => {
    if (state.error) {
      Alert.alert("Ops! algo deu errado", state.error, [
        { text: "Entendido", onPress: () => dispatch({ type: ACTIONS.CLEAR_ERROR }) }
      ])
    }
  }, [state.error])

  const getPhoneNumber = () => {
    const ddd = accountData.ddd.replace(/\D/g, "")
    const number = accountData.number.replace(/\D/g, "")
    return `+55${ddd}${number}`
  }

  const handleAddressInputChange = (field: string, value: string) => {
    setUserAddress(prev => ({ ...prev, [field]: value }))
  }

  const handleUserDataInputChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const handleAccountDataInputChange = (field: string, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }))
  }

  const isAddressComplete =
    userAddress.cep.trim() !== "" &&
    userAddress.street.trim() !== "" &&
    userAddress.neighborhood.trim() !== "" &&
    userAddress.city.trim() !== "" &&
    userAddress.state.trim() !== "" &&
    userAddress.number.trim() !== ""

  const isUserDataComplete =
    userData.name.trim() !== "" &&
    userData.surname.trim() !== "" &&
    userData.cpf.trim() !== "" &&
    userData.birthDate.trim() !== ""

  const isAccountDataComplete =
    accountData.email.trim() !== "" &&
    accountData.ddd.trim() !== "" &&
    accountData.number.trim() !== "" &&
    accountData.password.trim() !== "" &&
    accountData.confirmPassword.trim() !== ""

  const isPasswordValid = accountData.password.trim().length >= 6 && accountData.password.trim().length <= 20
  const isPasswordsEquals = accountData.password.trim() === accountData.confirmPassword.trim()
  const isSMSCodeComplete = smsCode.trim().length === 6

  const isCurrentPageInvalid =
    state.loading ||
    (page === 1 && !isAddressComplete) ||
    (page === 2 && !isUserDataComplete) ||
    (page === 3 && (!isAccountDataComplete || !isPasswordValid || !isPasswordsEquals)) ||
    (page === 4 && !isSMSCodeComplete)

  const backButtonFunction = () => {
    if (page === 1) {
      navigation.navigate("Login")
      return
    }

    setPage(prev => prev - 1)
  }

  const SMSVerification = async () => {
    dispatch({ type: ACTIONS.START })

    try {
      const confirmation = await signInWithPhoneNumber(getAuth(), getPhoneNumber())

      setConfirmResult(confirmation)
      setSeconds(60)
      setCanResend(false)
      setSMSCode("")
      setPage(4)

      dispatch({ type: ACTIONS.SUCESS, payload: null })
    } catch (error: any) {
      dispatch({ type: ACTIONS.ERROR, payload: error.message || "Erro ao enviar SMS" })
    }
  }

  const handleResend = async () => {
    if (!canResend || state.loading) return

    dispatch({ type: ACTIONS.START })

    try {
      const confirmation = await signInWithPhoneNumber(getAuth(), getPhoneNumber())

      setConfirmResult(confirmation)
      setSeconds(60)
      setCanResend(false)
      setSMSCode("")

      dispatch({ type: ACTIONS.SUCESS, payload: null })
    } catch (error: any) {
      dispatch({ type: ACTIONS.ERROR, payload: error.message || "Erro ao reenviar SMS" })
    }
  }

  const handleSignUp = async () => {
    dispatch({ type: ACTIONS.START })

    try {
      if (!confirmResult) {
        throw new Error("Sessão expirada. Reenvie o SMS.")
      }

      const userCredential = await confirmResult.confirm(smsCode.trim())
      const [day, month, year] = userData.birthDate.split("/")
      const userService = new UserService()
      const phone = `${accountData.ddd.replace(/\D/g, "")}${accountData.number.replace(/\D/g, "")}`

      const fullData = {
        email: accountData.email.toLowerCase().trim(),
        password: accountData.password,
        phone,
        firebaseUid: userCredential.user.uid,
        user: {
          name: userData.name.trim(),
          surname: userData.surname.trim(),
          birthDate: `${year}-${month}-${day}`,
          cpf: userData.cpf.trim(),
          address: {
            ...userAddress,
            number: +userAddress.number || 0
          }
        }
      }

      const response = await userService.CreateUser(fullData)

      dispatch({ type: ACTIONS.SUCESS, payload: response })
      navigation.navigate("Login")
    } catch (error: any) {
      let errorMessage = error.message || "Erro ao criar conta"

      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Código SMS inválido. Verifique e tente novamente."
      }

      dispatch({ type: ACTIONS.ERROR, payload: errorMessage })
    }
  }

  const handleFormChange = () => {
    if (page === 1) setPage(2)
    else if (page === 2) setPage(3)
    else if (page === 3) SMSVerification()
    else if (page === 4) handleSignUp()
  }

  return (
    <View style={styles.top_container}>
      <View style={styles.middle_container}>
        <View style={styles.inside_container}>
          <View style={styles.button_wrapper}>
            <TouchableOpacity style={styles.back_button} onPress={backButtonFunction}>
              <MaterialCommunityIcons name="arrow-left" size={30} color={CORES.ORANGE} />
              <Text style={styles.back_button_text}> Voltar </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.container_header}>
            <Text style={styles.container_title}>Crie a sua conta</Text>
            <Text style={styles.container_description}>
              E faça parte do <Text style={{ color: CORES.ORANGE }}>Bolso Digital!</Text>
            </Text>
          </View>

          <View style={styles.register_form}>
            {page === 1 && (
              <>
                <View style={styles.input_field}>
                  <Text style={styles.label}>CEP:</Text>
                  <TextInput value={userAddress.cep} onChangeText={text => handleAddressInputChange("cep", text)} placeholder="12345-678" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                </View>

                <View style={styles.double_input_field}>
                  <View style={styles.short_input}>
                    <Text style={styles.label}>Rua:</Text>
                    <TextInput value={userAddress.street} onChangeText={text => handleAddressInputChange("street", text)} placeholder="Limoeiro" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>

                  <View style={styles.short_input}>
                    <Text style={styles.label}>Bairro:</Text>
                    <TextInput value={userAddress.neighborhood} onChangeText={text => handleAddressInputChange("neighborhood", text)} placeholder="Floradas" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>
                </View>

                <View style={styles.double_input_field}>
                  <View style={styles.medium_input}>
                    <Text style={styles.label}>Cidade:</Text>
                    <TextInput value={userAddress.city} onChangeText={text => handleAddressInputChange("city", text)} placeholder="São José do Rio Preto" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>

                  <View style={styles.shorter_input}>
                    <Text style={styles.label}>Estado:</Text>
                    <TextInput value={userAddress.state} onChangeText={text => handleAddressInputChange("state", text)} placeholder="RJ" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>
                </View>

                <View style={styles.double_input_field}>
                  <View style={styles.medium_input}>
                    <Text style={styles.label}>Complemento:</Text>
                    <TextInput value={userAddress.complement} onChangeText={text => handleAddressInputChange("complement", text)} style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>

                  <View style={styles.shorter_input}>
                    <Text style={styles.label}>Número:</Text>
                    <TextInput value={userAddress.number} onChangeText={text => handleAddressInputChange("number", text)} placeholder="999" style={styles.input} placeholderTextColor={CORES.O_SHADOW} keyboardType="numeric" />
                  </View>
                </View>
              </>
            )}

            {page === 2 && (
              <>
                <View style={styles.input_field}>
                  <Text style={styles.label}>Nome:</Text>
                  <TextInput value={userData.name} onChangeText={text => handleUserDataInputChange("name", text)} placeholder="Augusto" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                </View>

                <View style={styles.input_field}>
                  <Text style={styles.label}>Sobrenome:</Text>
                  <TextInput value={userData.surname} onChangeText={text => handleUserDataInputChange("surname", text)} placeholder="Henrico" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                </View>

                <View style={styles.double_input_field}>
                  <View style={styles.short_input}>
                    <Text style={styles.label}>CPF:</Text>
                    <TextInput value={userData.cpf} onChangeText={text => handleUserDataInputChange("cpf", text)} placeholder="111.111.111-11" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>

                  <View style={styles.short_input}>
                    <Text style={styles.label}>Nascimento:</Text>
                    <TextInput value={userData.birthDate} onChangeText={text => handleUserDataInputChange("birthDate", text)} placeholder="10/10/1990" style={styles.input} placeholderTextColor={CORES.O_SHADOW} />
                  </View>
                </View>
              </>
            )}

            {page === 3 && (
              <>
                <View style={styles.input_field}>
                  <Text style={styles.label}>Email:</Text>
                  <TextInput value={accountData.email} onChangeText={text => handleAccountDataInputChange("email", text)} placeholder="user@email.com" style={styles.input} placeholderTextColor={CORES.O_SHADOW} autoCapitalize="none" keyboardType="email-address" />
                </View>

                <View style={styles.double_input_field}>
                  <View style={styles.shorter_input}>
                    <Text style={styles.label}>DDD:</Text>
                    <TextInput value={accountData.ddd} onChangeText={text => handleAccountDataInputChange("ddd", text.replace(/\D/g, ""))} placeholder="12" style={styles.input} placeholderTextColor={CORES.O_SHADOW} keyboardType="numeric" maxLength={2} />
                  </View>

                  <View style={styles.medium_input}>
                    <Text style={styles.label}>Número:</Text>
                    <TextInput value={accountData.number} onChangeText={text => handleAccountDataInputChange("number", text.replace(/\D/g, ""))} placeholder="992091012" style={styles.input} placeholderTextColor={CORES.O_SHADOW} keyboardType="phone-pad" />
                  </View>
                </View>

                <View style={styles.input_field}>
                  <Text style={styles.label}>Senha:</Text>
                  <TextInput value={accountData.password} onChangeText={text => handleAccountDataInputChange("password", text)} placeholder="*********" style={styles.input} placeholderTextColor={CORES.O_SHADOW} secureTextEntry />
                </View>

                <View style={styles.input_field}>
                  <Text style={styles.label}>Confirme a senha:</Text>
                  <TextInput value={accountData.confirmPassword} onChangeText={text => handleAccountDataInputChange("confirmPassword", text)} style={styles.input} placeholderTextColor={CORES.O_SHADOW} secureTextEntry />
                </View>
              </>
            )}

            {page === 4 && (
              <View style={styles.input_field}>
                <Text style={styles.label}>Código SMS:</Text>
                <TextInput value={smsCode} onChangeText={text => setSMSCode(text.replace(/\D/g, ""))} style={styles.input} placeholderTextColor={CORES.O_SHADOW} keyboardType="numeric" maxLength={6} />
              </View>
            )}

            <TouchableOpacity style={[styles.next_button, isCurrentPageInvalid && { opacity: 0.5 }]} disabled={isCurrentPageInvalid} onPress={handleFormChange}>
              <Text style={styles.login_text}>
                {state.loading ? "Carregando..." : page === 1 || page === 2 ? "Próximo" : page === 3 ? "Enviar SMS" : "Criar Conta"}
              </Text>
            </TouchableOpacity>

            {page === 4 && (
              <View style={styles.resend_butotn}>
                <TouchableOpacity disabled={!canResend || state.loading} onPress={handleResend}>
                  <Text style={{ color: CORES.ORANGE, opacity: !canResend || state.loading ? 0.5 : 1 }}>
                    {canResend ? "Reenviar Código" : `Reenviar Código (${seconds}s)`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footer_text}>Já possui uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footer_link}>Faça login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  top_container: {
    flex: 1,
    backgroundColor: CORES.WHITE,
    justifyContent: "flex-start"
  },
  middle_container: {
    backgroundColor: CORES.ORANGE,
    height: "90%",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 50
  },
  inside_container: {
    backgroundColor: CORES.MIDNIGHT,
    width: "100%",
    height: "97%",
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 50,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10
  },
  container_header: {
    display: "flex",
    justifyContent: "center",
    gap: 0
  },
  container_title: {
    color: CORES.ORANGE,
    fontSize: 30,
    fontFamily: "Poppins_400Regular"
  },
  container_description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 18,
    letterSpacing: 1,
    color: CORES.WHITE
  },
  button_wrapper: {
    width: "75%",
    alignItems: "flex-start",
    marginBottom: 10,
    height: 30
  },
  back_button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  back_button_text: {
    color: CORES.ORANGE,
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
    marginLeft: 5
  },
  register_form: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  input_field: {
    display: "flex",
    width: "75%",
    marginBottom: 5
  },
  label: {
    color: CORES.WHITE,
    fontSize: 17
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: CORES.ORANGE,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 0,
    color: "#FFF"
  },
  double_input_field: {
    display: "flex",
    flexDirection: "row",
    width: "75%",
    alignItems: "center",
    justifyContent: "space-between"
  },
  short_input: {
    width: "48%",
    marginBottom: 0
  },
  medium_input: {
    width: "70%",
    marginBottom: 0
  },
  shorter_input: {
    width: "25%",
    marginBottom: 0
  },
  next_button: {
    backgroundColor: CORES.ORANGE,
    width: "50%",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    boxShadow: `0 7px 0 .5px ${CORES.O_SHADOW}`
  },
  login_text: {
    color: CORES.WHITE,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2
  },
  resend_butotn: {
    marginTop: 16,
    marginBottom: 20
  },
  footer: {
    marginTop: 10,
    alignItems: "center"
  },
  footer_text: {
    fontSize: 16,
    color: CORES.WHITE,
    fontWeight: "600"
  },
  footer_link: {
    fontSize: 16,
    color: CORES.ORANGE,
    fontWeight: "bold"
  }
})