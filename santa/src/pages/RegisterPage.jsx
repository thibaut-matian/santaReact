import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  
  // Champs du formulaire
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Mode : Est-ce qu'on veut être MODÉRATEUR (créer) ou USER (rejoindre) ?
  const [isModerator, setIsModerator] = useState(false);
  
  // Si Modérateur : Nom du nouveau groupe
  const [newGroupName, setNewGroupName] = useState('');
  
  // Si Utilisateur : ID du groupe à rejoindre
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Charger la liste des groupes existants (pour les participants)
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
      } catch (err) {
        console.error("Erreur chargement groupes", err);
      }
    };
    fetchGroups();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // 1. CRÉATION DE L'UTILISATEUR
      const userRes = await api.post('/users', {
        name,
        email,
        password,
        role: isModerator ? 'moderator' : 'user'
      });

      const newUser = userRes.data;
      console.log('Nouvel utilisateur créé:', newUser);

      // 2. LOGIQUE SELON LE RÔLE
      if (isModerator) {
        // --- CAS A : ORGANISATEUR ---
        const groupRes = await api.post('/groups', {
          name: newGroupName,
          moderatorId: newUser.id,
          status: 'open',
          isDrawDone: false
        });
        
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        navigate(`/group-manage/${groupRes.data.id}`);

      } else {
        // --- CAS B : PARTICIPANT ---
        if (!selectedGroupId) {
          alert("Veuillez choisir un groupe à rejoindre !");
          return;
        }

        console.log('Inscription au groupe:', selectedGroupId, 'pour user:', newUser.id);

        // CORRECTION : S'assurer que groupId est bien transmis
        const participantData = {
          userId: newUser.id,
          groupId: selectedGroupId, // Pas besoin de Number() si c'est déjà une string
          status: 'pending',
          gifteeId: null
        };

        console.log('Données participant à envoyer:', participantData);

        const participantRes = await api.post('/participants', participantData);
        console.log('Participant créé:', participantRes.data);

        localStorage.setItem('currentUser', JSON.stringify(newUser));
        navigate(`/group/${selectedGroupId}`);
      }

    } catch (error) {
      console.error('Erreur complète:', error);
      alert(`Erreur lors de l'inscription: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen text-slate-200 flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-8 max-w-md w-full relative overflow-hidden">
        
        {/* Effet de brillance liquide */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              📝 Inscription
            </h1>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* IDENTITÉ */}
            <div>
              <input 
                type="text" 
                placeholder="Ton Nom (ex: Julie)" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required 
              />
            </div>
            
            <div>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required 
              />
            </div>
            
            <div>
              <input 
                type="password" 
                placeholder="Mot de passe" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required 
              />
            </div>

            {/* CHOIX DU RÔLE */}
            <div className="border-t border-slate-600/50 pt-6">
              <label className="cursor-pointer flex items-center gap-3 mb-4">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary"
                  checked={isModerator}
                  onChange={(e) => setIsModerator(e.target.checked)}
                />
                <span className="font-bold text-slate-200">Je veux organiser un Secret Santa 🎅</span>
              </label>
            </div>

            {/* CHAMP DYNAMIQUE */}
            {isModerator ? (
              <div>
                <input 
                  type="text" 
                  placeholder="Nom de l'évènement (ex: Noël Famille 2024)" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="input input-bordered w-full bg-red-500/20 border-red-500/50 text-white placeholder-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all"
                  required 
                />
                <p className="text-xs text-slate-400 mt-2">Tu seras le modérateur de ce groupe.</p>
              </div>
            ) : (
              <div>
                <select 
                  className="select select-bordered w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  value={selectedGroupId}
                  onChange={(e) => {
                    console.log('Groupe sélectionné:', e.target.value);
                    setSelectedGroupId(e.target.value);
                  }}
                  required
                >
                  <option value="" disabled>-- Choisis un groupe à rejoindre --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} (ID: {g.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn w-full bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-sm border-indigo-500/30 shadow-lg text-white hover:from-indigo-400/80 hover:to-purple-500/80 transition-all duration-300"
            >
              {isModerator ? '🎯 Créer mon espace' : "📝 M'inscrire"}
            </button>
          </form>

          {/* Séparateur avec effet glass */}
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