import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './UserView.css'; // On importe le CSS magique

const UserView = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  // On récupère l'utilisateur connecté
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('loading'); // pending, approved, draw_done
  const [gifteeName, setGifteeName] = useState(null); // Le nom de la cible
  const [isOpened, setIsOpened] = useState(false); // Cadeau ouvert ou pas ?

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!currentUser || !currentUser.id) {
        navigate('/');
        return;
      }

      try {
        console.log('🔍 Vérification statut utilisateur:', currentUser.id);
        
        // 1. Chercher ma participation
        const participantsRes = await api.get(`/participants?userId=${currentUser.id}&groupId=${groupId}`);
        
        if (participantsRes.data.length === 0) {
          setStatus('not_registered');
          setLoading(false);
          return;
        }

        const myParticipation = participantsRes.data[0];
        console.log('📊 Ma participation:', myParticipation);
        
        // 2. Vérifier le statut
        if (myParticipation.status === 'pending') {
          console.log('⏳ En attente de validation');
          setStatus('pending');
        } else if (myParticipation.status === 'approved') {
          // 3. Vérifier si j'ai une cible (tirage fait)
          if (myParticipation.gifteeId) {
            console.log('🎁 J\'ai une cible:', myParticipation.gifteeId);
            
            // Récupérer le nom de ma cible
            const gifteeRes = await api.get(`/users/${myParticipation.gifteeId}`);
            console.log('👤 Ma cible:', gifteeRes.data);
            
            setGifteeName(gifteeRes.data.name);
            setStatus('draw_done');
          } else {
            console.log('✅ Validé mais pas de tirage encore');
            setStatus('approved');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Erreur chargement statut:", error);
        setLoading(false);
      }
    };

    fetchUserStatus();

    // SOLUTION : Rechargement plus fréquent (toutes les 3 secondes)
    const interval = setInterval(fetchUserStatus, 3000);
    return () => clearInterval(interval);
  }, [groupId, currentUser, navigate]);

  const handleOpenGift = () => {
    setIsOpened(true);
    // Ici, tu pourrais jouer un son de grelot si tu voulais ! 🔔
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement de la magie...</div>;

  return (
    <div className="christmas-bg flex flex-col items-center justify-center min-h-screen relative p-4">
      
      {/* --- FLOCONS DE NEIGE (Décoration) --- */}
      <div className="snowflake">❄</div><div className="snowflake">❅</div>
      <div className="snowflake">❆</div><div className="snowflake">❄</div>
      <div className="snowflake">❅</div><div className="snowflake">❆</div>
      <div className="snowflake">❄</div>

      {/* --- NAVBAR --- */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between z-10 text-white">
        <h1 className="text-xl font-bold">🎅 Secret Santa</h1>
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm">Quitter</button>
      </nav>

      {/* --- CONTENU CENTRAL --- */}
      <div className="z-10 text-center max-w-lg w-full">
        
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-400 to-yellow-300 mb-8 drop-shadow-sm">
          Bonjour {currentUser.name} !
        </h2>

        {/* CAS 1 : EN ATTENTE */}
        {status === 'pending' && (
          <div className="alert alert-warning shadow-lg">
            <span>⏳ Ton inscription est en attente de validation par le modérateur.</span>
          </div>
        )}

        {/* CAS 2 : ATTENTE DU TIRAGE */}
        {status === 'waiting_draw' && (
          <div className="card bg-white/10 backdrop-blur-md border border-white/20 p-8">
            <div className="text-6xl mb-4">🎄</div>
            <h3 className="text-2xl font-bold text-white mb-2">Patience...</h3>
            <p className="text-slate-200">
              Le modérateur n'a pas encore lancé le tirage au sort. Reviens un peu plus tard !
            </p>
          </div>
        )}

        {/* CAS 3 : LE CADEAU EST LÀ ! */}
        {status === 'draw_done' && (
          <div>
            {!isOpened ? (
              // BOITE FERMÉE
              <div 
                onClick={handleOpenGift} 
                className="gift-container cursor-pointer flex flex-col items-center"
              >
                <div className="text-[150px] drop-shadow-2xl shake-it">🎁</div>
                <p className="text-white text-xl mt-4 animate-pulse font-bold">
                  Clique pour découvrir ton binôme !
                </p>
              </div>
            ) : (
              // BOITE OUVERTE (RÉSULTAT)
              <div className="result-card bg-white text-slate-900 p-10 rounded-3xl shadow-2xl border-4 border-red-500">
                <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Ta mission pour Noël</p>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Tu offres un cadeau à :</h3>
                
                <div className="divider my-2"></div>
                
                <h1 className="text-5xl font-extrabold text-red-600 my-6">
                  {gifteeName}
                </h1>
                
                <div className="bg-red-50 p-4 rounded-xl mt-4">
                  <p className="text-red-800 text-sm">
                    🤫 Shhh... Garde le secret jusqu'au jour J !
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserView;