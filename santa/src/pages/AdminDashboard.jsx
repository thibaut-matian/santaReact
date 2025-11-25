import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  // On récupère l'user connecté (ou un "invité" si vide pour éviter le crash)
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Admin' };

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error("Erreur de chargement", error);
      }
    };
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      try {
        await api.delete(`/users/${id}`);
        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="min-h-screen text-slate-200">
      
      {/* NAVBAR */}
      <nav className="navbar bg-slate-900/80 backdrop-blur-md shadow-md fixed top-0 z-50 text-white">
        <div className="flex-1">
          <button className="btn btn-ghost text-xl text-blue-400">
            SecretSanta <span className="text-white font-normal opacity-70">Admin</span>
          </button>
        </div>
        <div className="flex-none gap-4">
          <span className="badge badge-primary">
            {currentUser.name}
          </span>
          <button 
            onClick={handleLogout} 
            className="btn btn-ghost btn-sm text-error hover:bg-red-900/20"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="pt-24 px-4 max-w-7xl mx-auto pb-10 space-y-8">
        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            👥 Gestion des Utilisateurs
          </h2>
          
          <div className="overflow-x-auto">
            <table className="table text-white w-full">
              <thead>
                <tr className="text-slate-300 border-b border-white/20">
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 border-b border-white/10">
                    <td>#{user.id}</td>
                    <td className="font-bold">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'badge-primary' : 
                        user.role === 'moderator' ? 'badge-secondary' : 'badge-ghost'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-xs btn-error btn-outline"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'admin'} 
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;