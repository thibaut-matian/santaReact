import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { SecureText } from '../components/SecureText';
import { useSecureStorage } from '../components/SecureText';
import { SecurityUtils } from '../utils/security';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isModerator, setIsModerator] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const { setSecureItem } = useSecureStorage();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
      } catch (err) {
      }
    };
    fetchGroups();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name || name.trim().length < 2) {
        throw new Error('Le nom doit contenir au moins 2 caractères');
      }
      
      if (!SecurityUtils.isValidEmail(email)) {
        throw new Error('Format d\'email invalide');
      }
      
      if (!SecurityUtils.isValidPassword(password)) {
        throw new Error('Le mot de passe doit contenir au moins 4 caractères');
      }

      if (isModerator && (!newGroupName || newGroupName.trim().length < 3)) {
        throw new Error('Le nom du groupe doit contenir au moins 3 caractères');
      }

      if (!isModerator && !selectedGroupId) {
        throw new Error('Veuillez choisir un groupe à rejoindre');
      }

      const existingUsers = await api.get('/users');
      const emailExists = existingUsers.data.some(u => 
        u.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (emailExists) {
        throw new Error('Cet email est déjà utilisé');
      }

      const safeUserData = {
        name: SecurityUtils.sanitize(name.trim()),
        email: SecurityUtils.sanitize(email.toLowerCase().trim()),
        password: SecurityUtils.sanitize(password),
        role: isModerator ? 'moderator' : 'user'
      };

      const userRes = await api.post('/users', safeUserData);
      const newUser = userRes.data;

      if (isModerator) {
        const safeGroupData = {
          name: SecurityUtils.sanitize(newGroupName.trim()),
          moderatorId: newUser.id,
          status: 'open',
          isDrawDone: false
        };

        const groupRes = await api.post('/groups', safeGroupData);
        
        setSecureItem('currentUser', {
          id: newUser.id,
          name: safeUserData.name,
          email: safeUserData.email,
          role: safeUserData.role
        });
        
        navigate(`/group-manage/${groupRes.data.id}`);

      } else {
        const participantData = {
          userId: newUser.id,
          groupId: selectedGroupId,
          status: 'pending',
          gifteeId: null
        };

        await api.post('/participants', participantData);

        setSecureItem('currentUser', {
          id: newUser.id,
          name: safeUserData.name,
          email: safeUserData.email,
          role: safeUserData.role
        });
        
        navigate(`/group/${selectedGroupId}`);
      }

    } catch (error) {
      setError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setName(SecurityUtils.sanitize(value));
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

  const handleGroupNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 100) {
      setNewGroupName(SecurityUtils.sanitize(value));
    }
  };

  return (
    <div className="min-h-screen text-slate-200 flex items-center justify-center px-4 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900">
      
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-8 max-w-md w-full relative overflow-hidden">
        
        {/* Effet de brillance liquide */}
        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              📝 Inscription Sécurisée
            </h1>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            
            <div>
              <input 
                type="text" 
                placeholder="Ton Nom (ex: Julie)" 
                value={name} 
                onChange={handleNameChange}
                maxLength="50"
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required 
                disabled={loading}
                autoComplete="name"
              />
            </div>
            
            <div>
              <input 
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
                type="password" 
                placeholder="Mot de passe (min 4 caractères)" 
                value={password} 
                onChange={handlePasswordChange}
                maxLength="100"
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required 
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="border-t border-slate-600/50 pt-6">
              <label className="cursor-pointer flex items-center gap-3 mb-4">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary"
                  checked={isModerator}
                  onChange={(e) => setIsModerator(e.target.checked)}
                  disabled={loading}
                />
                <span className="font-bold text-slate-200">Je veux organiser un Secret Santa 🎅</span>
              </label>
            </div>

            {isModerator ? (
              <div>
                <input 
                  type="text" 
                  placeholder="Nom de l'évènement (ex: Noël Famille 2024)" 
                  value={newGroupName} 
                  onChange={handleGroupNameChange}
                  maxLength="100"
                  className="input input-bordered w-full bg-red-500/20 border-red-500/50 text-white placeholder-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all"
                  required 
                  disabled={loading}
                />
                <p className="text-xs text-slate-400 mt-2">Tu seras le modérateur de ce groupe.</p>
              </div>
            ) : (
              <div>
                <select 
                  className="select select-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="" disabled>-- Choisis un groupe à rejoindre --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      <SecureText>{g.name}</SecureText>
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                <span className="text-red-200 text-sm">
                  <SecureText>{error}</SecureText>
                </span>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn w-full bg-linear-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-sm border-indigo-500/30 shadow-lg text-white hover:from-indigo-400/80 hover:to-purple-500/80 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                'Inscription...'
              ) : isModerator ? (
                '🎯 Créer mon espace sécurisé'
              ) : (
                "📝 M'inscrire de façon sécurisée"
              )}
            </button>
          </form>

          <div className="border-t border-slate-600/50 pt-6 text-center mt-8">
            <p className="text-sm text-slate-300 mb-3">
              Déjà un compte ?
            </p>
            <Link 
              to="/" 
              className="btn btn-ghost btn-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-300 backdrop-blur-sm border border-indigo-500/20"
            >
              🔑 Connexion
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;