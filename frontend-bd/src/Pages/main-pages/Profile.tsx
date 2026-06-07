import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../Context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile({ navigation }: any) {
  const { user, signOut, loading } = useContext(AuthContext);
  const [usePin, setUsePin] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPinPreference();
    }
  }, [user]);

  const loadPinPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(`@bolso_digital:use_pin:${user?.id}`);
      if (value !== null) {
        setUsePin(JSON.parse(value));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePinPreference = async (value: boolean) => {
    try {
      setUsePin(value);
      await AsyncStorage.setItem(`@bolso_digital:use_pin:${user?.id}`, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#F34A23" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar_container}>
          <MaterialCommunityIcons name="account" size={80} color="#F34A23" />
        </View>
        <Text style={styles.user_name}>{user?.name || "Usuário"}</Text>
        <Text style={styles.user_email}>{user?.email || "email@exemplo.com"}</Text>
      </View>

      <View style={styles.menu_section}>
        <TouchableOpacity 
          style={styles.menu_item}
          onPress={() => {
            if (user?.id) {
              navigation.navigate('ConfigPin', { userId: user.id });
            } else {
              Alert.alert("Erro", "ID do usuário não encontrado.");
            }
          }}
        >
          <View style={styles.menu_left}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#FFF" />
            <Text style={styles.menu_text}>Configurar PIN</Text>
          </View>
          <MaterialCommunityIcons name="pencil" size={20} color="#F34A23" />
        </TouchableOpacity>

        <View style={styles.menu_item}>
          <View style={styles.menu_left}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color="#FFF" />
            <Text style={styles.menu_text}>Entrar com PIN</Text>
          </View>
          <Switch
            trackColor={{ false: "#3e3e3e", true: "rgba(243, 74, 35, 0.4)" }}
            thumbColor={usePin ? "#F34A23" : "#f4f3f4"}
            onValueChange={togglePinPreference}
            value={usePin}
          />
        </View>

        <TouchableOpacity 
          style={[styles.menu_item, styles.logout_button]} 
          onPress={signOut}
        >
          <View style={styles.menu_left}>
            <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
            <Text style={[styles.menu_text, { color: '#F44336' }]}>Sair da conta</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
    paddingHorizontal: 25,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  avatar_container: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F34A23',
  },
  user_name: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  user_email: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  menu_section: {
    backgroundColor: '#1f1f1f',
    borderRadius: 20,
    padding: 10,
  },
  menu_item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  menu_left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menu_text: {
    color: '#FFF',
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  logout_button: {
    borderBottomWidth: 0,
    marginTop: 10,
  }
});