import React, { useState, createContext, useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Quiz from './components/Quiz';
import { getLeaderboard, getStats } from './services/quizAPI';

// Create a context for user authentication
interface AuthContextType {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Define interfaces locally
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

// Amazon internal photo system
const getPlayerAvatar = (email: string, alias: string): string => {
  return `https://internal-cdn.amazon.com/badgephotos.amazon.com/?fullsizeimage=1&uid=${alias}`;
};

// Fast Avatar Component
const FastAvatar: React.FC<{
  email: string;
  alias: string;
  isCurrentUser?: boolean;
  position?: number;
}> = ({ email, alias, isCurrentUser = false, position = 0 }) => {
  const [imgSrc, setImgSrc] = useState<string>(
    `https://ui-avatars.com/api/?name=${alias}&background=667eea&color=ffffff&size=50&font-size=0.6&bold=true`
  );

  useEffect(() => {
    const img = new Image();
    const amazonSrc = getPlayerAvatar(email, alias);
    
    const timeout = setTimeout(() => {
      // Keep the fast backup image if Amazon photo takes too long
    }, 1000);

    img.onload = () => {
      clearTimeout(timeout);
      setImgSrc(amazonSrc);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      // Keep the backup image
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
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: `2px solid ${getBorderColor()}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      flexShrink: 0,
      background: 'rgba(255, 255, 255, 0.1)'
    }}>
      <img
        src={imgSrc}
        alt={`${alias} avatar`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
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
  const { isLoggedIn, userName, userEmail, login, logout } = useAuth();

  // Load leaderboard and stats when component mounts
  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
    try {
      setIsLoadingRanking(true);
      const [leaderboardData, statsData] = await Promise.all([
        getLeaderboard(10), // Get top 10
        getStats()
      ]);
      
      setLeaderboard(leaderboardData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading ranking data:', error);
    } finally {
      setIsLoadingRanking(false);
    }
  };

  // Refresh ranking data every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadRankingData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (email: string, _password: string): void => {
    console.log('Login attempt:', { email, password: _password });
    
    if (email && _password) {
      if (email.includes('@') && _password.length >= 1) {
        login(email, _password);
        setShowLoginModal(false);
        setTimeout(loadRankingData, 1000);
      } else {
        alert('❌ Please enter a valid email and password');
      }
    } else {
      alert('❌ Por favor ingresa email y contraseña');
    }
  };

  const handleQuizClick = (): void => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
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

  interface LoginFormProps {
    onSubmit: (email: string, password: string) => void;
  }

  const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      console.log('Form submitted:', { email, password });
      onSubmit(email, password);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email corporativo:</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              console.log('Email changed:', e.target.value);
              setEmail(e.target.value);
            }}
            placeholder="tu-usuario@amazon.com" 
            required 
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="password">Contraseña:</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              console.log('Password changed');
              setPassword(e.target.value);
            }}
            placeholder="••••••••" 
            required 
          />
        </div>
        
        <div className="login-options">
          <button type="submit" className="btn">
            ✅ Iniciar Sesión
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="container">
      <header className="header">
        <div className="auth-section">
          {isLoggedIn ? (
            <div className="user-info-header">
              <span>👋 Hola, {userName}</span>
              <button onClick={logout} className="btn-secondary">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                console.log('Login button clicked');
                setShowLoginModal(true);
              }} 
              className="btn-secondary"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
        
        <h1>🏆 ZAZ Football Quiz</h1>
        <p>Test your knowledge about Real Zaragoza and AWS!</p>
      </header>

      <section className="clubs-section">
        <div className="club-card zaragoza">
          <div className="club-logo">RZ</div>
          <h3>Real Zaragoza</h3>
          <p>Test your knowledge about the team</p>
        </div>
        <div className="club-card huesca">
          <div className="club-logo">SDH</div>
          <h3>SD Huesca</h3>
          <p>Learn about the local rival</p>
        </div>
      </section>

      <main className="main-content">
        <div className="competition-status status-active">
          <h2>🎯 Quiz Challenge</h2>
          <p><strong>Categories:</strong> Real Zaragoza, SD Huesca, AWS, Football World Cup, Aragon</p>
          <p><strong>Questions:</strong> 5 random questions per game</p>
          <p><strong>Time limit:</strong> 10 seconds per question</p>
          <div className="countdown">
            {isLoggedIn ? '🎮 Ready to test your knowledge?' : '🔐 Please log in to play the quiz'}
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div 
            className="modal" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowLoginModal(false);
              }
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span 
                className="close" 
                onClick={() => {
                  console.log('Close button clicked');
                  setShowLoginModal(false);
                }}
              >
                &times;
              </span>
              <div className="login-container">
                <h2>🔐 Iniciar Sesión</h2>
                <p>Inicia sesión para jugar el quiz</p>
                <LoginForm onSubmit={handleLogin} />
                <div className="login-help">
                  <p><small>¿Problemas para acceder? Contacta IT Support</small></p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="competition-info">
          <div className="info-card">
            <h3>⚽ Football</h3>
            <p>Questions about <strong>Real Zaragoza</strong></p>
            <p>SD Huesca and World Cup</p>
          </div>
          <div className="info-card">
            <h3>☁️ AWS</h3>
            <p>Test your <strong>cloud knowledge</strong></p>
            <p>Services and history</p>
          </div>
          <div className="info-card">
            <h3>🏛️ Aragon</h3>
            <p>Learn about the <strong>region</strong></p>
            <p>Culture and traditions</p>
          </div>
          <div className="info-card">
            <h3>🏆 Challenge</h3>
            <p><strong>5 random questions</strong></p>
            <p>One attempt only!</p>
          </div>
        </div>

        <div className="cta-section">
          {isLoggedIn ? (
            <Link to="/quiz" className="btn-link">
              <button className="btn quiz-btn" style={{
                background: 'linear-gradient(45deg, #00F5A0, #00D9F5)',
                border: 'none',
                borderRadius: '15px',
                padding: '20px 40px',
                fontSize: '1.4rem',
                fontWeight: '600',
                color: '#1a1a1a',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 8px 25px rgba(0, 245, 160, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'scale(1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 245, 160, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 245, 160, 0.3)';
              }}>
                🎮 Play Quiz Now
              </button>
            </Link>
          ) : (
            <button 
              onClick={handleQuizClick}
              className="btn quiz-btn" 
              style={{
                background: 'linear-gradient(45deg, #666, #999)',
                border: 'none',
                borderRadius: '15px',
                padding: '20px 40px',
                fontSize: '1.4rem',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease'
              }}>
              🔐 Login to Play Quiz
            </button>
          )}
          
          <p style={{ marginTop: '20px', color: '#666', fontSize: '1.1rem' }}>
            <small>
              {isLoggedIn 
                ? '✨ Challenge yourself with questions about football, AWS, and Aragon!' 
                : '🔐 Please log in to access the quiz'
              }
            </small>
          </p>
        </div>

        {/* Quiz Statistics */}
        <div className="stats-section" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          margin: '30px 0',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '20px', 
            color: '#00F5A0',
            fontSize: '1.8rem'
          }}>
            📊 Quiz Statistics
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'rgba(0, 245, 160, 0.2)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(0, 245, 160, 0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00F5A0' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Users</div>
            </div>
            
            <div style={{
              background: 'rgba(0, 217, 245, 0.2)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(0, 217, 245, 0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00D9F5' }}>
                {stats.playedUsers}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Played</div>
            </div>
            
            <div style={{
              background: 'rgba(255, 215, 0, 0.2)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFD700' }}>
                {stats.averageScore.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Avg Score</div>
            </div>
            
            <div style={{
              background: 'rgba(255, 107, 107, 0.2)',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF6B6B' }}>
                {stats.perfectScores}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Perfect Scores</div>
            </div>
          </div>
        </div>

        {/* Ranking Section with Fast Loading Avatars */}
        <section className="ranking-section" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          margin: '30px 0',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{ 
              color: '#00F5A0',
              fontSize: '1.8rem',
              margin: 0
            }}>
              🏆 Ranking - Top Players
            </h2>
            <button
              onClick={loadRankingData}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 15px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              🔄 Refresh
            </button>
          </div>

          {isLoadingRanking ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid #00F5A0',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px auto'
              }} />
              <p>Loading ranking...</p>
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
                      {/* Ranking Position */}
                      <div style={{
                        fontSize: '1.5rem',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}>
                        {getRankingIcon(position)}
                      </div>
                      
                      {/* Player Avatar - Using FastAvatar Component */}
                      <FastAvatar
                        email={entry.email}
                        alias={entry.alias}
                        isCurrentUser={isCurrentUser}
                        position={position}
                      />
                      
                      {/* Player Info */}
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: isCurrentUser ? '#00F5A0' : 'white',
                          marginBottom: '2px'
                        }}>
                          #{position} {entry.alias}
                          {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>👤 (You)</span>}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {entry.date} at {entry.time}
                        </div>
                      </div>
                    </div>

                    {/* Score Section */}
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
                        background: `rgba(${entry.percentage === 100 ? '255, 215, 0' : entry.percentage >= 80 ? '0, 245, 160' : entry.percentage >= 60 ? '0, 217, 245' : entry.percentage >= 40 ? '255, 165, 0' : '255, 107, 107'}, 0.2)`,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: `1px solid rgba(${entry.percentage === 100 ? '255, 215, 0' : entry.percentage >= 80 ? '0, 245, 160' : entry.percentage >= 60 ? '0, 217, 245' : entry.percentage >= 40 ? '255, 165, 0' : '255, 107, 107'}, 0.3)`
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
              Showing top {leaderboard.length} players • Updated automatically
            </div>
          )}
        </section>
      </main>

      <section className="rules-section">
        <h2>📋 Quiz Rules</h2>
        <ul className="rules-list">
          <li>🔐 You must be logged in to play the quiz</li>
          <li>🎲 5 random questions will be selected from different categories</li>
          <li>⏱️ You have 10 seconds to answer each question</li>
          <li>🚫 You cannot go back to previous questions</li>
          <li>⚠️ You can only attempt the quiz once</li>
          <li>🏆 Each correct answer gives you 1 point</li>
          <li>📊 Your final score will be displayed at the end</li>
          <li>🎯 Categories include: Real Zaragoza, SD Huesca, AWS, World Cup, and Aragon</li>
          <li>🏅 Your score will appear in the ranking if you're in the top 10</li>
        </ul>
      </section>

      <footer className="footer">
        <p>© 2025 ZAZ Football Quiz | Test your knowledge about football, AWS, and Aragon</p>
        <p><small>Developed for football and tech enthusiasts</small></p>
      </footer>
    </div>
  );
};

// Auth Provider Component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const login = (email: string, password: string) => {
    setUserEmail(email);
    setUserName(email.split('@')[0]);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    alert('👋 Sesión cerrada');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        {/* Video Background - Behind everything */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1 // Behind everything
          }}
          onLoadedData={() => console.log('Background video loaded!')}
        >
          <source src="/videos/background-video.mov" type="video/quicktime" />
          <source src="/videos/background-video.mp4" type="video/mp4" />
        </video>

        <div className="App" style={{
          minHeight: '100vh',
          position: 'relative',
          color: 'white',
          background: 'transparent' // IMPORTANT: Make this transparent
        }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};





export default App;
