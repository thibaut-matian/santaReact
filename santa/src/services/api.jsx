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