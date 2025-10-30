import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Quiz from './components/Quiz';
import { getLeaderboard, getStats } from './services/quizAPI';

// Types
interface AuthContextType {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userAlias: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface LeaderboardEntry {
  id: string;
  alias: string;
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  time: string;
}

interface QuizStats {
  totalUsers: number;
  playedUsers: number;
  totalAttempts: number;
  averageScore: number;
  perfectScores: number;
  completionRate: number;
}

interface LoginFormData {
  email: string;
  password: string;
}

// Constants
const AMAZON_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@amazon\.(com|co\.uk|de|fr|es|it|ca|com\.au|co\.jp)$/;
const SESSION_STORAGE_KEY = 'quizSession';
const LEADERBOARD_REFRESH_INTERVAL = 30000; // 30 seconds

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility Functions
const getPlayerAvatar = (email: string, alias: string): string => {
  return `https://internal-cdn.amazon.com/badgephotos.amazon.com/?fullsizeimage=1&uid=${alias}`;
};

const extractAliasFromEmail = (email: string): string => {
  return email.split('@')[0];
};

const validateLoginForm = (email: string, password: string): string | null => {
  if (!email || !password) {
    return 'Por favor ingresa email y contraseña';
  }
  
  if (!AMAZON_EMAIL_REGEX.test(email)) {
    return 'Por favor usa tu email corporativo de Amazon (@amazon.com)';
  }
  
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  
  return null;
};

// Components
const LoadingSpinner: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => {
  const sizeMap = { small: '20px', medium: '40px', large: '60px' };
  
  return (
    <div style={{
      width: sizeMap[size],
      height: sizeMap[size],
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid #00F5A0',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto'
    }} />
  );
};

const FastAvatar: React.FC<{
  email: string;
  alias: string;
  isCurrentUser?: boolean;
  position?: number;
  size?: number;
}> = ({ email, alias, isCurrentUser = false, position = 0, size = 50 }) => {
  const [imgSrc, setImgSrc] = useState<string>(
    `https://ui-avatars.com/api/?name=${alias}&background=667eea&color=ffffff&size=${size}&font-size=0.6&bold=true`
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    const amazonSrc = getPlayerAvatar(email, alias);
    
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    img.onload = () => {
      clearTimeout(timeout);
      setImgSrc(amazonSrc);
      setIsLoading(false);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      setIsLoading(false);
    };

    img.src = amazonSrc;
    return () => clearTimeout(timeout);
  }, [email, alias]);

