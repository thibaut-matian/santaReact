import axios from 'axios';
import { SecurityUtils } from '../utils/security.js';

const BASE_URL_MAIN = 'https://6926cea626e7e41498fba2d5.mockapi.io';
const BASE_URL_GROUPS = 'https://6926d48726e7e41498fbbb62.mockapi.io';

const api = axios.create({
  baseURL: BASE_URL_MAIN,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (config.url.includes('groups')) {
    config.baseURL = BASE_URL_GROUPS;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Erreur de connexion');
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  try {
    if (!SecurityUtils.isValidEmail(email)) {
      throw new Error('Format d\'email invalide');
    }
    
    if (!SecurityUtils.isValidPassword(password)) {
      throw new Error('Mot de passe invalide');
    }
    
    const cleanEmail = SecurityUtils.sanitize(email.toLowerCase().trim());
    
    const response = await api.get('/users');
    const users = response.data;
    
    const user = users.find(u => 
      u.email?.toLowerCase() === cleanEmail && u.password === password
    );
    
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }
    
    return {
      id: user.id,
      name: SecurityUtils.sanitize(user.name),
      email: cleanEmail,
      role: user.role
    };
    
  } catch (error) {
    throw error;
  }
};

export default api;