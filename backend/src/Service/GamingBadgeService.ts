import { pool } from '../database/database.js';

export class GamingBadgeService {
  async unlockAchievement(accountNumber: string, achievementCode: string) {
    const achievementResult = await pool.query(
      `
      SELECT id
      FROM achievements
      WHERE code = $1
      `,
      [achievementCode]
    );

    if (achievementResult.rows.length === 0) {
      throw new Error('Conquista não encontrada.');
    }

    const achievementId = achievementResult.rows[0].id;

    const alreadyUnlocked = await pool.query(
      `
      SELECT id
      FROM account_achievements
      WHERE account_number = $1
      AND achievement_id = $2
      `,
      [accountNumber, achievementId]
    );

    if (alreadyUnlocked.rows.length > 0) {
      return {
        unlocked: false,
        message: 'Conquista já desbloqueada.',
      };
    }

    const result = await pool.query(
      `
      INSERT INTO account_achievements (
        account_number,
        achievement_id
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [accountNumber, achievementId]
    );

    return {
      unlocked: true,
      achievement: result.rows[0],
    };
  }

  async getAccountAchievements(accountNumber: string) {
    const result = await pool.query(
      `
      SELECT
        a.id,
        a.code,
        a.title,
        a.description,
        a.icon,
        aa.unlocked_at
      FROM account_achievements aa
      INNER JOIN achievements a
        ON a.id = aa.achievement_id
      WHERE aa.account_number = $1
      ORDER BY aa.unlocked_at DESC
      `,
      [accountNumber]
    );

    return result.rows;
  }

  async getAllAchievements(accountNumber: string) {
    const result = await pool.query(
      `
      SELECT
        a.id,
        a.code,
        a.title,
        a.description,
        a.icon,
        aa.unlocked_at,
        CASE
          WHEN aa.id IS NOT NULL THEN true
          ELSE false
        END AS unlocked
      FROM achievements a
      LEFT JOIN account_achievements aa
        ON aa.achievement_id = a.id
        AND aa.account_number = $1
      ORDER BY unlocked DESC, a.id ASC
      `,
      [accountNumber]
    );

    return result.rows;
  }
}