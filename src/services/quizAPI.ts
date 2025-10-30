// src/services/quizAPI.ts - REEMPLAZAR TODO
export interface LeaderboardEntry {
  id: string;
  alias: string;
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  time: string;
}

export interface QuizStatsResponse {
  totalUsers: number;
  playedUsers: number;
  totalAttempts: number;
  averageScore: number;
  perfectScores: number;
  completionRate: number;
}

// Datos en memoria
let memoryLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    alias: 'johndoe',
    email: 'johndoe@amazon.com',
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    date: new Date().toLocaleDateString(),
    time: '14:30:25'
  }
];

let memoryStats: QuizStatsResponse = {
  totalUsers: 25,
  playedUsers: 18,
  totalAttempts: 42,
  averageScore: 3.6,
  perfectScores: 5,
  completionRate: 72
};

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  console.log('📊 Obteniendo leaderboard de memoria...');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const result = memoryLeaderboard.slice(0, limit);
  console.log('✅ Leaderboard obtenido de memoria:', result.length, 'entradas');
  return result;
};

export const getStats = async (): Promise<QuizStatsResponse> => {
  console.log('📈 Obteniendo estadísticas de memoria...');
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('✅ Estadísticas obtenidas de memoria:', memoryStats);
  return { ...memoryStats };
};

export const saveQuizResult = async (
  userEmail: string,
  userAlias: string,
  score: number,
  totalQuestions: number,
  answers: any[],
  categories: string[],
  timeSpent: number
): Promise<void> => {
  console.log('💾 Guardando resultado en memoria:', { userEmail, score });
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const percentage = Math.round((score / totalQuestions) * 100);
  const now = new Date();
  
  const newResult: LeaderboardEntry = {
    id: 'result-' + Date.now(),
    alias: userAlias,
    email: userEmail,
    score,
    totalQuestions,
    percentage,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString()
  };

  memoryLeaderboard.push(newResult);
  console.log('✅ Resultado guardado en memoria');
};

console.log('🎮 QuizAPI inicializado - Usando datos en memoria');
