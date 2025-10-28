import { DataStore } from "@aws-amplify/datastore";
import { LeaderboardEntry, QuizStats } from "../models";

export interface LeaderboardEntryType {
  id: string;
  alias: string;
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  time: string;
  timestamp?: string;
}

export interface QuizStatsType {
  totalUsers: number;
  playedUsers: number;
  totalAttempts: number;
  averageScore: number;
  perfectScores: number;
  completionRate: number;
}

// Save quiz result to Amplify DataStore
export const saveQuizResult = async (result: {
  alias: string;
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  time: string;
}): Promise<boolean> => {
  try {
    console.log('💾 Saving quiz result to Amplify DataStore...', result);

    // Create new leaderboard entry
    const newEntry = await DataStore.save(
      new LeaderboardEntry({
        alias: result.alias,
        email: result.email,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        date: result.date,
        time: result.time,
        timestamp: new Date().toISOString()
      })
    );

    console.log('✅ Quiz result saved to DataStore!', newEntry);

    // Update stats
    await updateStats(result);

    return true;
  } catch (error) {
    console.error('❌ Error saving to DataStore:', error);
    return false;
  }
};

// Helper function to update stats
const updateStats = async (result: {
  score: number;
  percentage: number;
  email: string;
}) => {
  try {
    console.log('📊 Updating stats...');

    // Get existing stats (there should only be one record)
    const existingStats = await DataStore.query(QuizStats);
    
    if (existingStats.length > 0) {
      // Update existing stats
      const currentStats = existingStats[0];
      const newTotalAttempts = currentStats.totalAttempts + 1;
      const newAverageScore = ((currentStats.averageScore * currentStats.totalAttempts) + result.score) / newTotalAttempts;
      
      const updatedStats = await DataStore.save(
        QuizStats.copyOf(currentStats, updated => {
          updated.totalAttempts = newTotalAttempts;
          updated.playedUsers = currentStats.playedUsers + 1;
          updated.averageScore = parseFloat(newAverageScore.toFixed(2));
          updated.perfectScores = result.percentage === 100 ? currentStats.perfectScores + 1 : currentStats.perfectScores;
          updated.completionRate = parseFloat(((currentStats.playedUsers + 1) / (currentStats.totalUsers + 1) * 100).toFixed(2));
        })
      );
      
      console.log('✅ Stats updated:', updatedStats);
    } else {
      // Create initial stats
      const newStats = await DataStore.save(
        new QuizStats({
          totalUsers: 1,
          playedUsers: 1,
          totalAttempts: 1,
          averageScore: result.score,
          perfectScores: result.percentage === 100 ? 1 : 0,
          completionRate: 100.0
        })
      );
      
      console.log('✅ Initial stats created:', newStats);
    }
  } catch (error) {
    console.error('❌ Error updating stats:', error);
  }
};

// Get leaderboard from DataStore
export const getLeaderboard = async (limitCount: number = 10): Promise<LeaderboardEntryType[]> => {
  try {
    console.log('📊 Fetching leaderboard from DataStore...');

    const leaderboardEntries = await DataStore.query(LeaderboardEntry);
    
    // Sort by percentage (descending), then by timestamp (descending)
    const sortedLeaderboard = leaderboardEntries
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
      })
      .slice(0, limitCount);

    console.log('✅ Leaderboard fetched from DataStore:', sortedLeaderboard.length, 'entries');
    return sortedLeaderboard.map(entry => ({
      id: entry.id,
      alias: entry.alias,
      email: entry.email,
      score: entry.score,
      totalQuestions: entry.totalQuestions,
      percentage: entry.percentage,
      date: entry.date,
      time: entry.time,
      timestamp: entry.timestamp || entry.createdAt
    }));
  } catch (error) {
    console.error('❌ Error getting leaderboard from DataStore:', error);
    return [];
  }
};

