import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GamingBadgeService } from '../Service/GamingBadgeService';

const CORES = {
  WHITE: '#FFFFFF',
  MIDNIGHT: '#161616',
  ORANGE: '#F34A23',
  LIGHT_GRAY: '#F3F3F3',
  BORDER: '#E5E5E5',
  GREEN: '#1FA463',
  GRAY: '#999999',
};

type Achievement = {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  accountNumber?: string;
};

export function GamingBadgesModal({
  visible,
  onClose,
  accountNumber,
}: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  const gamingBadgeService = new GamingBadgeService();

  useEffect(() => {
    if (visible && accountNumber) {
      loadAchievements();
    }

    if (!visible) {
      setAchievements([]);
    }
  }, [visible, accountNumber]);

  const loadAchievements = async () => {
    try {
      if (!accountNumber) {
        Alert.alert('Erro', 'Conta não encontrada.');
        return;
      }

      setLoading(true);

      const data = await gamingBadgeService.getAllAchievements(accountNumber);
      setAchievements(data);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível buscar as conquistas.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('pt-BR');
  };

  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.overlay}>
        <View style={styles.modal_container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Conquistas e Badges</Text>

          <Text style={styles.description}>
            Acompanhe suas conquistas desbloqueadas no Bolso Digital.
          </Text>

          <View style={styles.progress_card}>
            <Text style={styles.progress_title}>Progresso</Text>

            <Text style={styles.progress_value}>
              {unlockedCount}/{achievements.length}
            </Text>

            <Text style={styles.progress_subtitle}>
              badges desbloqueadas
            </Text>
          </View>

          {loading ? (
            <View style={styles.loading_container}>
              <ActivityIndicator color={CORES.ORANGE} size="large" />
              <Text style={styles.loading_text}>Carregando conquistas...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {achievements.length === 0 ? (
                <View style={styles.empty_container}>
                  <Text style={styles.empty_title}>Nenhuma badge encontrada</Text>
                  <Text style={styles.empty_text}>
                    Cadastre ações no app para começar a desbloquear conquistas.
                  </Text>
                </View>
              ) : (
                achievements.map((achievement) => {
                  const unlocked = achievement.unlocked;

                  return (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievement_card,
                        !unlocked && styles.achievement_locked,
                      ]}
                    >
                      <View
                        style={[
                          styles.icon_container,
                          !unlocked && styles.icon_container_locked,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={achievement.icon as any}
                          size={34}
                          color={unlocked ? CORES.ORANGE : CORES.GRAY}
                        />
                      </View>

                      <View style={styles.achievement_info}>
                        <View style={styles.achievement_header}>
                          <Text
                            style={[
                              styles.achievement_title,
                              !unlocked && styles.locked_text,
                            ]}
                          >
                            {achievement.title}
                          </Text>

                          {unlocked ? (
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={22}
                              color={CORES.GREEN}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name="lock-outline"
                              size={22}
                              color={CORES.GRAY}
                            />
                          )}
                        </View>

                        <Text
                          style={[
                            styles.achievement_description,
                            !unlocked && styles.locked_text,
                          ]}
                        >
                          {achievement.description}
                        </Text>

                        {unlocked && achievement.unlocked_at ? (
                          <Text style={styles.unlocked_date}>
                            Desbloqueada em {formatDate(achievement.unlocked_at)}
                          </Text>
                        ) : (
                          <Text style={styles.locked_label}>
                            Ainda não desbloqueada
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.close_button} onPress={onClose}>
            <Text style={styles.close_button_text}>Voltar</Text>
          </TouchableOpacity>
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
    marginBottom: 14,
  },
  progress_card: {
    backgroundColor: '#FFF0EA',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  progress_title: {
    fontSize: 14,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
  },
  progress_value: {
    fontSize: 28,
    fontWeight: '800',
    color: CORES.ORANGE,
    marginTop: 4,
  },
  progress_subtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
  },
  loading_container: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading_text: {
    marginTop: 12,
    color: '#666',
    fontWeight: '600',
  },
  empty_container: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  empty_title: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.MIDNIGHT,
    marginBottom: 8,
    textAlign: 'center',
  },
  empty_text: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  achievement_card: {
    flexDirection: 'row',
    backgroundColor: CORES.LIGHT_GRAY,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CORES.BORDER,
    gap: 12,
  },
  achievement_locked: {
    opacity: 0.65,
  },
  icon_container: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFE8E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon_container_locked: {
    backgroundColor: '#E9E9E9',
  },
  achievement_info: {
    flex: 1,
  },
  achievement_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievement_title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: CORES.MIDNIGHT,
    marginRight: 8,
  },
  achievement_description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginTop: 4,
  },
  unlocked_date: {
    fontSize: 12,
    color: CORES.GREEN,
    fontWeight: '700',
    marginTop: 8,
  },
  locked_label: {
    fontSize: 12,
    color: CORES.GRAY,
    fontWeight: '700',
    marginTop: 8,
  },
  locked_text: {
    color: '#777',
  },
  close_button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  close_button_text: {
    color: CORES.MIDNIGHT,
    fontWeight: '700',
    fontSize: 15,
  },
});