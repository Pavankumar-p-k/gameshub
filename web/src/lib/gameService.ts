import { supabase } from './supabaseClient';

export interface GameProgress {
  gameName: string;
  score: number;
  level?: number;
  status?: 'playing' | 'completed' | 'paused';
  playTime?: number; // in seconds
  gameData?: Record<string, unknown>; // game-specific data
}

/**
 * Save or update game progress to the database
 * Supports both authenticated users and guest players
 */
export async function saveGameProgress(
  progress: GameProgress,
  userId?: string,
  guestId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If no userId or guestId provided, try to get current user
    let currentUserId = userId;
    if (!currentUserId && !guestId) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return { success: false, error: 'User not authenticated' };
      }
      currentUserId = data.user.id;
    }

    // Prepare game progress data
    const progressData = {
      user_id: currentUserId || null,
      guest_id: guestId || null,
      progress: {
        gameName: progress.gameName,
        score: progress.score,
        level: progress.level,
        status: progress.status,
        playTime: progress.playTime,
        gameData: progress.gameData,
        savedAt: new Date().toISOString(),
      },
    };

    // Insert or update game progress
    const { data, error } = await supabase
      .from('game_progress')
      .upsert(
        {
          user_id: progressData.user_id,
          guest_id: progressData.guest_id,
          progress: progressData.progress,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,guest_id',
        }
      )
      .select();

    if (error) {
      console.error('Failed to save game progress:', error);
      return { success: false, error: error.message };
    }

    console.log('Game progress saved:', data);
    return { success: true };
  } catch (e) {
    console.error('Error saving game progress:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get game progress for a user
 */
export async function getGameProgress(
  userId?: string,
  guestId?: string
): Promise<GameProgress | null> {
  try {
    let query = supabase.from('game_progress').select('progress');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (guestId) {
      query = query.eq('guest_id', guestId);
    } else {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        query = query.eq('user_id', data.user.id);
      } else {
        return null;
      }
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    return data.progress as GameProgress;
  } catch (e) {
    console.error('Error fetching game progress:', e);
    return null;
  }
}

/**
 * Increment game score
 */
export async function incrementGameScore(
  gameName: string,
  scoreIncrease: number,
  userId?: string,
  guestId?: string
): Promise<{ success: boolean; newScore?: number; error?: string }> {
  try {
    // Get current progress
    const currentProgress = await getGameProgress(userId, guestId);
    const currentScore = currentProgress?.score || 0;
    const newScore = currentScore + scoreIncrease;

    // Save updated progress
    const result = await saveGameProgress(
      {
        gameName,
        score: newScore,
        status: 'playing',
      },
      userId,
      guestId
    );

    if (result.success) {
      return { success: true, newScore };
    }
    return { success: false, error: result.error };
  } catch (e) {
    console.error('Error incrementing game score:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