// Get stats from DataStore
export const getStats = async (): Promise<QuizStatsType> => {
  try {
    console.log('📈 Fetching stats from DataStore...');

    const statsEntries = await DataStore.query(QuizStats);
    
    if (statsEntries.length > 0) {
      const stats = statsEntries[0]; // Should only be one stats record
      console.log('✅ Stats fetched from DataStore:', stats);
      return {
        totalUsers: stats.totalUsers,
        playedUsers: stats.playedUsers,
        totalAttempts: stats.totalAttempts,
        averageScore: stats.averageScore,
        perfectScores: stats.perfectScores,
        completionRate: stats.completionRate
      };
    }
    
    // Return default stats if none exist
    const defaultStats = {
      totalUsers: 0,
      playedUsers: 0,
      totalAttempts: 0,
      averageScore: 0,
      perfectScores: 0,
      completionRate: 0
    };

    console.log('📊 No stats found in DataStore, returning defaults');
    return defaultStats;
  } catch (error) {
    console.error('❌ Error getting stats from DataStore:', error);
    return {
      totalUsers: 0,
      playedUsers: 0,
      totalAttempts: 0,
      averageScore: 0,
      perfectScores: 0,
      completionRate: 0
    };
  }
};

// Check if user has already played
export const hasUserPlayed = async (email: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking if user has played:', email);

    const userEntries = await DataStore.query(LeaderboardEntry, c => c.email.eq(email));
    const hasPlayed = userEntries.length > 0;

    console.log('✅ User play status from DataStore:', hasPlayed);
    return hasPlayed;
  } catch (error) {
    console.error('❌ Error checking user play status in DataStore:', error);
    return false;
  }
};

// Get user's best score
export const getUserBestScore = async (email: string): Promise<LeaderboardEntryType | null> => {
  try {
    console.log('🏆 Getting user best score for:', email);

    const userEntries = await DataStore.query(LeaderboardEntry, c => c.email.eq(email));

    if (userEntries.length > 0) {
      // Sort by percentage (descending) then by timestamp (descending)
      const bestScore = userEntries.sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
      })[0];

      console.log('✅ User best score found in DataStore:', bestScore);
      return {
        id: bestScore.id,
        alias: bestScore.alias,
        email: bestScore.email,
        score: bestScore.score,
        totalQuestions: bestScore.totalQuestions,
        percentage: bestScore.percentage,
        date: bestScore.date,
        time: bestScore.time,
        timestamp: bestScore.timestamp || bestScore.createdAt
      };
    }

    console.log('📊 No scores found for user in DataStore');
    return null;
  } catch (error) {
    console.error('❌ Error getting user best score from DataStore:', error);
    return null;
  }
};

// Clear all data (for testing/admin purposes)
export const clearAllData = async (): Promise<boolean> => {
  try {
    console.log('🗑️ Clearing all data from DataStore...');

    // Delete all leaderboard entries
    const leaderboardEntries = await DataStore.query(LeaderboardEntry);
    await Promise.all(leaderboardEntries.map(entry => DataStore.delete(entry)));

    // Delete all stats
    const statsEntries = await DataStore.query(QuizStats);
    await Promise.all(statsEntries.map(stats => DataStore.delete(stats)));
    
    console.log('✅ All data cleared from DataStore');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data from DataStore:', error);
    return false;
  }
};

// Get all data for debugging
export const getAllData = async () => {
  try {
    console.log('🔍 Getting all data for debugging...');

    const leaderboardEntries = await DataStore.query(LeaderboardEntry);
    const statsEntries = await DataStore.query(QuizStats);
    
    const allData = {
      leaderboard: leaderboardEntries,
      stats: statsEntries
    };

    console.log('📊 All Data from DataStore:', allData);
    return allData;
  } catch (error) {
    console.error('❌ Error getting all data from DataStore:', error);
    return { leaderboard: [], stats: [] };
  }
};

export default {
  saveQuizResult,
  getLeaderboard,
  getStats,
  hasUserPlayed,
  getUserBestScore,
  clearAllData,
  getAllData
};
