// App.tsx - SIN dependencias adicionales
import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Quiz from './components/Quiz';
import { getLeaderboard, getStats } from './services/quizAPI';

// Rutas de imágenes
const AWSLogo = '/images/Amazon_Web_Services_Logo.svg.png';
const RealZaragozaLogo = '/images/RealZaragoza.png';
const SDHuescaLogo = '/images/SDHuesca.png';
const ZAZClusterLogo = '/images/ZAZCluster.png';
const BackgroundImage = '/images/background.png';
const SponsorHuescaLogo = '/images/sponsorhuesca.png';
const SponsorZaragozaLogo = '/images/sponsorzaragoza.png';

// Types
interface AuthContextType {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userAlias: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
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
const LEADERBOARD_REFRESH_INTERVAL = 30000;

// Configuración de Cognito (obtener de amplify_outputs.json)
const getCognitoConfig = () => {
  try {
    // Intentar cargar la configuración de Amplify
    const outputs = require('./amplify_outputs.json');
    return {
      userPoolId: outputs.auth?.user_pool_id,
      clientId: outputs.auth?.user_pool_client_id,
      region: outputs.auth?.aws_region || 'us-east-1',
    };
  } catch (error) {
    console.warn('No se pudo cargar amplify_outputs.json, usando configuración por defecto');
    return {
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      clientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    };
  }
};

// Servicio de autenticación usando fetch directo
class CognitoAuthService {
  private config = getCognitoConfig();

  async signIn(email: string, password: string): Promise<any> {
    const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        ClientId: this.config.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    return response.json();
  }

  async signUp(email: string, password: string, username: string): Promise<any> {
    const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
      },
      body: JSON.stringify({
        ClientId: this.config.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'preferred_username',
            Value: username,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrarse');
    }

    return response.json();
  }

  async confirmSignUp(email: string, code: string): Promise<any> {
    const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
      },
      body: JSON.stringify({
        ClientId: this.config.clientId,
        Username: email,
        ConfirmationCode: code,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al confirmar registro');
    }

    return response.json();
  }
}

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
  
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
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

const ClubLogo: React.FC<{
  src: string;
  alt: string;
  fallbackColor: string;
  clubName: string;
}> = ({ src, alt, fallbackColor, clubName }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div style={{
        width: '100px',
        height: '100px',
        background: fallbackColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto',
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1a1a1a',
        border: `4px solid ${fallbackColor}`,
        boxShadow: `0 8px 25px ${fallbackColor}40`
      }}>
        {clubName.substring(0, 2)}
      </div>
    );
  }

  return (
    <div style={{
      width: '100px',
      height: '100px',
      margin: '0 auto 20px auto',
      borderRadius: '50%',
      overflow: 'hidden',
      border: `4px solid ${fallbackColor}`,
      background: 'white',
      padding: '8px',
      boxShadow: `0 8px 25px ${fallbackColor}40`,
      transition: 'all 0.3s ease'
    }}>
      <img 
        src={src}
        alt={alt}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          borderRadius: '50%'
        }}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

