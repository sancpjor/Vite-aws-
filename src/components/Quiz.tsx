import React, { useState, useEffect, useCallback } from 'react';
import { questions } from './QuestionData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { saveQuizResult, hasUserPlayed, getUserBestScore } from '../services/quizAPI';

// Amazon internal photo system
const getPlayerAvatar = (email: string, alias: string): string => {
  return `https://internal-cdn.amazon.com/badgephotos.amazon.com/?fullsizeimage=1&uid=${alias}`;
};

// Helper function for handling image errors with multiple fallbacks
const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>, alias: string, email: string) => {
  const target = e.target as HTMLImageElement;
  const currentSrc = target.src;
  
  // Fallback 1: Try Amazon internal without fullsizeimage parameter
  if (currentSrc.includes('fullsizeimage=1')) {
    target.src = `https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${alias}`;
  }
  // Fallback 2: Try with email instead of alias
  else if (currentSrc.includes('badgephotos.amazon.com') && !currentSrc.includes(email)) {
    const emailAlias = email.split('@')[0];
    target.src = `https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${emailAlias}`;
  }
  // Fallback 3: Use initials-based avatar
  else {
    target.src = `https://ui-avatars.com/api/?name=${alias}&background=00f5a0&color=1a1a1a&size=60&font-size=0.6`;
  }
};

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userName, userEmail, logout } = useAuth();

  // Quiz states
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);
  const [canAttempt, setCanAttempt] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userBestScore, setUserBestScore] = useState<any>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date>(new Date());

  // Check if user can attempt quiz using Amplify DataStore
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isLoggedIn || !userEmail) {
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔍 Checking user quiz status for:', userEmail);

        // Check if user has already played using Amplify DataStore
        const userHasPlayed = await hasUserPlayed(userEmail);
        
        if (userHasPlayed) {
          console.log('❌ User has already played');
          // Get user's best score
          const bestScore = await getUserBestScore(userEmail);
          setUserBestScore(bestScore);
          setHasAttempted(true);
          setCanAttempt(false);
        } else {
          console.log('✅ User can attempt quiz');
          setCanAttempt(true);
          // Initialize quiz with random questions
          const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
          setQuizQuestions(shuffledQuestions);
          setUserAnswers(new Array(5).fill(''));
          setQuizStartTime(new Date());
        }
      } catch (error) {
        console.error('❌ Error checking user status:', error);
        alert('Error loading quiz. Please try again.');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [isLoggedIn, userEmail, navigate]);

  // Timer effect
  useEffect(() => {
    if (!showResult && canAttempt && !hasAttempted && timeLeft > 0 && quizQuestions.length > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleNextQuestion();
    }
  }, [timeLeft, showResult, canAttempt, hasAttempted, quizQuestions.length]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = useCallback(() => {
    // Check if answer is correct
    if (selectedAnswer === quizQuestions[currentQuestion]?.correctAnswer) {
      setScore(score + 1);
    }

    // Move to next question or show results
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setTimeLeft(10);
    } else {
      finishQuiz();
    }
  }, [selectedAnswer, currentQuestion, quizQuestions, score]);

  const finishQuiz = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('🏁 Finishing quiz...');

      // Calculate final score
      let finalScore = score;
      if (selectedAnswer === quizQuestions[currentQuestion]?.correctAnswer) {
        finalScore += 1;
      }

      const quizEndTime = new Date();
      const totalTime = Math.round((quizEndTime.getTime() - quizStartTime.getTime()) / 1000);

      // Prepare quiz result data
      const quizResult = {
        alias: userName,
        email: userEmail,
        score: finalScore,
        totalQuestions: quizQuestions.length,
        percentage: (finalScore / quizQuestions.length) * 100,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };

      console.log('💾 Saving quiz result:', quizResult);

      // Save to Amplify DataStore
      const saveSuccess = await saveQuizResult(quizResult);
      
      if (saveSuccess) {
        console.log('✅ Quiz result saved successfully!');
        setScore(finalScore);
        setShowResult(true);
      } else {
        throw new Error('Failed to save quiz result');
      }
      
    } catch (error) {
      console.error('❌ Error saving quiz score:', error);
      alert('Error saving your score. Please try again.');
      // Still show results even if save failed
      setShowResult(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayAgain = () => {
    navigate('/');
  };

  const getScoreMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage === 100) return { message: "🏆 Perfect! Outstanding knowledge!", color: "#FFD700" };
    if (percentage >= 80) return { message: "🎉 Excellent! Great job!", color: "#00F5A0" };
    if (percentage >= 60) return { message: "👍 Good work! Keep it up!", color: "#00D9F5" };
    if (percentage >= 40) return { message: "📚 Not bad! Room for improvement!", color: "#FFA500" };
    return { message: "💪 Keep studying and try again!", color: "#FF6B6B" };
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="quiz-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid rgba(255, 255, 255, 0.3)',
            borderTop: '6px solid #00F5A0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }} />
          <h2 style={{ color: '#00F5A0', marginBottom: '10px' }}>Loading Quiz...</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Checking your quiz status with Amplify DataStore...
          </p>
        </div>
      </div>
    );
  }

  // Already attempted screen
  if (hasAttempted || !canAttempt) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="user-info-quiz">
            <div className="quiz-player-avatar">
              <img
                src={getPlayerAvatar(userEmail, userName)}
                alt={`${userName} avatar`}
                onError={(e) => handleAvatarError(e, userName, userEmail)}
              />
            </div>
            <div className="user-details">
              <h2>👋 Hello, {userName}!</h2>
              <p>{userEmail}</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="btn-back">
            ← Back to Home
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 107, 107, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚫</div>
          <h2 style={{ color: '#FF6B6B', marginBottom: '15px', fontSize: '2rem' }}>
            Quiz Already Completed
          </h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '1.2rem', 
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            You have already taken this quiz. Each user can only attempt the quiz once.
          </p>

          {/* Show user's previous score if available */}
          {userBestScore && (
            <div style={{
              background: 'rgba(0, 245, 160, 0.1)',
              border: '1px solid rgba(0, 245, 160, 0.3)',
              borderRadius: '15px',
              padding: '20px',
              margin: '20px 0',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#00F5A0', marginBottom: '10px' }}>
                🏆 Your Previous Score
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00F5A0' }}>
                {userBestScore.score}/{userBestScore.totalQuestions}
              </div>
              <div style={{ fontSize: '1.2rem', color: '#00D9F5' }}>
                {userBestScore.percentage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '10px' }}>
                Completed on {userBestScore.date} at {userBestScore.time}
              </div>
            </div>
          )}
          
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '1rem', 
            marginBottom: '30px'
          }}>
            Check the leaderboard on the home page to see how you rank!
          </p>
          
          <button 
            onClick={handlePlayAgain}
            className="btn"
            style={{
              background: 'linear-gradient(45deg, #00F5A0, #00D9F5)',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#1a1a1a',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Quiz results screen
  if (showResult) {
    const scoreInfo = getScoreMessage(score, quizQuestions.length);
    
    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <div className="quiz-results-header">
            <div className="results-player-avatar">
              <img
                src={getPlayerAvatar(userEmail, userName)}
                alt={`${userName} avatar`}
                onError={(e) => handleAvatarError(e, userName, userEmail)}
              />
            </div>
            
            <h2 style={{ color: '#00F5A0', fontSize: '2.5rem', margin: '20px 0 10px 0' }}>
              🎉 Quiz Completed!
            </h2>
            <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '20px' }}>
              Great job, {userName}!
            </h3>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '30px',
              margin: '20px 0',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: scoreInfo.color,
                marginBottom: '10px'
              }}>
                {score}/{quizQuestions.length}
              </div>
              <div style={{
                fontSize: '1.5rem',
                color: scoreInfo.color,
                marginBottom: '15px',
                fontWeight: '600'
              }}>
                {Math.round((score / quizQuestions.length) * 100)}%
              </div>
              <div style={{
                fontSize: '1.2rem',
                color: scoreInfo.color,
                fontWeight: '600'
              }}>
                {scoreInfo.message}
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 217, 245, 0.1)',
              border: '1px solid rgba(0, 217, 245, 0.3)',
              borderRadius: '15px',
              padding: '15px',
              margin: '20px 0',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              ✅ Your score has been saved to the leaderboard!
            </div>
          </div>

          {/* Question Review */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            margin: '30px 0',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              color: '#00D9F5', 
              marginBottom: '20px', 
              fontSize: '1.5rem',
              textAlign: 'center'
            }}>
              📋 Question Review
            </h3>
            
            {quizQuestions.map((question, index) => (
              <div key={index} style={{
                background: userAnswers[index] === question.correctAnswer 
                  ? 'rgba(0, 245, 160, 0.1)' 
                  : 'rgba(255, 107, 107, 0.1)',
                border: userAnswers[index] === question.correctAnswer 
                  ? '1px solid rgba(0, 245, 160, 0.3)' 
                  : '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '10px',
                padding: '15px',
                margin: '10px 0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {userAnswers[index] === question.correctAnswer ? '✅' : '❌'}
                  </span>
                  <strong style={{ color: 'white' }}>Q{index + 1}: {question.question}</strong>
                </div>
                
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  <div>Your answer: <span style={{ 
                    color: userAnswers[index] === question.correctAnswer ? '#00F5A0' : '#FF6B6B' 
                  }}>
                    {userAnswers[index] || 'No answer'}
                  </span></div>
                  {userAnswers[index] !== question.correctAnswer && (
                    <div>Correct answer: <span style={{ color: '#00F5A0' }}>
                      {question.correctAnswer}
                    </span></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              onClick={handlePlayAgain}
              className="btn"
              style={{
                background: 'linear-gradient(45deg, #00F5A0, #00D9F5)',
                border: 'none',
                borderRadius: '15px',
                padding: '15px 30px',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1a1a1a',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginRight: '15px'
              }}
            >
              🏠 Back to Home
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '15px 30px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              📊 View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  if (quizQuestions.length === 0) {
    return (
      <div className="quiz-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: '#FF6B6B' }}>Error loading questions</h2>
          <button onClick={() => navigate('/')} className="btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quizQuestions[currentQuestion];

  return (
    <div className="quiz-container">
      {/* Quiz Header */}
      <div className="quiz-header">
        <div className="user-info-quiz">
          <div className="quiz-player-avatar">
            <img
              src={getPlayerAvatar(userEmail, userName)}
              alt={`${userName} avatar`}
              onError={(e) => handleAvatarError(e, userName, userEmail)}
            />
          </div>
          <div className="user-details">
            <h2>👋 Welcome, {userName}!</h2>
            <p>{userEmail}</p>
            <div className="quiz-status">
              Ready to test your knowledge?
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/')} className="btn-back">
          ← Back to Home
        </button>
      </div>

      {/* Question Progress */}
      <div className="question-header">
        <div className="question-progress">
          Question {currentQuestion + 1} of {quizQuestions.length}
        </div>
        
        <div className="quiz-mini-avatar">
          <img
            src={getPlayerAvatar(userEmail, userName)}
            alt={userName}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              objectFit: 'cover'
            }}
            onError={(e) => handleAvatarError(e, userName, userEmail)}
          />
        </div>
      </div>

      {/* Timer */}
      <div style={{
        background: timeLeft <= 3 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 217, 245, 0.2)',
        border: `1px solid ${timeLeft <= 3 ? 'rgba(255, 107, 107, 0.3)' : 'rgba(0, 217, 245, 0.3)'}`,
        borderRadius: '15px',
        padding: '15px',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: timeLeft <= 3 ? '#FF6B6B' : '#00D9F5',
          marginBottom: '5px'
        }}>
          {timeLeft}
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
          seconds remaining
        </div>
      </div>

      {/* Question */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '25px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          color: '#00F5A0',
          fontSize: '1.3rem',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Category: {currentQ.category}
        </h3>
        
        <h2 style={{
          color: 'white',
          fontSize: '1.5rem',
          lineHeight: '1.4',
          marginBottom: '0'
        }}>
          {currentQ.question}
        </h2>
      </div>

      {/* Answer Options */}
      <div style={{
        display: 'grid',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {currentQ.options.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            style={{
              background: selectedAnswer === option 
                ? 'rgba(0, 245, 160, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: selectedAnswer === option 
                ? '2px solid #00F5A0' 
                : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              fontWeight: selectedAnswer === option ? '600' : '400'
            }}
            onMouseOver={(e) => {
              if (selectedAnswer !== option) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedAnswer !== option) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <span style={{ 
              marginRight: '12px', 
              color: '#00D9F5',
              fontWeight: 'bold'
            }}>
              {String.fromCharCode(65 + index)}.
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer || isSubmitting}
          style={{
            background: selectedAnswer && !isSubmitting
              ? 'linear-gradient(45deg, #00F5A0, #00D9F5)'
              : 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '15px',
            padding: '15px 40px',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: selectedAnswer && !isSubmitting ? '#1a1a1a' : 'rgba(255, 255, 255, 0.6)',
            cursor: selectedAnswer && !isSubmitting ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease',
            opacity: selectedAnswer && !isSubmitting ? 1 : 0.6
          }}
        >
          {isSubmitting ? (
            <>
              <span style={{ marginRight: '10px' }}>⏳</span>
              Saving to DataStore...
            </>
          ) : currentQuestion === quizQuestions.length - 1 ? (
            <>
              <span style={{ marginRight: '10px' }}>🏁</span>
              Finish Quiz
            </>
          ) : (
            <>
              <span style={{ marginRight: '10px' }}>➡️</span>
              Next Question
            </>
          )}
        </button>
        
        {!selectedAnswer && (
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            marginTop: '15px',
            fontSize: '0.9rem'
          }}>
            Please select an answer to continue
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{
        marginTop: '30px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        height: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(45deg, #00F5A0, #00D9F5)',
          height: '100%',
          width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      <div style={{
        textAlign: 'center',
        marginTop: '10px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem'
      }}>
        Progress: {currentQuestion + 1}/{quizQuestions.length} questions completed
      </div>
    </div>
  );
};

export default Quiz;
