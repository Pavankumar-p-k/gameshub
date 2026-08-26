import { supabase } from './supabaseClient';

export interface LeaderboardEntry {
  id: string;
  user_id: string | null;
  player_name: string;
  game_slug: string;
  score: number;
  created_at: string;
}

export interface SubmitScorePayload {
  game_slug: string;
  score: number;
  player_name?: string;
}

/**
 * Submit a score to the leaderboard.
 * Works for both authenticated users and guests.
 * Only saves if the score is higher than the player's existing best.
 */
export async function submitScore(
  payload: SubmitScorePayload,
  userId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { game_slug, score, player_name } = payload;

    // Derive a display name
    let displayName = player_name ?? 'Anonymous';
    if (!player_name && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', userId)
        .single();
      if (profile) {
        displayName = profile.username ?? profile.email?.split('@')[0] ?? 'Player';
      }
    }

    if (userId) {
      // Check existing best for this user + game
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('id, score')
        .eq('user_id', userId)
        .eq('game_slug', game_slug)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && existing.score >= score) {
        // Not a new best — no update needed
        return { success: true };
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('leaderboard')
          .update({ score, player_name: displayName, created_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) return { success: false, error: error.message };
      } else {
        // Insert new record
        const { error } = await supabase.from('leaderboard').insert({
          user_id: userId,
          player_name: displayName,
          game_slug,
          score,
        });
        if (error) return { success: false, error: error.message };
      }
    } else {
      // Guest: just insert without dedup
      const { error } = await supabase.from('leaderboard').insert({
        user_id: null,
        player_name: displayName,
        game_slug,
        score,
      });
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Fetch top N scores for a specific game.
 */
export async function getTopScores(
  game_slug: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, user_id, player_name, game_slug, score, created_at')
      .eq('game_slug', game_slug)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getTopScores error:', error.message);
      return [];
    }
    return (data as LeaderboardEntry[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch global top scores across all games.
 */
export async function getGlobalTopScores(limit = 20): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, user_id, player_name, game_slug, score, created_at')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getGlobalTopScores error:', error.message);
      return [];
    }
    return (data as LeaderboardEntry[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch a user's personal best for each game.
 */
export async function getUserBests(
  userId: string
): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('game_slug, score')
      .eq('user_id', userId)
      .order('score', { ascending: false });

    if (error || !data) return {};

    const bests: Record<string, number> = {};
    for (const row of data) {
      if (!(row.game_slug in bests)) {
        bests[row.game_slug] = row.score;
      }
    }
    return bests;
  } catch {
    return {};
  }
}

/**
 * Get rank of a user for a specific game.
 */
export async function getUserRank(
  game_slug: string,
  userId: string
): Promise<number | null> {
  try {
    // Get user's best score
    const { data: userRow } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('user_id', userId)
      .eq('game_slug', game_slug)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!userRow) return null;

    // Count how many scores beat it
    const { count } = await supabase
      .from('leaderboard')
      .select('id', { count: 'exact', head: true })
      .eq('game_slug', game_slug)
      .gt('score', userRow.score);

    return (count ?? 0) + 1;
  } catch {
    return null;
  }
}