const LoginForm: React.FC<{
  onSubmit: (data: LoginFormData) => Promise<void>;
  onRegister: (data: LoginFormData & { username: string }) => Promise<void>;
  onConfirm: (email: string, code: string) => Promise<void>;
  isLoading: boolean;
}> = ({ onSubmit, onRegister, onConfirm, isLoading }) => {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [username, setUsername] = useState<string>('');
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'login' | 'register' | 'confirm'>('login');
  const [pendingEmail, setPendingEmail] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    
    try {
      if (mode === 'confirm') {
        await onConfirm(pendingEmail, confirmationCode);
      } else if (mode === 'register') {
        const validationError = validateLoginForm(formData.email, formData.password);
        if (validationError) {
          setError(validationError);
          return;
        }
        if (!username) {
          setError('Por favor ingresa tu nombre de usuario');
          return;
        }
        setPendingEmail(formData.email);
        await onRegister({ ...formData, username });
        setMode('confirm');
      } else {
        const validationError = validateLoginForm(formData.email, formData.password);
        if (validationError) {
          setError(validationError);
          return;
        }
        await onSubmit(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
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
      
      <div style={{
        background: 'rgba(0, 245, 160, 0.1)',
        border: '1px solid rgba(0, 245, 160, 0.3)',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#00F5A0', fontSize: '0.9rem', margin: 0 }}>
          🔒 Solo empleados de Amazon (@amazon.com)
        </p>
      </div>

      {mode === 'confirm' ? (
        <div className="input-group">
          <label htmlFor="code">Código de verificación:</label>
          <input 
            type="text" 
            id="code" 
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="123456" 
            required 
            disabled={isLoading}
          />
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '5px' }}>
            Revisa tu email: {pendingEmail}
          </p>
        </div>
      ) : (
        <>
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="username">Nombre de usuario:</label>
              <input 
                type="text" 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu-alias" 
                required 
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="email">Email corporativo:</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="tu-usuario@amazon.com" 
              required 
              disabled={isLoading}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Contraseña:</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="••••••••" 
              required 
              disabled={isLoading}
            />
          </div>
        </>
      )}
      
      <button type="submit" disabled={isLoading} className="btn">
        {isLoading ? (
          <>
            <LoadingSpinner size="small" />
            {mode === 'confirm' ? 'Verificando...' : mode === 'register' ? 'Registrando...' : 'Iniciando sesión...'}
          </>
        ) : (
          mode === 'confirm' ? '✅ Verificar Código' : mode === 'register' ? '📝 Registr****' : '✅ Iniciar Sesión'
        )}
      </button>

      {mode !== 'confirm' && (
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            type="button"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#00D9F5',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.9rem'
            }}
            disabled={isLoading}
          >
            {mode === 'register' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      )}
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
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        {children}
      </div>
    </div>
  );
};

// AuthProvider usando fetch directo
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAlias, setUserAlias] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const authService = new CognitoAuthService();

  // Verificar sesión existente al cargar
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    const savedSession = localStorage.getItem('cognitoSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        // Sesión válida por 8 horas
        if (hoursSinceLogin < 8) {
          setIsLoggedIn(true);
          setUserName(session.userName);
          setUserEmail(session.userEmail);
          setUserAlias(session.userAlias);
        } else {
          localStorage.removeItem('cognitoSession');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem('cognitoSession');
      }
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const result = await authService.signIn(email, password);
      
      if (result.AuthenticationResult) {
        const alias = extractAliasFromEmail(email);
        
        setIsLoggedIn(true);
        setUserEmail(email);
        setUserName(alias);
        setUserAlias(alias);
        
        // Guardar sesión
        const sessionData = {
          userName: alias,
          userEmail: email,
          userAlias: alias,
          loginTime: new Date().toISOString(),
          tokens: result.AuthenticationResult
        };
        localStorage.setItem('cognitoSession', JSON.stringify(sessionData));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      await authService.signUp(email, password, username);
      // El usuario necesitará confirmar su email
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Error al registr****');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      await authService.confirmSignUp(email, code);
      // Después de confirmar, hacer login automático sería ideal
      // pero requeriría guardar la contraseña temporalmente
    } catch (error: any) {
      console.error('Confirmation error:', error);
      throw new Error(error.message || 'Error al confirmar registro');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    setUserAlias('');
    localStorage.removeItem('cognitoSession');
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      userName, 
      userEmail, 
      userAlias, 
      login, 
      register,
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
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
  const { isLoggedIn, userName, userEmail, login, register, logout, isLoading: authLoading } = useAuth();

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

  const handleRegister = async (formData: LoginFormData & { username: string }): Promise<void> => {
    await register(formData.email, formData.password, formData.username);
    // No cerrar modal, esperar confirmación
  };

  const handleConfirm = async (email: string, code: string): Promise<void> => {
    const authService = new CognitoAuthService();
    await authService.confirmSignUp(email, code);
    setShowLoginModal(false);
    alert('¡Registro confirmado! Ahora puedes iniciar sesión.');
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
              <FastAvatar email={userEmail} alias={userName} size={35} />
              <span>👋 Hola, {userName}</span>
              <button onClick={logout} className="btn-secondary">Cerrar Sesión</button>
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
        
        {/* Logos principales con imágenes reales */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '30px',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          <img 
            src={AWSLogo} 
            alt="AWS Logo" 
            style={{ 
              height: '70px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0 6px 16px rgba(255,153,0,0.4))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))';
            }}
          />
          <img 
            src={ZAZClusterLogo} 
            alt="ZAZ Cluster" 
            style={{ 
              height: '90px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0 6px 16px rgba(0,245,160,0.4))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))';
            }}
          />
        </div>
        
        <h1>🏆 ZAZ Football Quiz</h1>
        <p>Test your knowledge about Real Zaragoza and AWS!</p>
      </header>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <div className="login-container">
          <h2>🔐 Acceso Amazon</h2>
          <p>Inicia sesión con tu cuenta de Amazon</p>
          <LoginForm 
            onSubmit={handleLogin} 
            onRegister={handleRegister}
            onConfirm={handleConfirm}
            isLoading={authLoading} 
          />
        </div>
      </Modal>

      {/* Sección de clubes con imágenes reales */}
      <section className="clubs-section">
        <div className="club-card zaragoza">
          <ClubLogo
            src={RealZaragozaLogo}
            alt="Real Zaragoza"
            fallbackColor="#0066cc"
            clubName="Real Zaragoza"
          />
          <h3 style={{ color: '#00F5A0' }}>Real Zaragoza</h3>
          <p>Test your knowledge about the team</p>
          
          {/* Sponsor logo */}
          <div style={{ marginTop: '20px' }}>
            <img 
              src={SponsorZaragozaLogo} 
              alt="Sponsor Zaragoza" 
              style={{ 
                height: '35px', 
                objectFit: 'contain',
                opacity: 0.9,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
          </div>
        </div>
        
        <div className="club-card huesca">
          <ClubLogo
            src={SDHuescaLogo}
            alt="SD Huesca"
            fallbackColor="#cc0000"
            clubName="SD Huesca"
          />
          <h3 style={{ color: '#FFD700' }}>SD Huesca</h3>
          <p>Learn about the local rival</p>
          
          {/* Sponsor logo */}
          <div style={{ marginTop: '20px' }}>
            <img 
              src={SponsorHuescaLogo} 
              alt="Sponsor Huesca" 
              style={{ 
                height: '35px', 
                objectFit: 'contain',
                opacity: 0.9,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
          </div>
        </div>
      </section>

      <main className="main-content">
        <div className="competition-status">
          <h2>🎯 Quiz Challenge</h2>
          <div className="competition-info">
            <div className="info-card">
              <h3>📚 Categories</h3>
              <p><strong>Topics:</strong> Real Zaragoza, SD Huesca, AWS, Football World Cup, Aragon</p>
            </div>
            <div className="info-card">
              <h3>❓ Questions</h3>
              <p><strong>Format:</strong> 5 random questions per game</p>
            </div>
            <div className="info-card">
              <h3>⏱️ Time Limit</h3>
              <p><strong>Duration:</strong> 10 seconds per question</p>
            </div>
          </div>
          <div className="countdown">
            {isLoggedIn ? '🎮 Ready to test your knowledge?' : '🔐 Please log in to play the quiz'}
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          {isLoggedIn ? (
            <Link to="/quiz" className="btn-link">
              <button className="btn">🎮 Play Quiz Now</button>
            </Link>
          ) : (
            <button onClick={handleQuizClick} className="btn">🔐 Login to Play Quiz</button>
          )}
          
          <p>
            {isLoggedIn 
              ? '✨ Challenge yourself with questions about football, AWS, and Aragon!' 
              : '🔐 Please log in to access the quiz'
            }
          </p>
        </div>

        {/* Quiz Statistics */}
        <div className="stats-section">
          <h2>📊 Quiz Statistics</h2>
          <div className="competition-info">
            <div className="info-card">
              <h3>👥 Total Users</h3>
              <p><strong>{stats.totalUsers}</strong></p>
            </div>
            <div className="info-card">
              <h3>🎮 Players</h3>
              <p><strong>{stats.playedUsers}</strong></p>
            </div>
            <div className="info-card">
              <h3>📈 Average Score</h3>
              <p><strong>{stats.averageScore.toFixed(1)}</strong></p>
            </div>
            <div className="info-card">
              <h3>🏆 Perfect Scores</h3>
              <p><strong>{stats.perfectScores}</strong></p>
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        <section className="ranking-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2>🏆 Ranking - Top Players</h2>
            <button onClick={loadRankingData} disabled={isLoadingRanking} className="btn-secondary">
              {isLoadingRanking ? <LoadingSpinner size="small" /> : '🔄'} Refresh
            </button>
          </div>

          {isLoadingRanking ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '15px' }}>Loading ranking...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.7)' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🎯 No scores yet!</p>
              <p>Be the first to play and set a record!</p>
            </div>
          ) : (
            <div className="leaderboard">
              {leaderboard.map((entry, index) => {
                const position = index + 1;
                const isCurrentUser = isLoggedIn && entry.email === userEmail;
                
                return (
                  <div key={entry.id} style={{
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
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ fontSize: '1.5rem', minWidth: '40px', textAlign: 'center' }}>
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
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
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
        <ul className="rules-list">
          <li>🔐 You must be logged in to play the quiz</li>
          <li>🎲 5 random questions will be selected from different categories</li>
          <li>⏱️ You have 10 seconds to answer each question</li>
          <li>🚫 You cannot go back to previous questions</li>
          <li>⚠️ You can only attempt the quiz once</li>
          <li>🏆 Each correct answer gives you 1 point</li>
          <li>📊 Your final score will be displayed at the end</li>
          <li>🎯 Categories include: Real Zaragoza, SD Huesca, AWS, World Cup, and Aragon</li>
          <li>🏅 Your score will appear in the ranking if you\'re in the top 10</li>
        </ul>
      </section>

      <footer className="footer">
        {/* Logos en el footer con imágenes reales */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '40px',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}>
          <img 
            src={AWSLogo} 
            alt="AWS" 
            style={{ 
              height: '45px', 
              objectFit: 'contain', 
              opacity: 0.8,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
          <img 
            src={RealZaragozaLogo} 
            alt="Real Zaragoza" 
            style={{ 
              height: '45px', 
              objectFit: 'contain', 
              opacity: 0.8,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
          <img 
            src={SDHuescaLogo} 
            alt="SD Huesca" 
            style={{ 
              height: '45px', 
              objectFit: 'contain', 
              opacity: 0.8,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        </div>
        
        <p>© 2025 ZAZ Football Quiz | Test your knowledge about football, AWS, and Aragon</p>
        <p>Developed for football and tech enthusiasts</p>
      </footer>
    </div>
  );
};

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
        <div 
          className="App"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${BackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
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

export default App;