  const getBorderColor = () => {
    if (isCurrentUser) return '#00F5A0';
    if (position <= 3) return '#FFD700';
    return 'rgba(255, 255, 255, 0.3)';
  };

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `2px solid ${getBorderColor()}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      flexShrink: 0,
      background: 'rgba(255, 255, 255, 0.1)',
      position: 'relative'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}>
          <LoadingSpinner size="small" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={`${alias} avatar`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoading ? 0.3 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};

const LoginForm: React.FC<{
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    
    const validationError = validateLoginForm(formData.email, formData.password);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.2)',
          border: '1px solid rgba(255, 107, 107, 0.5)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#FF6B6B',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      )}
      
      <div className="input-group" style={{ marginBottom: '20px' }}>
        <label htmlFor="email" style={{ 
          display: 'block', 
          marginBottom: '8px', 
          color: '#00F5A0',
          fontWeight: '500'
        }}>
          Email corporativo:
        </label>
        <input 
          type="email" 
          id="email" 
          value={formData.email}
          onChange={handleInputChange('email')}
          placeholder="tu-usuario@amazon.com" 
          required 
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            opacity: isLoading ? 0.6 : 1
          }}
        />
      </div>
      
      <div className="input-group" style={{ marginBottom: '25px' }}>
        <label htmlFor="password" style={{ 
          display: 'block', 
          marginBottom: '8px', 
          color: '#00F5A0',
          fontWeight: '500'
        }}>
          Contraseña:
        </label>
        <input 
          type="password" 
          id="password" 
          value={formData.password}
          onChange={handleInputChange('password')}
          placeholder="••••••••" 
          required 
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            opacity: isLoading ? 0.6 : 1
          }}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: '10px',
          border: 'none',
          background: isLoading 
            ? 'rgba(102, 126, 234, 0.5)' 
            : 'linear-gradient(45deg, #00F5A0, #00D9F5)',
          color: isLoading ? 'rgba(255, 255, 255, 0.7)' : '#1a1a1a',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="small" />
            Iniciando sesión...
          </>
        ) : (
          '✅ Iniciar Sesión'
        )}
      </button>
    </form>
  );
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(40, 40, 40, 0.95))',
          padding: '30px',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '400px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          animation: 'slideIn 0.3s ease-out',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalUsers: 0,
    playedUsers: 0,
    totalAttempts: 0,
    averageScore: 0,
    perfectScores: 0,
    completionRate: 0
  });
  const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(true);
  const { isLoggedIn, userName, userEmail, login, logout, isLoading: authLoading } = useAuth();

  const loadRankingData = useCallback(async () => {
    try {
      setIsLoadingRanking(true);
      const [leaderboardData, statsData] = await Promise.all([
        getLeaderboard(10),
        getStats()
      ]);
      
      setLeaderboard(leaderboardData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading ranking data:', error);
    } finally {
      setIsLoadingRanking(false);
    }
  }, []);

  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  useEffect(() => {
    const interval = setInterval(loadRankingData, LEADERBOARD_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadRankingData]);

  const handleLogin = async (formData: LoginFormData): Promise<void> => {
    await login(formData.email, formData.password);
    setShowLoginModal(false);
    setTimeout(loadRankingData, 1000);
  };

  const handleQuizClick = (): void => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    }
  };

  const getRankingIcon = (position: number): string => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage === 100) return '#FFD700';
    if (percentage >= 80) return '#00F5A0';
    if (percentage >= 60) return '#00D9F5';
    if (percentage >= 40) return '#FFA500';
    return '#FF6B6B';
  };

  return (
    <div className="container">
      <header className="header">
        <div className="auth-section">
          {isLoggedIn ? (
            <div className="user-info-header">
              <FastAvatar
                email={userEmail}
                alias={userName}
                size={35}
              />
              <span>👋 Hola, {userName}</span>
              <button onClick={logout} className="btn-secondary">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)} 
              className="btn-secondary"
              disabled={authLoading}
            >
              {authLoading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          )}
        </div>
        
        {/* Logo AWS mejorado */}
        <div className="aws-header-logo"></div>
        
        <h1>🏆 ZAZ Football Quiz</h1>
        <p>Test your knowledge about Real Zaragoza and AWS!</p>
      </header>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ color: '#00F5A0', marginBottom: '10px', fontSize: '1.8rem' }}>
            🔐 Iniciar Sesión
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
            Inicia sesión para participar en el quiz
          </p>
        </div>
        
        <LoginForm onSubmit={handleLogin} isLoading={authLoading} />
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px'
        }}>
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0
          }}>
            ¿Problemas para acceder? Contacta IT Support
          </p>
        </div>
      </Modal>

      {/* Sección de clubes con logos CSS */}
      <section className="clubs-section">
        <div className="club-card">
          <div className="logo-zaragoza"></div>
          <h3>Real Zaragoza</h3>
          <p>Test your knowledge about the team</p>
        </div>
        
        <div className="club-card">
          <div className="logo-huesca"></div>
          <h3>SD Huesca</h3>
          <p>Learn about the local rival</p>
        </div>
      </section>

      <main className="main-content">
        <div className="competition-status">
          <h2>🎯 Quiz Challenge</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            <p><strong>Categories:</strong> Real Zaragoza, SD Huesca, AWS, Football World Cup, Aragon</p>
            <p><strong>Questions:</strong> 5 random questions per game</p>
            <p><strong>Time limit:</strong> 10 seconds per question</p>
          </div>
          <div className="countdown">
            {isLoggedIn ? '🎮 Ready to test your knowledge?' : '🔐 Please log in to play the quiz'}
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          {isLoggedIn ? (
            <Link to="/quiz" style={{ textDecoration: 'none' }}>
              <button className="btn">
                🎮 Play Quiz Now
              </button>
            </Link>
          ) : (
            <button onClick={handleQuizClick} className="btn">
              🔐 Login to Play Quiz
            </button>
          )}
          
          <p style={{ 
            marginTop: '20px', 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '1.1rem' 
          }}>
            {isLoggedIn 
              ? '✨ Challenge yourself with questions about football, AWS, and Aragon!' 
              : '🔐 Please log in to access the quiz'
            }
          </p>
        </div>

        {/* Quiz Statistics */}
        <div className="stats-section">
          <h2>📊 Quiz Statistics</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {[
              { value: stats.totalUsers, label: 'Total Users', color: '#00F5A0' },
              { value: stats.playedUsers, label: 'Played', color: '#00D9F5' },
              { value: stats.averageScore.toFixed(1), label: 'Avg Score', color: '#FFD700' },
              { value: stats.perfectScores, label: 'Perfect Scores', color: '#FF6B6B' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: `rgba(${stat.color === '#00F5A0' ? '0, 245, 160' : 
                                   stat.color === '#00D9F5' ? '0, 217, 245' : 
                                   stat.color === '#FFD700' ? '255, 215, 0' : '255, 107, 107'}, 0.2)`,
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                border: `1px solid rgba(${stat.color === '#00F5A0' ? '0, 245, 160' : 
                                           stat.color === '#00D9F5' ? '0, 217, 245' : 
                                           stat.color === '#FFD700' ? '255, 215, 0' : '255, 107, 107'}, 0.3)`
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: stat.color 
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking Section */}
        <section className="ranking-section">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2>🏆 Ranking - Top Players</h2>
            <button
              onClick={loadRankingData}
              disabled={isLoadingRanking}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 15px',
                color: 'white',
                cursor: isLoadingRanking ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                opacity: isLoadingRanking ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoadingRanking ? <LoadingSpinner size="small" /> : '🔄'} 
              Refresh
            </button>
          </div>

          {isLoadingRanking ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '15px' }}>Loading ranking...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🎯 No scores yet!</p>
              <p>Be the first to play and set a record!</p>
            </div>
          ) : (
            <div className="leaderboard">
              {leaderboard.map((entry, index) => {
                const position = index + 1;
                const isCurrentUser = isLoggedIn && entry.email === userEmail;
                
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '15px 20px',
                      margin: '8px 0',
                      background: isCurrentUser 
                        ? 'rgba(0, 245, 160, 0.2)' 
                        : position <= 3 
                          ? 'rgba(255, 215, 0, 0.15)' 
                          : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: isCurrentUser 
                        ? '2px solid rgba(0, 245, 160, 0.5)' 
                        : position <= 3 
                          ? '1px solid rgba(255, 215, 0, 0.3)' 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      transform: isCurrentUser ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}>
                        {getRankingIcon(position)}
                      </div>
                      
                      <FastAvatar
                        email={entry.email}
                        alias={entry.alias}
                        isCurrentUser={isCurrentUser}
                        position={position}
                      />
                      
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: isCurrentUser ? '#00F5A0' : 'white',
                          marginBottom: '2px'
                        }}>
                          #{position} {entry.alias}
                          {isCurrentUser && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '0.9rem',
                              background: 'rgba(0, 245, 160, 0.3)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              👤 You
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {entry.date} at {entry.time}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: getScoreColor(entry.percentage),
                        marginBottom: '2px'
                      }}>
                        {entry.score}/{entry.totalQuestions}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                        background: `rgba(${entry.percentage === 100 ? '255, 215, 0' : 
                                           entry.percentage >= 80 ? '0, 245, 160' : 
                                           entry.percentage >= 60 ? '0, 217, 245' : 
                                           entry.percentage >= 40 ? '255, 165, 0' : '255, 107, 107'}, 0.2)`,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: `1px solid rgba(${entry.percentage === 100 ? '255, 215, 0' : 
                                                  entry.percentage >= 80 ? '0, 245, 160' : 
                                                  entry.percentage >= 60 ? '0, 217, 245' : 
                                                  entry.percentage >= 40 ? '255, 165, 0' : '255, 107, 107'}, 0.3)`
                      }}>
                        {entry.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Showing top {leaderboard.length} players • Updated every 30 seconds
            </div>
          )}
        </section>
      </main>

      {/* Rules Section */}
      <section className="rules-section">
        <h2>📋 Quiz Rules</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '10px'
        }}>
          {[
            '🔐 You must be logged in to play the quiz',
            '🎲 5 random questions will be selected from different categories',
            '⏱️ You have 10 seconds to answer each question',
            '🚫 You cannot go back to previous questions',
            '⚠️ You can only attempt the quiz once',
            '🏆 Each correct answer gives you 1 point',
            '📊 Your final score will be displayed at the end',
            '🎯 Categories include: Real Zaragoza, SD Huesca, AWS, World Cup, and Aragon',
            '🏅 Your score will appear in the ranking if you\'re in the top 10'
          ].map((rule, index) => (
            <div key={index} style={{
              padding: '10px 15px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              {rule}
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 ZAZ Football Quiz | Test your knowledge about football, AWS, and Aragon</p>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Developed for football and tech enthusiasts
        </p>
      </footer>
    </div>
  );
};

// Auth Provider Component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAlias, setUserAlias] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        // Session expires after 24 hours
        if (hoursSinceLogin < 24) {
          setIsLoggedIn(true);
          setUserName(session.userName);
          setUserEmail(session.userEmail);
          setUserAlias(session.userAlias);
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would normally make an API call to authenticate
      // For now, we'll just validate the format
      const validationError = validateLoginForm(email, password);
      if (validationError) {
        throw new Error(validationError);
      }

      const alias = extractAliasFromEmail(email);
      const userName = alias;
      
      setUserEmail(email);
      setUserName(userName);
      setUserAlias(alias);
      setIsLoggedIn(true);
      
      // Save session
      const sessionData = {
        userName,
        userEmail: email,
        userAlias: alias,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    setUserAlias('');
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      userName, 
      userEmail, 
      userAlias, 
      login, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/quiz" 
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

// Add CSS animations
const styles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.club-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.btn:hover {
  transform: translateY(-2px);
}

input:focus {
  outline: none;
  border-color: #00F5A0 !important;
  box-shadow: 0 0 0 2px rgba(0, 245, 160, 0.2);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default App;
