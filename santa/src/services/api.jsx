import axios from 'axios';

// LIEN 1 : Celui qui contient 'users' et 'participants'
const BASE_URL_MAIN = 'https://6926cea626e7e41498fba2d5.mockapi.io';

// LIEN 2 : Celui qui contient 'groups'  
const BASE_URL_GROUPS = 'https://6926d48726e7e41498fbbb62.mockapi.io';

const api = axios.create({
  baseURL: BASE_URL_MAIN,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes de timeout
});

// INTERCEPTEUR amélioré
api.interceptors.request.use((config) => {
  console.log('🌐 Requête API:', config.method.toUpperCase(), config.url);
  
  if (config.url.includes('groups')) {
    config.baseURL = BASE_URL_GROUPS;
    console.log('🔄 Redirection vers MockAPI Groups');
  }
  
  return config;
});

// Intercepteur de réponse pour debug
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse API réussie:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Erreur API:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  try {
    console.log('🔑 Tentative de connexion:', email);
    const response = await api.get(`/users?email=${email}&password=${password}`);
    console.log('👤 Utilisateurs trouvés:', response.data.length);
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('❌ Erreur login:', error);
    throw error;
  }
};

export default api;