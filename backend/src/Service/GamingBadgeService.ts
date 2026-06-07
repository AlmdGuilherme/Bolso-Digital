import { supabase } from '../database/database.js';

export class GamingBadgeService {
  async unlockAchievement(accountNumber: string, achievementCode: string) {
    const { data: achievementResult, error: achError } = await supabase
      .from('achievements')
      .select('id')
      .eq('code', achievementCode);

    if (achError) throw achError;

    const achievement = achievementResult?.[0];

    if (!achievement) {
      throw new Error('Conquista não encontrada.');
    }

    const achievementId = achievement.id;

    const { data: alreadyUnlocked, error: checkError } = await supabase
      .from('account_achievements')
      .select('id')
      .eq('account_number', accountNumber)
      .eq('achievement_id', achievementId);

    if (checkError) throw checkError;
    if (alreadyUnlocked && alreadyUnlocked.length > 0) {
      return {
        unlocked: false,
        message: 'Conquista já desbloqueada.',
      };
    }

    const { data: result, error: insertError } = await supabase
      .from('account_achievements')
      .insert([{ account_number: accountNumber, achievement_id: achievementId }])
      .select('*');

    if (insertError) throw insertError;

    return {
      unlocked: true,
      achievement: result[0],
    };
  }

  async getAccountAchievements(accountNumber: string) {
    const { data, error } = await supabase
      .from('account_achievements')
      .select(`
        unlocked_at,
        achievements!inner (
          id,
          code,
          title,
          description,
          icon
        )
      `)
      .eq('account_number', accountNumber)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const ach = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
      return {
        id: ach?.id,
        code: ach?.code,
        title: ach?.title,
        description: ach?.description,
        icon: ach?.icon,
        unlocked_at: row.unlocked_at
      };
    });
  }

  async getAllAchievements(accountNumber: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select(`
        id,
        code,
        title,
        description,
        icon,
        account_achievements (
          id,
          unlocked_at,
          account_number
        )
      `)
      .order('id', { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map((ach: any) => {
      const aaList = Array.isArray(ach.account_achievements)
        ? ach.account_achievements
        : [ach.account_achievements].filter(Boolean);

      const userAchievement = aaList.find((aa: any) => aa.account_number === accountNumber);

      return {
        id: ach.id,
        code: ach.code,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        unlocked_at: userAchievement ? userAchievement.unlocked_at : null,
        unlocked: !!userAchievement
      };
    });

    return mapped.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  }
}