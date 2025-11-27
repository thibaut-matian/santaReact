// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api.jsx';
import { SecurityUtils } from '../utils/security.js';
import { useSecureStorage } from '../components/SecureText.jsx';
import api from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { setSecureItem } = useSecureStorage();

  const areLoginFieldsEmpty = () => {
    return email.trim() === "" || password.trim() === "";
  };

  useEffect(() => {
    if (!areLoginFieldsEmpty()) {
      setButtonPosition({ x: 0, y: 0 });
    }
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(email, password);

      if (user) {
        setSecureItem('currentUser', user);
        
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'moderator') {
          try {
            const groupsRes = await api.get(`/groups?moderatorId=${user.id}`);
            if (groupsRes.data.length > 0) {
              const myGroup = groupsRes.data[0];
              navigate(`/group-manage/${myGroup.id}`);
            } else {
              setError('Aucun groupe trouvé pour ce modérateur.');
            }
          } catch (err) {
            setError('Erreur lors de la recherche du groupe.');
          }
        } else {
          try {
            const participantsRes = await api.get(`/participants?userId=${user.id}`);
            if (participantsRes.data.length > 0) {
              const myParticipation = participantsRes.data[0];
              navigate(`/group/${myParticipation.groupId}`);
            } else {
              navigate('/group/101');
            }
          } catch (err) {
            navigate('/group/101');
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonMouseOver = () => {
    if (areLoginFieldsEmpty()) {
      const randomX = Math.random() * 300 - 150; // Entre -150px et +150px
      const randomY = Math.random() * 300 - 150; // Entre -150px et +150px
      
      setButtonPosition({ x: randomX, y: randomY });
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    if (value.length <= 254) {
      setEmail(SecurityUtils.sanitize(value));
    }
  };
  
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (value.length <= 100) {
      setPassword(SecurityUtils.sanitize(value));
    }
  };

  return (
    <div className="min-h-screen text-slate-200 flex items-center justify-center px-4 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900">
      
     
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-8 max-w-md w-full relative overflow-hidden">
        
       
        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
        
        {/* Contenu */}
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              🎅 Secret Santa
            </h1>
            <h3 className="text-xl text-slate-300 font-medium">Connexion Sécurisée</h3>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                id="email"
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={handleEmailChange}
                maxLength="254"
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div>
              <input 
                id="password"
                type="password" 
                placeholder="Mot de passe" 
                value={password}
                onChange={handlePasswordChange}
                maxLength="100"
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                <span className="text-red-200 text-sm">{SecurityUtils.sanitize(error)}</span>
              </div>
            )}
            
            {/* Container pour le bouton qui bouge */}
            <div className="relative h-20 flex items-center justify-center">
              <button 
                id="loginBtn"
                type="submit" 
                className={`btn w-full backdrop-blur-sm border-red-500/30 shadow-lg text-white hover:from-red-400/80 hover:to-red-600/80 transition-all duration-300 ${
                  areLoginFieldsEmpty() 
                    ? 'bg-red-500' 
                    : 'bg-linear-to-r from-blue-500/80 to-blue-700/80'
                } ${loading ? 'loading' : ''}`}
                onMouseOver={handleButtonMouseOver}
                style={{
                  position: 'relative',
                  transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
                disabled={loading}
              >
                {loading ? 'Connexion...' : areLoginFieldsEmpty() ? "Remplis d'abord !" : ' Connexion Sécurisée'}
              </button>
            </div>
          </form>
          
          {areLoginFieldsEmpty() && (
            <div className="text-center mb-6 mt-4">
              <p className="text-sm text-slate-400 italic opacity-75">
                 Remplis les champs pour que le bouton arrête de fuir !
              </p>
            </div>
          )}

          {/* Séparateur avec effet glass */}
          <div className="border-t border-slate-600/50 pt-6 text-center mt-8">
            <p className="text-sm text-slate-300 mb-3">
              Pas encore de compte ?
            </p>
            <Link 
              to="/register" 
              className="btn btn-ghost btn-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-300 backdrop-blur-sm border border-indigo-500/20"
            >
              ✨ Créer un compte sécurisé
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;