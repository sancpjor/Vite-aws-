// src/components/Quiz.tsx - ACTUALIZADO PARA MEMORIA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { saveQuizResult } from '../services/quizAPI';
import { useAuth } from '../App';

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

// Preguntas del quiz
const mockQuestions: Question[] = [
  {
    id: '1',
    category: 'Real Zaragoza',
    question: '¿En qué año fue fundado el Real Zaragoza?',
    options: ['1932', '1935', '1940', '1928'],
    correctAnswer: 0,
    difficulty: 'EASY'
  },
  {
    id: '2',
    category: 'Real Zaragoza',
    question: '¿Cuál es el estadio del Real Zaragoza?',
    options: ['La Romareda', 'El Alcoraz', 'Mestalla', 'San Mamés'],
    correctAnswer: 0,
    difficulty: 'EASY'
  },
  {
    id: '3',
    category: 'Real Zaragoza',
    question: '¿Cuántas Copas del Rey ha ganado el Real Zaragoza?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 2,
    difficulty: 'MEDIUM'
  },
  {
    id: '4',
    category: 'SD Huesca',
    question: '¿En qué año fue fundado el SD Huesca?',
    options: ['1960', '1965', '1970', '1975'],
    correctAnswer: 0,
    difficulty: 'EASY'
  },
  {
    id: '5',
    category: 'SD Huesca',
    question: '¿Cuál es el estadio del SD Huesca?',
    options: ['La Romareda', 'El Alcoraz', 'Mestalla', 'San Mamés'],
    correctAnswer: 1,
    difficulty: 'EASY'
  },
  {
    id: '6',
    category: 'AWS',
    question: '¿Qué significa EC2 en AWS?',
    options: ['Elastic Compute Cloud', 'Elastic Container Cloud', 'Easy Compute Cloud', 'Extended Compute Cloud'],
    correctAnswer: 0,
    difficulty: 'EASY'
  },
  {
    id: '7',
    category: 'AWS',
    question: '¿Cuál es el servicio de base de datos relacional de AWS?',
    options: ['DynamoDB', 'RDS', 'Redshift', 'ElastiCache'],
    correctAnswer: 1,
    difficulty: 'EASY'
  },
  {
    id: '8',
    category: 'AWS',
    question: '¿Qué servicio de AWS se usa para almacenamiento de objetos?',
    options: ['EBS', 'EFS', 'S3', 'Glacier'],
    correctAnswer: 2,
    difficulty: 'EASY'
  },
  {
    id: '9',
    category: 'AWS',
    question: '¿Cuál es la región de AWS en España?',
    options: ['eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-south-1'],
    correctAnswer: 2,
    difficulty: 'MEDIUM'
  },
  {
    id: '10',
    category: 'World Cup',
    question: '¿Qué país ganó la Copa del Mundo de 2018?',
    options: ['Brasil', 'Francia', 'Alemania', 'Argentina'],
    correctAnswer: 1,
    difficulty: 'EASY'
  },
  {
    id: '11',
    category: 'World Cup',
    question: '¿Quién fue el máximo goleador del Mundial 2018?',
    options: ['Cristiano Ronaldo', 'Lionel Messi', 'Harry Kane', 'Kylian Mbappé'],
    correctAnswer: 2,
    difficulty: 'MEDIUM'
  },
  {
    id: '12',
    category: 'Aragon',
    question: '¿Cuál es la capital de Aragón?',
    options: ['Huesca', 'Teruel', 'Zaragoza', 'Jaca'],
    correctAnswer: 2,
    difficulty: 'EASY'
  },
  {
    id: '13',
    category: 'Aragon',
    question: '¿Cuántas provincias tiene Aragón?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 1,
    difficulty: 'EASY'
  },
  {
    id: '14',
    category: 'Aragon',
    question: '¿Cuál es el río principal que atraviesa Zaragoza?',
    options: ['Tajo', 'Duero', 'Ebro', 'Guadalquivir'],
    correctAnswer: 2,
    difficulty: 'EASY'
  },
  {
    id: '15',
    category: 'Real Zaragoza',
    question: '¿En qué año ganó el Real Zaragoza la Recopa de Europa?',
    options: ['1993', '1994', '1995', '1996'],
    correctAnswer: 2,
    difficulty: 'HARD'
  }
];

const Quiz: React.FC = () => {
  const { userEmail, userAlias } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Verificar si el usuario ya jugó (simulado)
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    // Simular verificación si el usuario ya jugó
    const playedUsers = localStorage.getItem('playedUsers');
    if (playedUsers) {
      const played = JSON.parse(playedUsers);
      setHasPlayed(played.includes(userEmail));
    }
  }, [userEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && quizStarted && !quizCompleted) {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, quizCompleted]);

  const startQuiz = () => {
    console.log('🎮 Iniciando quiz...');
    
    // Seleccionar 5 preguntas aleatorias
    const shuffled = [...mockQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    
    setQuestions(selectedQuestions);
    setQuizStarted(true);
    setQuestionStartTime(Date.now());
    
    console.log('✅ Quiz iniciado con', selectedQuestions.length, 'preguntas');
  };

  const handleTimeUp = () => {
    console.log('⏰ Tiempo agotado para la pregunta');
    handleAnswerSubmit(null);
  };

  const handleAnswerSubmit = (answerIndex: number | null) => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex ?? -1,
      isCorrect,
      timeSpent
    };

    setAnswers(prev => [...prev, answer]);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Avanzar a la siguiente pregunta o completar el quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(10);
      setQuestionStartTime(Date.now());
    } else {
      completeQuiz([...answers, answer]);
    }
  };

  const completeQuiz = async (finalAnswers: QuizAnswer[]) => {
    console.log('🏁 Completando quiz...');
    setQuizCompleted(true);
    setIsLoading(true);

    try {
      const finalScore = finalAnswers.filter(a => a.isCorrect).length;
      const totalTime = finalAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
      const categories = [...new Set(questions.map(q => q.category))];

      await saveQuizResult(
        userEmail,
        userAlias,
        finalScore,
        questions.length,
        finalAnswers,
        categories,
        totalTime
      );

      // Marcar que el usuario ya jugó
      const playedUsers = localStorage.getItem('playedUsers');
      const played = playedUsers ? JSON.parse(playedUsers) : [];
      if (!played.includes(userEmail)) {
        played.push(userEmail);
        localStorage.setItem('playedUsers', JSON.stringify(played));
      }

      console.log('✅ Quiz completado y guardado');
    } catch (error) {
      console.error('❌ Error guardando resultado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage === 100) return '#FFD700';
    if (percentage >= 80) return '#00F5A0';
    if (percentage >= 60) return '#00D9F5';
    if (percentage >= 40) return '#FFA500';
    return '#FF6B6B';
  };

  const getScoreMessage = (percentage: number): string => {
    if (percentage === 100) return '🏆 ¡Perfecto! Eres un experto';
    if (percentage >= 80) return '🎉 ¡Excelente trabajo!';
    if (percentage >= 60) return '👍 ¡Bien hecho!';
    if (percentage >= 40) return '📚 Puedes mejorar';
    return '💪 ¡Sigue practicando!';
  };

  if (hasPlayed) {
    return (
      <div className="container">
        <div className="quiz-container">
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 165, 0, 0.1)',
            borderRadius: '15px',
            border: '2px solid rgba(255, 165, 0, 0.3)'
          }}>
            <h2 style={{ color: '#FFA500', marginBottom: '20px' }}>
              ⚠️ Ya has completado el quiz
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '30px' }}>
              Solo puedes intentar el quiz una vez. ¡Gracias por participar!
            </p>
            <Link to="/" className="btn-link">
              <button className="btn">🏠 Volver al inicio</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="container">
        <div className="quiz-container">
          <div className="quiz-completed">
            <h2>🎯 Quiz Completado</h2>
            
            <div style={{
              background: `rgba(${percentage === 100 ? '255, 215, 0' : 
                               percentage >= 80 ? '0, 245, 160' : 
                               percentage >= 60 ? '0, 217, 245' : 
                               percentage >= 40 ? '255, 165, 0' : '255, 107, 107'}, 0.2)`,
              border: `2px solid ${getScoreColor(percentage)}`,
              borderRadius: '15px',
              padding: '30px',
              margin: '20px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: getScoreColor(percentage),
                marginBottom: '10px'
              }}>
                {score}/{questions.length}
              </div>
              
              <div style={{
                fontSize: '1.5rem',
                color: getScoreColor(percentage),
                marginBottom: '15px'
              }}>
                {percentage}%
              </div>
              
              <p style={{
                fontSize: '1.2rem',
                color: getScoreColor(percentage),
                fontWeight: 'bold'
              }}>
                {getScoreMessage(percentage)}
              </p>
            </div>

            <div className="quiz-summary">
              <h3>📊 Resumen de respuestas</h3>
              {questions.map((question, index) => {
                const answer = answers[index];
                return (
                  <div key={question.id} style={{
                    background: answer.isCorrect 
                      ? 'rgba(0, 245, 160, 0.1)' 
                      : 'rgba(255, 107, 107, 0.1)',
                    border: `1px solid ${answer.isCorrect ? '#00F5A0' : '#FF6B6B'}`,
                    borderRadius: '10px',
                    padding: '15px',
                    margin: '10px 0'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {answer.isCorrect ? '✅' : '❌'} {question.question}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      <strong>Respuesta correcta:</strong> {question.options[question.correctAnswer]}
                    </div>
                    {answer.selectedAnswer >= 0 && (
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                        <strong>Tu respuesta:</strong> {question.options[answer.selectedAnswer]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <div className="loading-spinner"></div>
                <p>Guardando resultado...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <Link to="/" className="btn-link">
                  <button className="btn">🏠 Ver Ranking</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="container">
        <div className="quiz-container">
          <div className="quiz-intro">
            <h1>🎯 ZAZ Football Quiz</h1>
            <p>Test your knowledge about Real Zaragoza, SD Huesca, AWS, and more!</p>
            
            <div className="quiz-rules">
              <h3>📋 Reglas del Quiz</h3>
              <ul>
                <li>🎲 5 preguntas aleatorias de diferentes categorías</li>
                <li>⏱️ 10 segundos por pregunta</li>
                <li>🚫 No puedes volver a preguntas anteriores</li>
                <li>⚠️ Solo puedes intentar el quiz una vez</li>
                <li>🏆 Cada respuesta correcta vale 1 punto</li>
              </ul>
            </div>

            <div className="quiz-categories">
              <h3>🎯 Categorías</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                <span className="category-tag">⚽ Real Zaragoza</span>
                <span className="category-tag">🔴 SD Huesca</span>
                <span className="category-tag">☁️ AWS</span>
                <span className="category-tag">🏆 World Cup</span>
                <span className="category-tag">🏛️ Aragon</span>
              </div>
            </div>

            <button onClick={startQuiz} className="btn">
              🚀 Comenzar Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container">
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
          </div>
          
          <div className="quiz-timer">
            <div style={{
              background: timeLeft <= 3 ? '#FF6B6B' : '#00F5A0',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '25px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              animation: timeLeft <= 3 ? 'pulse 1s infinite' : 'none'
            }}>
              ⏱️ {timeLeft}s
            </div>
          </div>
        </div>

        <div className="question-container">
          <div className="question-category">
            📚 {currentQuestion.category}
          </div>
          
          <h2 className="question-text">
            {currentQuestion.question}
          </h2>

          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedAnswer(index);
                  setTimeout(() => handleAnswerSubmit(index), 200);
                }}
                disabled={selectedAnswer !== null}
                className={`option-button ${
                  selectedAnswer === index ? 'selected' : ''
                }`}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
