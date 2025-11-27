import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SecureText } from '../components/SecureText';
import { useSecureStorage } from '../components/SecureText';


const UserView = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const { getSecureItem, removeSecureItem } = useSecureStorage();
  const currentUser = getSecureItem('currentUser');

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('loading');
  const [giftee, setGiftee] = useState(null); 
  const [isOpened, setIsOpened] = useState(false); 

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!currentUser || !currentUser.id) {
        navigate('/');
        return;
      }

      try {
        const groupRes = await api.get(`/groups/${groupId}`);
        setGroup(groupRes.data);

        const participantsRes = await api.get(`/participants?userId=${currentUser.id}&groupId=${groupId}`);
        
        if (participantsRes.data.length === 0) {
          setStatus('not_registered');
          setLoading(false);
          return;
        }

        const myParticipation = participantsRes.data[0];
        
        if (myParticipation.status === 'pending') {
          setStatus('pending');
        } else if (myParticipation.status === 'approved') {
          if (myParticipation.gifteeId) {
            
            const gifteeRes = await api.get(`/users/${myParticipation.gifteeId}`);
            
            setGiftee(gifteeRes.data);
            setStatus('draw_done');
          } else {
            setStatus('approved');
          }
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchUserStatus();

    const interval = setInterval(fetchUserStatus, 3000);
    return () => clearInterval(interval);
  }, [groupId, currentUser, navigate]);

  const handleOpenGift = () => {
    setIsOpened(true);
  };

  const handleLogout = () => {
    removeSecureItem('currentUser');
    navigate('/');
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement de la magie...</div>;

  return (
    <div className="christmas-bg flex flex-col items-center justify-center min-h-screen relative p-4">
      
     
      <div className="snowflake">❄</div><div className="snowflake">❅</div>
      <div className="snowflake">❆</div><div className="snowflake">❄</div>
      <div className="snowflake">❅</div><div className="snowflake">❆</div>
      <div className="snowflake">❄</div>

      
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between z-10 text-white">
        <h1 className="text-xl font-bold"> Secret Santa</h1>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm">Déconnexion sécurisée</button>
      </nav>

      
      <div className="z-10 text-center max-w-lg w-full">
        
       
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
          Bonjour <SecureText>{currentUser?.name}</SecureText> ! 
        </h1>

        
        {group && (
          <h2 className="text-2xl font-bold text-white mb-4">
            <SecureText>{group?.name}</SecureText>
          </h2>
        )}

        
        {status === 'not_registered' && (
          <div className="alert alert-error shadow-lg">
            <span> Tu n'es pas inscrit dans ce groupe !</span>
          </div>
        )}

        {status === 'pending' && (
          <div className="alert alert-warning shadow-lg">
            <span>⏳ Ton inscription est en attente de validation par le modérateur.</span>
          </div>
        )}

        
        {status === 'approved' && (
          <div className="card bg-white/10 backdrop-blur-md border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Patience...</h3>
            <p className="text-slate-200">
              Le modérateur n'a pas encore lancé le tirage au sort. Reviens un peu plus tard !
            </p>
            <div className="mt-4">
              <div className="loading loading-dots loading-lg text-primary"></div>
            </div>
          </div>
        )}

        {status === 'draw_done' && (
          <div>
            {!isOpened ? (
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
              <div className="result-card bg-white text-slate-900 p-10 rounded-3xl shadow-2xl border-4 border-red-500">
                <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Ta mission pour Noël</p>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Tu offres un cadeau à :</h3>
                
                <div className="divider my-2"></div>
                
                <h1 className="text-5xl font-extrabold text-red-600 my-6">
                  <SecureText>{giftee?.name}</SecureText>
                </h1>
                
                <div className="bg-red-50 p-4 rounded-xl mt-4">
                  <p className="text-red-800 text-sm">
                     Shhh... Garde le secret jusqu'au jour J !
                  </p>
                </div>

                {/* Informations supplémentaires sécurisées */}
                {giftee?.email && (
                  <div className="bg-blue-50 p-3 rounded-xl mt-3">
                    <p className="text-blue-800 text-xs">
                      📧 Contact : <SecureText>{giftee.email}</SecureText>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message d'erreur générique */}
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-white">Chargement de la magie de Noël...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserView;