import React, { useState, useEffect, useCallback } from 'react';
import { questions } from './QuestionData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { saveQuizResult, hasUserPlayed, getUserBestScore, getLeaderboard, getStats } from '../services/quizAPI';

const TIMER_SECONDS = 10;
const QUESTIONS_PER_QUIZ = 5;

const Quiz = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userName, userEmail, logout } = useAuth();
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showReadyScreen, setShowReadyScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [photoError, setPhotoError] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userBestScore, setUserBestScore] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if user is logged in when component mounts
  useEffect(() => {
    if (!isLoggedIn) {
      setError('Please log in to access the quiz.');
      return;
    }
    
    // If logged in, check user status
    checkUserStatus(userEmail);
  }, [isLoggedIn, userEmail]);

  // Updated checkUserStatus function using Amplify DataStore
  const checkUserStatus = async (email) => {
    try {
      setIsLoading(true);
      console.log('🔍 Checking user status for:', email);
      
      // Check if user has already played using Amplify DataStore
      const userHasPlayed = await hasUserPlayed(email);
      
      if (userHasPlayed) {
        console.log('❌ User has already played');
        // Get user's best score
        const bestScore = await getUserBestScore(email);
        setUserBestScore(bestScore);
        setHasAttempted(true);
        setUserExists(true);
        setPreviousScore(bestScore ? bestScore.score : 0);
      } else {
        console.log('✅ User can attempt quiz');
        setHasAttempted(false);
        setUserExists(false);
        setPreviousScore(0);
      }
      
      return {
        exists: userHasPlayed,
        user: userBestScore,
        hasPlayed: userHasPlayed
      };
    } catch (error) {
      console.error('❌ Error checking user status:', error);
      return { exists: false, user: null, hasPlayed: false };
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      width: '90%',
      maxWidth: '600px',
      margin: windowWidth < 768 ? '10px auto' : '40px auto',
      padding: windowWidth < 768 ? '20px' : '30px',
      color: 'white',
      position: 'relative'
    },
    button: {
      background: 'linear-gradient(45deg, #00F5A0, #00D9F5)',
      border: 'none',
      borderRadius: '15px',
      padding: windowWidth < 768 ? '12px 30px' : '15px 40px',
      fontSize: windowWidth < 768 ? '1.1rem' : '1.3rem',
      fontWeight: '600',
      color: '#1a1a1a',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
    },
    userPhoto: {
      width: windowWidth < 768 ? '80px' : '100px',
      height: windowWidth < 768 ? '80px' : '100px',
      borderRadius: '50%',
      border: '3px solid rgba(0, 245, 160, 0.8)',
      objectFit: 'cover',
      marginBottom: '20px'
    },
    avatarFallback: {
      width: windowWidth < 768 ? '80px' : '100px',
      height: windowWidth < 768 ? '80px' : '100px',
      borderRadius: '50%',
      border: '3px solid rgba(0, 245, 160, 0.8)',
      background: 'linear-gradient(135deg, #00F5A0, #00D9F5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: windowWidth < 768 ? '1.8rem' : '2.2rem',
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: '20px',
      margin: '0 auto 20px auto'
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getRandomQuestions = useCallback(() => {
    const shuffledQuestions = shuffleArray(questions);
    return shuffledQuestions.slice(0, QUESTIONS_PER_QUIZ);
  }, []);

  useEffect(() => {
    if (!quizStarted || showScore) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleNextQuestion(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quizStarted, showScore]);

  const handleNextQuestion = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < QUESTIONS_PER_QUIZ) {
      setCurrentQuestion(nextQuestion);
      setTimeLeft(TIMER_SECONDS);
    } else {
      setShowScore(true);
      saveQuizResults(isCorrect ? score + 1 : score);
    }
  };

  // Updated saveQuizResults function using Amplify DataStore
  const saveQuizResults = async (finalScore) => {
    try {
      setIsSubmitting(true);
      console.log('💾 Saving quiz results to Amplify DataStore:', { userEmail, finalScore });
      
      const quizEndTime = new Date();
      const totalTime = Math.round((quizEndTime.getTime() - quizStartTime.getTime()) / 1000);

      // Prepare quiz result data
      const quizResult = {
        alias: userName,
        email: userEmail,
        score: finalScore,
        totalQuestions: QUESTIONS_PER_QUIZ,
        percentage: (finalScore / QUESTIONS_PER_QUIZ) * 100,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };

      console.log('📊 Quiz result data:', quizResult);

      // Save to Amplify DataStore
      const saveSuccess = await saveQuizResult(quizResult);
      
      if (saveSuccess) {
        console.log('✅ Quiz result saved successfully to DataStore!');
        
        // Refresh leaderboard
        try {
          const newLeaderboard = await getLeaderboard();
          setLeaderboardData(newLeaderboard);
        } catch (leaderboardError) {
          console.warn('⚠️ Could not refresh leaderboard:', leaderboardError);
        }
      } else {
        throw new Error('Failed to save quiz result to DataStore');
      }
      
    } catch (error) {
      console.error('❌ Error saving quiz results:', error);
      setError(`⚠️ Could not save results: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQuiz = async () => {
    try {
      setIsLoading(true);
      
      // Re-check user status before starting
      const userStatus = await checkUserStatus(userEmail);
      
      if (userStatus.hasPlayed) {
        setError('You have already taken this quiz!');
        setShowReadyScreen(false);
        return;
      }
      
      const randomQuestions = getRandomQuestions();
      setQuizQuestions(randomQuestions);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setScore(0);
      setTimeLeft(TIMER_SECONDS);
      setShowReadyScreen(false);
      setQuizStartTime(new Date());
      
    } catch (error) {
      console.error('❌ Error starting quiz:', error);
      setError('Failed to start quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setQuizStarted(false);
    setShowReadyScreen(false);
    setTimeLeft(TIMER_SECONDS);
    setError('');
  };

  // Component to render user avatar with fallback
  const UserAvatar = ({ size = 100, className = '' }) => {
    const initials = userName ? userName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2) : 'U';
    
    if (photoError || !userName) {
      return (
        <div 
          style={{
            ...styles.avatarFallback,
            width: size,
            height: size,
            fontSize: size * 0.35
          }}
          className={className}
        >
          {initials}
        </div>
      );
    }

    const photoUrl = `https://internal-cdn.amazon.com/badgephotos.amazon.com/?fullsizeimage=1&uid=${userName}`;
    
    return (
      <img
        src={photoUrl}
        alt={`${userName}'s photo`}
        style={{
          ...styles.userPhoto,
          width: size,
          height: size
        }}
        className={className}
        onError={() => setPhotoError(true)}
      />
    );
  };

  // Back button component
  const BackButton = () => (
    <button 
      onClick={handleBackToHome}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        borderRadius: '10px',
        padding: '10px 15px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
    >
      ← Back to Home
    </button>
  );

  // Error Screen - updated to handle not logged in
  if (!isLoggedIn || error) {
    return (
      <div style={styles.container}>
        <BackButton />
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2 style={{ color: '#ff4444', marginBottom: '20px' }}>
            {!isLoggedIn ? '🔐 Access Denied' : '❌ Error'}
          </h2>
          <p style={{ marginBottom: '30px', fontSize: '1.1rem' }}>
            {!isLoggedIn ? 'Please log in to access the quiz.' : error}
          </p>
          <button
            onClick={handleBackToHome}
            style={styles.button}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (isLoading && !userName) {
    return (
      <div style={styles.container}>
        <BackButton />
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #00F5A0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto'
          }} />
          <h2>Loading your profile...</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Checking quiz status with Amplify DataStore...
          </p>
        </div>
      </div>
    );
  }

  // Ready Screen
  if (showReadyScreen) {
    return (
      <div style={styles.container}>
        <BackButton />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
          marginTop: '40px'
        }}>
          <UserAvatar size={windowWidth < 768 ? 80 : 100} />
          
          <h2 style={{
            color: '#00F5A0',
            textAlign: 'center',
            fontSize: windowWidth < 768 ? '1.8rem' : '2.5rem',
            fontWeight: '700',
            textShadow: '2px 2px 4px rgba(0, 217, 245, 0.5)',
            marginBottom: '10px'
          }}>
            {userName}
          </h2>
          
          <h3 style={{
            color: 'white',
            textAlign: 'center',
            fontSize: windowWidth < 768 ? '1.3rem' : '1.8rem',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            Are you ready to play?
          </h3>
          
          {hasAttempted && (
            <div style={{
              textAlign: 'center',
              color: '#ff4444',
              fontSize: windowWidth < 768 ? '1rem' : '1.2rem',
              maxWidth: '400px',
              padding: '20px',
              background: 'rgba(255, 68, 68, 0.2)',
              borderRadius: '15px',
              border: '1px solid rgba(255, 68, 68, 0.3)'
            }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                ⚠️ You have already played!
              </p>
              {userBestScore && (
                <div>
                  <p>Your previous score: {userBestScore.score}/{userBestScore.totalQuestions}</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    {userBestScore.percentage.toFixed(1)}% - {userBestScore.date} at {userBestScore.time}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {!hasAttempted && (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: windowWidth < 768 ? '1rem' : '1.1rem',
              maxWidth: '450px',
              padding: '25px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#00D9F5' }}>
                📋 Quick Rules:
              </p>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                textAlign: 'left',
                lineHeight: '1.6'
              }}>
                <li>• {TIMER_SECONDS} seconds per question</li>
                <li>• {QUESTIONS_PER_QUIZ} random questions</li>
                <li>• <strong style={{ color: '#ff4444' }}>You can only try once!</strong></li>
              </ul>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setShowReadyScreen(false)}
              style={{
                ...styles.button,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: windowWidth < 768 ? '1rem' : '1.2rem'
              }}
              disabled={isLoading}
            >
              ❌ No
            </button>
            <button
              onClick={startQuiz}
              style={{
                ...styles.button,
                fontSize: windowWidth < 768 ? '1rem' : '1.2rem',
                opacity: hasAttempted ? 0.5 : 1,
                cursor: hasAttempted ? 'not-allowed' : 'pointer'
              }}
              disabled={isLoading || hasAttempted}
            >
              {isLoading ? 'Starting...' : '✅ Yes!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (!quizStarted) {
    return (
      <div style={styles.container}>
        <BackButton />
        <div style={{ marginTop: '40px' }}>
          <h1 style={{
            textAlign: 'center',
            fontSize: windowWidth < 768 ? '2rem' : '2.5rem',
            marginBottom: '20px',
            color: '#00F5A0',
            fontWeight: '700',
            textShadow: '2px 2px 4px rgba(0, 217, 245, 0.5)'
          }}>
            🏆 Real Zaragoza Quiz
          </h1>
          
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <p style={{
              fontSize: windowWidth < 768 ? '1.1rem' : '1.3rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '20px'
            }}>
              Test your knowledge about Real Zaragoza, AWS, and more!
            </p>
            
            {userName && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '20px'
              }}>
                <UserAvatar size={60} />
                <p style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  color: '#00D9F5'
                }}>
                  Welcome, {userName}!
                </p>
              </div>
            )}
          </div>
          
          <div style={{
            margin: windowWidth < 768 ? '20px 0' : '30px 0'
          }}>
            <h2 style={{
              marginBottom: '15px',
              fontSize: windowWidth < 768 ? '1.2rem' : '1.5rem',
              color: '#00D9F5'
            }}>📋 Rules:</h2>
            <ul style={{
              listStyle: 'none',
              padding: 0
            }}>
              {[
                `⏱️ ${TIMER_SECONDS} seconds for each question`,
                '🚫 You cannot go back to previous questions',
                '✅ Each correct answer gives you 1 point',
                `🎲 ${QUESTIONS_PER_QUIZ} random questions will be selected`,
                `🎯 Total possible score: ${QUESTIONS_PER_QUIZ} points`,
                '⚠️ You can only try once!'
              ].map((rule, index) => (
                <li key={index} style={{
                  margin: windowWidth < 768 ? '8px 0' : '10px 0',
                  paddingLeft: '10px',
                  fontSize: windowWidth < 768 ? '0.95rem' : '1.1rem',
                  lineHeight: '1.5',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: windowWidth < 768 ? '25px' : '35px'
          }}>
            <button
              onClick={() => setShowReadyScreen(true)}
              style={{
                ...styles.button,
                fontSize: windowWidth < 768 ? '1.2rem' : '1.4rem',
                padding: windowWidth < 768 ? '15px 35px' : '18px 45px'
              }}
              disabled={!userName}
            >
              🎮 Play Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Score Screen
  if (showScore) {
    return (
      <div style={styles.container}>
        <BackButton />
        <div style={{
          textAlign: 'center',
          padding: windowWidth < 768 ? '20px' : '40px',
          marginTop: '20px'
        }}>
          <UserAvatar size={windowWidth < 768 ? 80 : 100} />
          
          <h2 style={{
            fontSize: windowWidth < 768 ? '1.8rem' : '2.2rem',
            marginBottom: '20px',
            color: '#00F5A0',
            fontWeight: '700'
          }}>
            Great job, {userName}! 🎉
          </h2>
          
          <div style={{
            fontSize: windowWidth < 768 ? '2rem' : '3rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: 'white'
          }}>
            <span style={{ color: '#00F5A0' }}>{score}</span>
            <span style={{ opacity: 0.7 }}>/{QUESTIONS_PER_QUIZ}</span>
          </div>
          
          <div style={{
            margin: '20px 0',
            fontSize: windowWidth < 768 ? '1.1rem' : '1.3rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            {score === QUESTIONS_PER_QUIZ && "🌟 Perfect Score! You're an expert!"}
            {score >= QUESTIONS_PER_QUIZ * 0.8 && score < QUESTIONS_PER_QUIZ && "🎯 Excellent! Almost perfect!"}
            {score >= QUESTIONS_PER_QUIZ * 0.6 && score < QUESTIONS_PER_QUIZ * 0.8 && "👍 Good work! You know your stuff!"}
            {score >= QUESTIONS_PER_QUIZ * 0.4 && score < QUESTIONS_PER_QUIZ * 0.6 && "💪 Not bad! Keep learning!"}
            {score < QUESTIONS_PER_QUIZ * 0.4 && "📚 Keep studying! You'll do better next time!"}
          </div>

          <div style={{
            marginTop: '30px',
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '15px',
            background: isSubmitting 
              ? 'rgba(255, 193, 7, 0.1)' 
              : 'rgba(0, 245, 160, 0.1)',
            border: isSubmitting 
              ? '1px solid rgba(255, 193, 7, 0.3)' 
              : '1px solid rgba(0, 245, 160, 0.3)',
            borderRadius: '10px'
          }}>
            {isSubmitting ? (
              <>⏳ Saving result to DataStore...</>
            ) : (
              <>✅ Result saved to leaderboard for {userName} ({userEmail})</>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleBackToHome}
              style={{
                ...styles.button,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Interface
  return (
    <div style={styles.container}>
      <BackButton />
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #00F5A0, #00D9F5)',
        width: `${((currentQuestion + 1) / QUESTIONS_PER_QUIZ) * 100}%`,
        transition: 'width 0.3s ease',
        borderRadius: '20px 20px 0 0'
      }} />
      
      <div style={{ marginTop: '60px' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: windowWidth < 768 ? '30px' : '40px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          marginBottom: windowWidth < 768 ? '15px' : '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / TIMER_SECONDS) * 100}%`,
            background: timeLeft < TIMER_SECONDS * 0.25 ? '#ff4444' :
                       timeLeft < TIMER_SECONDS * 0.5 ? '#ffbb33' :
                       '#00C851',
            transition: 'width 1s linear, background-color 0.5s ease'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontWeight: '600',
            fontSize: windowWidth < 768 ? '1rem' : '1.2rem'
          }}>
            {timeLeft}s
          </div>
        </div>

        <div style={{
          marginBottom: windowWidth < 768 ? '20px' : '30px'
        }}>
          <div style={{
            fontSize: windowWidth < 768 ? '1rem' : '1.2rem',
            marginBottom: '10px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            Question {currentQuestion + 1}/{QUESTIONS_PER_QUIZ}
          </div>
          <div style={{
            fontSize: windowWidth < 768 ? '1.4rem' : '1.8rem',
            fontWeight: '600',
            lineHeight: '1.4',
            color: 'white'
          }}>
            {quizQuestions[currentQuestion]?.questionText}
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: windowWidth < 768 ? '10px' : '15px'
        }}>
          {quizQuestions[currentQuestion]?.answerOptions.map((answerOption, index) => (
            <button
              key={index}
              onClick={() => handleNextQuestion(answerOption.isCorrect)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: windowWidth < 768 ? '15px' : '20px',
                color: 'white',
                fontSize: windowWidth < 768 ? '0.9rem' : '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {answerOption.answerText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
