// src/services/api.ts
import quizDB, { User } from './database';

export interface UserAttemptResult {
  canAttempt: boolean;
  attempts: number;
  hasPlayed: boolean;
  user: User | null;
}

export interface UpdateScoreResult {
  success: boolean;
  error?: string;
}

export interface CreateUserResult {
  success: boolean;
  error?: string;
}

export interface UserProfileResult {
  exists: boolean;
  user: User | null;
  hasPlayed: boolean;
}

export const checkUserAndAttempts = async (userId: string): Promise<UserAttemptResult> => {
  try {
    const result = quizDB.checkUser(userId);
    return {
      canAttempt: !result.hasPlayed,
      attempts: result.hasPlayed ? 1 : 0,
      hasPlayed: result.hasPlayed,
      user: result.user
    };
  } catch (error) {
    console.error('Error checking user attempts:', error);
    return { canAttempt: true, attempts: 0, hasPlayed: false, user: null };
  }
};

export const updateUserScore = async (userId: string, score: number): Promise<UpdateScoreResult> => {
  try {
    const alias = userId.split('@')[0]; // Extract alias from email
    const success = quizDB.saveQuizScore(userId, alias, score);
    return { success };
  } catch (error) {
    console.error('Error updating user score:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const createUser = async (userData: { email: string; alias: string }): Promise<CreateUserResult> => {
  try {
    const { email, alias } = userData;
    const success = quizDB.saveUser(email, alias, false, null);
    return { success };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfileResult> => {
  try {
    const result = quizDB.checkUser(userId);
    return {
      exists: result.exists,
      user: result.user,
      hasPlayed: result.hasPlayed
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { exists: false, user: null, hasPlayed: false };
  }
};
