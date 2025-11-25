// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api.jsx';
import api from '../services/api'; // Ajout pour récupérer le groupe du modo
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
          // MODIFICATION ICI : On cherche le groupe de ce modérateur
          try {
            const groupsRes = await api.get(`/groups?moderatorId=${user.id}`);
            if (groupsRes.data.length > 0) {
              const myGroup = groupsRes.data[0]; // Son premier groupe
              navigate(`/group-manage/${myGroup.id}`);
            } else {
              // Cas où le modo n'a pas encore de groupe (ne devrait pas arriver)
              setError('Aucun groupe trouvé pour ce modérateur.');
            }
          } catch (err) {
            console.error('Erreur recherche groupe:', err);
            setError('Erreur lors de la recherche du groupe.');
          }
        } else {
          // Pour les utilisateurs normaux, on peut aussi chercher leur groupe
          try {
            const participantsRes = await api.get(`/participants?userId=${user.id}`);
            if (participantsRes.data.length > 0) {
              const myParticipation = participantsRes.data[0]; // Sa première participation
              navigate(`/group/${myParticipation.groupId}`);
            } else {
              // L'utilisateur n'est dans aucun groupe encore
              setError('Vous n\'êtes inscrit dans aucun groupe.');
            }
          } catch (err) {
            console.error('Erreur recherche participation:', err);
            navigate('/group/101'); // Fallback vers un groupe par défaut
          }
        }
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    }
  };

  const handleButtonMouseEnter = () => {
    if (!email.trim() || !password.trim()) {
      const randomTop = Math.random() * 200 - 100; 
      const randomLeft = Math.random() * 200 - 100; 
      
      setButtonPosition({
        top: randomTop,
        left: randomLeft
      });
    } else {
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
            fontStyle: 'italic',
            marginBottom: '15px'
          }}>
            💡 Remplis les champs pour que le bouton arrête de fuir !
          </p>
        )}

        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>
            Pas encore de compte ? <br/>
            <Link to="/register" style={{ color: '#d32f2f', fontWeight: 'bold', textDecoration: 'none' }}>
                Créer un espace ou rejoindre
            </Link>
            </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;