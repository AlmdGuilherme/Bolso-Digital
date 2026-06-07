import React, { useReducer } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (imageUri: string) => Promise<void>;
};

type State = {
  imageUri: string;
  loading: boolean;
  error: string;
};

const ACTIONS = {
  SET_IMAGE: 'set_image',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error',
  RESET: 'reset',
};

const initialState: State = {
  imageUri: '',
  loading: false,
  error: '',
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case ACTIONS.SET_IMAGE:
      return { ...state, imageUri: action.payload, error: '' };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.RESET:
      return initialState;
    default:
      return state;
  }
}

export function ReceiptModal({ visible, onClose, onConfirm }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleClose = () => {
    dispatch({ type: ACTIONS.RESET });
    onClose();
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar o recibo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      dispatch({
        type: ACTIONS.SET_IMAGE,
        payload: result.assets[0].uri,
      });
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar foto do recibo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      dispatch({
        type: ACTIONS.SET_IMAGE,
        payload: result.assets[0].uri,
      });
    }
  };

  const handleConfirm = async () => {
    if (!state.imageUri) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Selecione ou tire uma foto do recibo.',
      });
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      await onConfirm(state.imageUri);
      handleClose();
    } catch (error: any) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: error.message || 'Erro ao salvar recibo.',
      });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <View style={styles.overlay}>
        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll_content}>
            <Text style={styles.title}>Adicionar Recibo</Text>

            <Text style={styles.description}>
              Tire uma foto ou selecione uma imagem do recibo para associar a esta despesa.
            </Text>

            <View style={styles.preview_container}>
              {state.imageUri ? (
                <Image source={{ uri: state.imageUri }} style={styles.preview_image} />
              ) : (
                <Text style={styles.preview_text}>Nenhum recibo selecionado</Text>
              )}
            </View>

            {state.error ? <Text style={styles.error_text}>{state.error}</Text> : null}

            <TouchableOpacity style={styles.secondary_button} onPress={takePhoto}>
              <Text style={styles.secondary_text}>Tirar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondary_button} onPress={pickImage}>
              <Text style={styles.secondary_text}>Escolher da galeria</Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel_button} onPress={handleClose} disabled={state.loading}>
                <Text style={styles.cancel_text}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirm_button, (!state.imageUri || state.loading) && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={!state.imageUri || state.loading}
              >
                {state.loading ? (
                  <ActivityIndicator color={CORES.WHITE} />
                ) : (
                  <Text style={styles.confirm_text}>Salvar recibo</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: CORES.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  scroll_content: {
    paddingBottom: 4,
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
    color: CORES.MIDNIGHT,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 18,
  },
  preview_container: {
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    backgroundColor: CORES.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  preview_image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  preview_text: {
    color: '#777',
    fontSize: 14,
    fontWeight: '600',
  },
  error_text: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  secondary_button: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    backgroundColor: CORES.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondary_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    color: CORES.MIDNIGHT,
    fontWeight: '600',
    fontSize: 15,
  },
  confirm_text: {
    color: CORES.WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
});