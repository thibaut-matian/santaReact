import axios from 'axios';

// LIEN 1 : Celui qui contient 'users' et 'participants'
const BASE_URL_MAIN = 'https://6926cea626e7e41498fba2d5.mockapi.io';

// LIEN 2 : Celui qui contient 'groups'
const BASE_URL_GROUPS = 'https://6926d48726e7e41498fbbb62.mockapi.io';

const api = axios.create({
  baseURL: BASE_URL_MAIN, // Par défaut, on va sur le lien 1
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTEUR : Le gendarme qui dirige la circulation
api.interceptors.request.use((config) => {
  // Si la demande concerne les "groups", on change de route vers le Lien 2
  if (config.url.includes('groups')) {
    config.baseURL = BASE_URL_GROUPS;
  }
  
  return config;
});

// --- VOS FONCTIONS RESTENT LES MÊMES ---

export const loginUser = async (email, password) => {
  const response = await api.get(`/users?email=${email}&password=${password}`);
  if (response.data.length > 0) {
    return response.data[0];
  } else {
    return null;
  }
};

export default api;

// Remplacez la fonction handleStatusChange dans GroupManage.jsx :

const handleStatusChange = async (participantId, newStatus) => {
    console.log('🔍 Changement de statut:', participantId, '->', newStatus);
    
    try {
        if (newStatus === 'rejected') {
            if (!window.confirm("Refuser ce participant ?")) return;
            
            console.log('🗑️ Suppression participation:', participantId);
            await api.delete(`/participants/${participantId}`);
            
            // Mise à jour locale
            setParticipants(participants.filter(p => p.id !== participantId));
            console.log('✅ Participation supprimée');
            
        } else if (newStatus === 'approved') {
            console.log('✅ Validation participation:', participantId);
            
            // CHANGEMENT : Utiliser PUT au lieu de PATCH pour MockAPI
            const currentParticipant = participants.find(p => p.id === participantId);
            
            const response = await api.patch(`/participants/${participantId}`, {
                ...currentParticipant,  // Garder toutes les propriétés existantes
                status: newStatus       // Changer seulement le status
            });
            
            console.log('📡 Réponse serveur:', response.data);
            
            // Mise à jour locale
            setParticipants(participants.map(p =>
                p.id === participantId ? { ...p, status: newStatus } : p
            ));
            
            console.log('🎉 Participant validé avec succès !');
        }
    } catch (error) {
        console.error('❌ ERREUR lors du changement de statut:', error);
        console.error('📡 Détails erreur:', error.response?.data);
        console.error('📊 Status HTTP:', error.response?.status);
        alert(`Erreur: ${error.message}`);
    }
};