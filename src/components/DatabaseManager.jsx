// src/components/DatabaseManager.jsx - For testing and management
import React, { useState, useEffect } from 'react';
import quizDB from '../services/database.js';
import { getLeaderboard, getStats, clearAllData, exportQuizData } from '../services/quizAPI.js';

const DatabaseManager = () => {
  const [stats, setStats] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [users, setUsers] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const statsData = await getStats();
    const leaderboardData = await getLeaderboard();
    const usersData = quizDB.getUsers();
    
    setStats(statsData);
    setLeaderboard(leaderboardData);
    setUsers(usersData);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all quiz data? This cannot be undone.')) {
      await clearAllData();
      loadData();
      alert('Database cleared successfully!');
    }
  };

  const handleExportData = async () => {
    const data = await exportQuizData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', margin: '20px' }}>
      <h2>🗄️ Database Manager</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(0,245,160,0.2)', padding: '15px', borderRadius: '10px' }}>
          <h3>📊 Stats</h3>
          <p>Total Users: {stats.totalUsers}</p>
          <p>Played: {stats.playedUsers}</p>
          <p>Attempts: {stats.totalAttempts}</p>
          <p>Avg Score: {stats.averageScore}</p>
          <p>Perfect Scores: {stats.perfectScores}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🏆 Leaderboard</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {leaderboard.map((score, index) => (
            <div key={score.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '5px 10px',
              background: index < 3 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
              margin: '5px 0',
              borderRadius: '5px'
            }}>
              <span>#{index + 1} {score.alias}</span>
              <span>{score.score}/5 ({score.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>👥 Users</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {Object.values(users).map((user) => (
            <div key={user.email} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '5px 10px',
              background: 'rgba(255,255,255,0.1)',
              margin: '5px 0',
              borderRadius: '5px'
            }}>
              <span>{user.alias} ({user.email})</span>
              <span>{user.hasPlayed ? `✅ ${user.score}/5` : '❌ Not played'}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={loadData}
          style={{ 
            background: 'linear-gradient(45deg, #00F5A0, #00D9F5)', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '10px', 
            color: '#1a1a1a', 
            cursor: 'pointer' 
          }}
        >
          🔄 Refresh
        </button>
        <button 
          onClick={handleExportData}
          style={{ 
            background: 'linear-gradient(45deg, #4ecdc4, #44a08d)', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '10px', 
            color: 'white', 
            cursor: 'pointer' 
          }}
        >
          📥 Export Data
        </button>
        <button 
          onClick={handleClearData}
          style={{ 
            background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '10px', 
            color: 'white', 
            cursor: 'pointer' 
          }}
        >
          🗑️ Clear All Data
        </button>
      </div>
    </div>
  );
};

export default DatabaseManager;
