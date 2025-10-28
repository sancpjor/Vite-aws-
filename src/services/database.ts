// src/services/database.ts
export interface User {
  email: string;
  alias: string;
  hasPlayed: boolean;
  score: number | null;
  createdAt: string;
  updatedAt: string;
  lastPlayedAt: string | null;
}

export interface ScoreRecord {
  id: string;
  email: string;
  alias: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: string;
  date: string;
  time: string;
}

export interface UserCheckResult {
  exists: boolean;
  hasPlayed: boolean;
  user: User | null;
}

export interface QuizStats {
  totalUsers: number;
  playedUsers: number;
  totalAttempts: number;
  averageScore: number;
  perfectScores: number;
  completionRate: number;
}

class QuizDatabase {
  private USERS_KEY = 'quiz_users';
  private SCORES_KEY = 'quiz_scores';

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Initialize empty databases if they don't exist
    if (!localStorage.getItem(this.USERS_KEY)) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.SCORES_KEY)) {
      localStorage.setItem(this.SCORES_KEY, JSON.stringify([]));
    }
  }

  // Get all users
  getUsers(): Record<string, User> {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '{}');
    } catch (error) {
      console.error('Error getting users:', error);
      return {};
    }
  }

  // Get all scores
  getScores(): ScoreRecord[] {
    try {
      return JSON.parse(localStorage.getItem(this.SCORES_KEY) || '[]');
    } catch (error) {
      console.error('Error getting scores:', error);
      return [];
    }
  }

  // Save users
  private saveUsers(users: Record<string, User>): boolean {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  // Save scores
  private saveScores(scores: ScoreRecord[]): boolean {
    try {
      localStorage.setItem(this.SCORES_KEY, JSON.stringify(scores));
      return true;
    } catch (error) {
      console.error('Error saving scores:', error);
      return false;
    }
  }

  // Check if user exists and has played
  checkUser(email: string): UserCheckResult {
    const users = this.getUsers();
    const user = users[email];
    
    return {
      exists: !!user,
      hasPlayed: user ? user.hasPlayed : false,
      user: user || null
    };
  }

  // Create or update user
  saveUser(email: string, alias: string, hasPlayed: boolean = false, score: number | null = null): boolean {
    const users = this.getUsers();
    const timestamp = new Date().toISOString();
    
    users[email] = {
      email,
      alias,
      hasPlayed,
      score,
      createdAt: users[email]?.createdAt || timestamp,
      updatedAt: timestamp,
      lastPlayedAt: hasPlayed ? timestamp : users[email]?.lastPlayedAt || null
    };
    
    return this.saveUsers(users);
  }

  // Save quiz score
  saveQuizScore(email: string, alias: string, score: number, totalQuestions: number = 5): boolean {
    const timestamp = new Date().toISOString();
    
    // Update user record
    this.saveUser(email, alias, true, score);
    
    // Add to scores history
    const scores = this.getScores();
    const scoreRecord: ScoreRecord = {
      id: Date.now().toString(),
      email,
      alias,
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      timestamp,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    scores.push(scoreRecord);
    
    // Keep only last 100 scores to prevent storage bloat
    if (scores.length > 100) {
      scores.splice(0, scores.length - 100);
    }
    
    return this.saveScores(scores);
  }

  // Get leaderboard (top scores)
  getLeaderboard(limit: number = 10): ScoreRecord[] {
    const scores = this.getScores();
    
    // Sort by score (descending), then by timestamp (ascending for ties)
    const sortedScores = scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    return sortedScores.slice(0, limit);
  }

  // Get user's best score
  getUserBestScore(email: string): ScoreRecord | null {
    const scores = this.getScores();
    const userScores = scores.filter(score => score.email === email);
    
    if (userScores.length === 0) return null;
    
    return userScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  // Get quiz statistics
  getStats(): QuizStats {
    const users = this.getUsers();
    const scores = this.getScores();
    
    const totalUsers = Object.keys(users).length;
    const playedUsers = Object.values(users).filter(user => user.hasPlayed).length;
    const totalAttempts = scores.length;
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score.score, 0) / scores.length 
      : 0;
    
    const perfectScores = scores.filter(score => score.score === score.totalQuestions).length;
    
    return {
      totalUsers,
      playedUsers,
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      perfectScores,
      completionRate: totalUsers > 0 ? Math.round((playedUsers / totalUsers) * 100) : 0
    };
  }

  // Clear all data (for testing)
  clearDatabase(): boolean {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.SCORES_KEY);
    this.initializeDatabase();
    return true;
  }

  // Export data (for backup)
  exportData(): { users: Record<string, User>; scores: ScoreRecord[]; exportedAt: string } {
    return {
      users: this.getUsers(),
      scores: this.getScores(),
      exportedAt: new Date().toISOString()
    };
  }

  // Import data (for restore)
  importData(data: { users?: Record<string, User>; scores?: ScoreRecord[] }): boolean {
    try {
      if (data.users) this.saveUsers(data.users);
      if (data.scores) this.saveScores(data.scores);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Create singleton instance
const quizDB = new QuizDatabase();

export default quizDB;
