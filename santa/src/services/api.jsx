import axios from 'axios';

// On crée une instance d'axios configurée pour ton json-server
const api = axios.create({
  baseURL: 'http://localhost:3001', // L'adresse de ton json-server
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (email, password) => {
  // On demande à json-server : "Donne-moi les users qui ont cet email ET ce mot de passe"
  const response = await api.get(`/users?email=${email}&password=${password}`);
  
  // Si le tableau retourné n'est pas vide, c'est qu'on a trouvé l'utilisateur
  if (response.data.length > 0) {
    return response.data[0]; // On retourne l'objet utilisateur
  } else {
    return null; // Mauvais identifiants
  }
};
export default api;