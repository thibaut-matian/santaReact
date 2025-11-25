import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './LoginPage.css'; // On réutilise le style du Login pour gagner du temps

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
      // json-server va générer un ID automatique (ex: 5, 6...)
      const userRes = await api.post('/users', {
        name,
        email,
        password,
        role: isModerator ? 'moderator' : 'user'
      });

      const newUser = userRes.data;

      // 2. LOGIQUE SELON LE RÔLE
      if (isModerator) {
        // --- CAS A : ORGANISATEUR ---
        // On crée le groupe lié à ce nouveau modérateur
        const groupRes = await api.post('/groups', {
          name: newGroupName,
          moderatorId: newUser.id, // Lien avec le créateur
          status: 'open',
          isDrawDone: false
        });
        
        // On connecte l'utilisateur direct
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        // On redirige vers la gestion de son nouveau groupe
        navigate(`/group-manage/${groupRes.data.id}`);

      } else {
        // --- CAS B : PARTICIPANT ---
        if (!selectedGroupId) {
          alert("Veuillez choisir un groupe à rejoindre !");
          return;
        }

        // On l'ajoute dans la table 'participants' en statut 'pending'
        await api.post('/participants', {
          userId: newUser.id,
          groupId: Number(selectedGroupId), // On s'assure que c'est un nombre
          status: 'pending',
          gifteeId: null
        });

        // On connecte et on redirige vers la vue utilisateur
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        navigate(`/group/${selectedGroupId}`);
      }

    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ width: '400px' }}>
        <h1 className="login-title">📝 Inscription</h1>
        
        <form onSubmit={handleRegister}>
          
          {/* IDENTITÉ */}
          <input 
            type="text" placeholder="Ton Nom (ex: Julie)" 
            value={name} onChange={(e) => setName(e.target.value)}
            className="login-input" required 
          />
          <input 
            type="email" placeholder="Email" 
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="login-input" required 
          />
          <input 
            type="password" placeholder="Mot de passe" 
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="login-input" required 
          />

          <div className="divider"></div>

          {/* CHOIX DU RÔLE */}
          <div style={{ textAlign: 'left', margin: '15px 0' }}>
            <label className="cursor-pointer flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox checkbox-primary"
                checked={isModerator}
                onChange={(e) => setIsModerator(e.target.checked)}
              />
              <span className="font-bold text-slate-700">Je veux organiser un Secret Santa 🎅</span>
            </label>
          </div>

          {/* CHAMP DYNAMIQUE */}
          {isModerator ? (
            <div className="animate-fade-in">
              <input 
                type="text" 
                placeholder="Nom de l'évènement (ex: Noël Famille 2024)" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)}
                className="login-input" 
                style={{ border: '2px solid #d32f2f' }}
                required 
              />
              <p className="text-xs text-gray-500 mt-1">Tu seras le modérateur de ce groupe.</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <select 
                className="login-input"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                required
              >
                <option value="">-- Choisis un groupe à rejoindre --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <button type="submit" className="login-button" style={{ marginTop: '20px' }}>
            {isModerator ? 'Créer mon espace' : "M'inscrire"}
          </button>
        </form>

        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          Déjà un compte ? <Link to="/" style={{ color: '#d32f2f', fontWeight: 'bold' }}>Connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;