import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { TransactionService } from '../Service/TransactionService';
import CurrencyInput from 'react-native-currency-input';
import { useLiteMode } from '../Context/LiteModeContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

type Envelope = {
  id: number;
  name: string;
  allocated_amount: number;
  current_amount: number;
};

type Category = {
  id: number;
  name: string;
};

type Subcategory = {
  id: number;
  name: string;
  category_id: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: {
    description: string;
    amount: number;
    category: string;
    subcategory: string;
    category_id: number;
    subcategory_id: number;
    envelope_id?: number | null;
    receiptUri?: string | null;
    latitude?: number;
    longitude?: number;
    location_name?: string;
  }) => void;
  envelopes: Envelope[];
  loading?: boolean;
};

export function CreateExpenseModal({
  visible,
  onClose,
  onCreate,
  envelopes,
  loading = false,
}: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | null>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { animationEnabled, syncInterval } = useLiteMode();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryService = new TransactionService();
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Erro ao carregar categorias');
      }
    };

    if (visible) {
      setDescription('');
      setAmount(0);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedEnvelope(null);
      setSubcategories([]);
      setReceiptUri(null);
      setUseLocation(false);
      setGettingLocation(false);
      loadCategories();
    }
  }, [visible, syncInterval]);

  const handleSelectCategory = async (category: Category) => {
    try {
      setSelectedCategory(category);
      setSelectedSubcategory(null);

      const categoryService = new TransactionService();
      const data = await categoryService.getSubcategoriesByCategory(category.id);
      setSubcategories(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar subcategorias');
    }
  };

  const isAvaibleToSend =
    description.trim().length > 0 &&
    (amount ?? 0) > 0 &&
    selectedCategory !== null &&
    selectedSubcategory !== null;

  const handlePickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para adicionar o recibo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleTakeReceiptPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita acesso à câmera para tirar foto do recibo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUri(null);
  };

  const getExpenseLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error('Permissão de localização negada.');
    }

    const location = await Location.getCurrentPositionAsync({});

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const address = addresses[0];

    const locationName = address
      ? [address.street, address.district, address.city, address.region]
          .filter(Boolean)
          .join(', ')
      : 'Localização atual';

    return {
      latitude,
      longitude,
      location_name: locationName,
    };
  };

  const handleCreate = async () => {
    const parsedAmount = amount ?? 0;

    if (!description.trim()) {
      Alert.alert('Erro', 'Informe a descrição.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Erro', 'Informe um valor válido.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria.');
      return;
    }

    if (!selectedSubcategory) {
      Alert.alert('Erro', 'Selecione uma subcategoria.');
      return;
    }

    try {
      setGettingLocation(true);

      let locationData = {};

      if (useLocation) {
        locationData = await getExpenseLocation();
      }

      onCreate({
        description: description.trim(),
        amount: parsedAmount,
        category: selectedCategory.name,
        subcategory: selectedSubcategory.name,
        category_id: selectedCategory.id,
        subcategory_id: selectedSubcategory.id,
        envelope_id: selectedEnvelope?.id ?? null,
        receiptUri,
        ...locationData,
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao obter localização.');
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationEnabled ? 'slide' : 'none'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Criar despesa</Text>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Mercado do mês"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Valor</Text>
            <CurrencyInput
              style={styles.input}
              value={amount ?? 0}
              onChangeValue={setAmount}
              prefix="R$ "
              delimiter="."
              separator=","
              precision={2}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Categoria</Text>
            <FlatList
              data={categories}
              horizontal
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.option_list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selectedCategory?.id === item.id;

                return (
                  <TouchableOpacity
                    style={[styles.option_card, isSelected && styles.option_card_selected]}
                    onPress={() => handleSelectCategory(item)}
                  >
                    <Text style={[styles.option_text, isSelected && styles.option_text_selected]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {selectedCategory && (
              <>
                <Text style={styles.label}>Subcategoria</Text>
                <FlatList
                  data={subcategories}
                  horizontal
                  keyExtractor={(item) => String(item.id)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.option_list}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isSelected = selectedSubcategory?.id === item.id;

                    return (
                      <TouchableOpacity
                        style={[styles.option_card, isSelected && styles.option_card_selected]}
                        onPress={() => setSelectedSubcategory(item)}
                      >
                        <Text style={[styles.option_text, isSelected && styles.option_text_selected]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            )}

            <Text style={styles.label}>Envelope (opcional)</Text>
            <FlatList
              data={envelopes}
              horizontal
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.option_list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selectedEnvelope?.id === item.id;

                return (
                  <TouchableOpacity
                    style={[styles.option_card, isSelected && styles.option_card_selected]}
                    onPress={() => setSelectedEnvelope(item)}
                  >
                    <Text style={[styles.option_text, isSelected && styles.option_text_selected]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.location_container}>
              <View style={styles.location_text_container}>
                <Text style={styles.location_title}>Usar localização</Text>
                <Text style={styles.location_description}>
                  Salva onde essa despesa foi feita para identificar padrões de gastos.
                </Text>
              </View>

              <Switch
                value={useLocation}
                onValueChange={setUseLocation}
                thumbColor={useLocation ? CORES.ORANGE : '#F4F3F4'}
                trackColor={{
                  false: '#D9D9D9',
                  true: '#FFC8B8',
                }}
              />
            </View>

            <Text style={styles.label}>Recibo digital (opcional)</Text>

            <View style={styles.receipt_actions}>
              <TouchableOpacity style={styles.receipt_button} onPress={handleTakeReceiptPhoto}>
                <Text style={styles.receipt_button_text}>Tirar foto</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.receipt_button} onPress={handlePickReceipt}>
                <Text style={styles.receipt_button_text}>
                  {receiptUri ? 'Trocar imagem' : 'Galeria'}
                </Text>
              </TouchableOpacity>
            </View>

            {receiptUri && (
              <View style={styles.receipt_preview_container}>
                <Image source={{ uri: receiptUri }} style={styles.receipt_preview} />

                <TouchableOpacity style={styles.remove_receipt_button} onPress={handleRemoveReceipt}>
                  <Text style={styles.remove_receipt_text}>Remover recibo</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel_button} onPress={onClose}>
                <Text style={styles.cancel_text}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirm_button,
                  (loading || gettingLocation || !isAvaibleToSend) && { opacity: 0.7 },
                ]}
                onPress={handleCreate}
                disabled={loading || gettingLocation || !isAvaibleToSend}
              >
                <Text style={styles.confirm_text}>
                  {loading || gettingLocation ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal_container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#161616',
    marginBottom: 10,
  },
  option_list: {
    gap: 10,
    paddingBottom: 8,
  },
  option_card: {
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    backgroundColor: CORES.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  option_card_selected: {
    backgroundColor: CORES.ORANGE,
  },
  option_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '600',
  },
  option_text_selected: {
    color: CORES.WHITE,
  },
  location_container: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    backgroundColor: CORES.LIGHT_GRAY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  location_text_container: {
    flex: 1,
  },
  location_title: {
    fontSize: 15,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 4,
  },
  location_description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
  receipt_actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  receipt_button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    backgroundColor: CORES.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receipt_button_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
    fontSize: 14,
  },
  receipt_preview_container: {
    marginBottom: 12,
  },
  receipt_preview: {
    width: '100%',
    height: 170,
    borderRadius: 16,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  remove_receipt_button: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFE8E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remove_receipt_text: {
    color: CORES.ORANGE,
    fontWeight: '700',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancel_button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirm_button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: CORES.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancel_text: {
    color: '#161616',
    fontWeight: '600',
    fontSize: 15,
  },
  confirm_text: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});