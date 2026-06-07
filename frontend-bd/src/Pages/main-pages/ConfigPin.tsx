import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AccountService } from '../../Service/AccountService';
import { AuthContext } from '../../Context/AuthContext';

export default function ConfigPin({ navigation }: any) {
  const [pin, setPin] = useState('');
  const minLength = 4;
  const maxLength = 6;

  const { user } = useContext(AuthContext);

  const handlePress = (num: string) => {
    if (pin.length < maxLength) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (pin.length >= minLength && pin.length <= maxLength) {
      try {
        const service = new AccountService();
        await service.UpdateAccountPin(user.id, pin);

        Alert.alert("Sucesso", "PIN configurado com sucesso!");
        navigation.goBack();
      } catch (error: any) {
        Alert.alert("Erro", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.back_button} 
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Crie seu PIN</Text>
      <Text style={styles.subtitle}>Digite de 4 a 6 dígitos para sua segurança.</Text>

      <View style={styles.dots_container}>
        {[...Array(maxLength)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              pin.length > i && styles.dot_active,
              i >= minLength && !pin.length && styles.dot_optional
            ]} 
          />
        ))}
      </View>

      <View style={styles.keyboard}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "back"].map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.key}
            onPress={() => item === "back" ? handleDelete() : (item !== "" && handlePress(item.toString()))}
          >
            {item === "back" ? (
              <MaterialCommunityIcons name="backspace-outline" size={28} color="#FFF" />
            ) : (
              <Text style={styles.key_text}>{item}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.save_button, pin.length < minLength && { opacity: 0.5 }]}
        disabled={pin.length < minLength}
        onPress={handleSave}
      >
        <Text style={styles.save_text}>Salvar PIN</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
    alignItems: 'center',
    paddingTop: 80,
  },
  back_button: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  dots_container: {
    flexDirection: 'row',
    marginBottom: 50,
    height: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F34A23',
    marginHorizontal: 8,
  },
  dot_active: {
    backgroundColor: '#F34A23',
  },
  dot_optional: {
    borderColor: '#444',
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '80%',
    justifyContent: 'center',
  },
  key: {
    width: '30%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  key_text: {
    color: '#FFF',
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
  },
  save_button: {
    backgroundColor: '#F34A23',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 30,
    marginTop: 40,
  },
  save_text: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  }
});