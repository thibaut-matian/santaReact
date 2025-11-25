// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api.jsx';

// IMPORTANT : On importe le CSS ici
import './LoginPage.css'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = await loginUser(email, password);

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'moderator') {
          navigate('/group-manage/101'); 
        } else {
          navigate('/group/101');
        }
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    }
  };

  const handleButtonMouseEnter = () => {
    // Si les champs ne sont pas remplis, on fait bouger le bouton
    if (!email.trim() || !password.trim()) {
      const randomTop = Math.random() * 200 - 100; // Entre -100px et +100px
      const randomLeft = Math.random() * 200 - 100; // Entre -100px et +100px
      
      setButtonPosition({
        top: randomTop,
        left: randomLeft
      });
    } else {
      // Si les champs sont remplis, on remet le bouton à sa place
      setButtonPosition({ top: 0, left: 0 });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">🎅 Secret Santa</h1>
        <h3>Connexion</h3>
        
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <div style={{ position: 'relative', height: '60px', margin: '20px 0' }}>
            <button 
              type="submit" 
              className="login-button"
              onMouseEnter={handleButtonMouseEnter}
              style={{
                position: 'relative',
                transform: `translate(${buttonPosition.left}px, ${buttonPosition.top}px)`,
                transition: 'transform 0.3s ease-out',
                cursor: 'pointer'
              }}
            >
              {(!email.trim() || !password.trim()) ? '🏃‍♂️ Attrape-moi!' : 'Entrer'}
            </button>
          </div>
        </form>
        
        {(!email.trim() || !password.trim()) && (
          <p style={{ 
            fontSize: '12px', 
            color: '#666', 
            textAlign: 'center',
            fontStyle: 'italic' 
          }}>
            💡 Remplis les champs pour que le bouton arrête de fuir !
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;