import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Admin' };

  // --- ÉTATS ---
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // On lance les 3 requêtes en parallèle pour aller plus vite
        const [usersRes, groupsRes, partsRes] = await Promise.all([
          api.get('/users'),
          // On récupère les groupes (et on peut demander les infos du modérateur via expand si besoin, ici on fera le lien manuellement)
          api.get('/groups'), 
          // On récupère TOUS les participants avec leurs infos utilisateur
          api.get('/participants?_expand=user')
        ]);

        setUsers(usersRes.data);
        setGroups(groupsRes.data);
        setParticipants(partsRes.data);
        setLoading(false);

      } catch (error) {
        console.error("Erreur de chargement Admin", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  // Suppression d'un utilisateur globalement
  const handleDeleteUser = async (id) => {
    if (window.confirm("Attention : Supprimer un utilisateur le retirera aussi de tous les groupes. Continuer ?")) {
      try {
        await api.delete(`/users/${id}`);
        // Mise à jour locale de toutes les listes pour éviter de recharger
        setUsers(users.filter(u => u.id !== id));
        setParticipants(participants.filter(p => p.userId !== id));
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  // Suppression d'un groupe entier
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Supprimer ce groupe et tout son historique de tirage ?")) {
      try {
        await api.delete(`/groups/${groupId}`);
        setGroups(groups.filter(g => g.id !== groupId));
        // Idéalement, il faudrait aussi nettoyer les participants orphelins, 
        // mais json-server ne fait pas de cascade delete automatique.
      } catch (error) {
        alert("Erreur suppression groupe");
      }
    }
  };

  // Fonction utilitaire pour trouver les participants d'un groupe spécifique
  const getGroupMembers = (groupId) => {
    return participants.filter(p => p.groupId === groupId);
  };

  if (loading) return <div className="text-center mt-20 text-white">Chargement du Dashboard...</div>;

  return (
    <div className="min-h-screen text-slate-200 pb-20">
      
      {/* NAVBAR */}
      <nav className="navbar bg-slate-900/80 backdrop-blur-md shadow-md fixed top-0 z-50 text-white">
        <div className="flex-1">
          <button className="btn btn-ghost text-xl text-blue-400">
            SecretSanta <span className="text-white font-normal opacity-70">SuperAdmin</span>
          </button>
        </div>
        <div className="flex-none gap-4">
          <span className="badge badge-primary">{currentUser.name}</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm text-error">Déconnexion</button>
        </div>
      </nav>

      <main className="pt-24 px-4 max-w-7xl mx-auto space-y-12">

        {/* --- SECTION 1 : VUE PAR GROUPES (Ce que tu voulais) --- */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
            📂 Gestion des Groupes & Membres
          </h2>

          <div className="grid gap-4">
            {groups.length === 0 ? (
                <p className="text-gray-400">Aucun groupe créé pour le moment.</p>
            ) : (
                groups.map((group) => {
                    const members = getGroupMembers(group.id);
                    // On trouve le nom du modérateur dans la liste des users
                    const moderator = users.find(u => u.id === group.moderatorId);

                    return (
                        // Accordéon DaisyUI
                        <div key={group.id} className="collapse collapse-arrow bg-slate-800 border border-slate-700 shadow-lg rounded-xl">
                            <input type="checkbox" name="my-accordion-2" /> 
                            
                            {/* Titre de l'accordéon (Le Groupe) */}
                            <div className="collapse-title text-xl font-medium text-white flex justify-between items-center pr-10">
                                <div>
                                    <span className="text-indigo-400 font-bold mr-2">#{group.id}</span>
                                    {group.name}
                                    <span className="text-sm font-normal text-gray-400 ml-3">
                                        (Modo: {moderator ? moderator.name : 'Inconnu'})
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 z-10">
                                    <span className="badge badge-neutral">{members.length} participants</span>
                                    {group.isDrawDone ? 
                                        <span className="badge badge-success">Tirage fait</span> : 
                                        <span className="badge badge-warning">En attente</span>
                                    }
                                </div>
                            </div>

                            {/* Contenu de l'accordéon (La liste des membres) */}
                            <div className="collapse-content bg-slate-900/50">
                                <div className="overflow-x-auto mt-4">
                                    <table className="table table-xs text-slate-300 w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-500">
                                                <th>Nom</th>
                                                <th>Email</th>
                                                <th>Statut</th>
                                                <th>Cible (Si tirage)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map(member => {
                                                // Trouver le nom de la cible si elle existe
                                                const giftee = users.find(u => u.id === member.gifteeId);
                                                return (
                                                    <tr key={member.id} className="border-b border-white/5">
                                                        <td className="font-bold text-white">
                                                            {member.user ? member.user.name : 'User supprimé'}
                                                        </td>
                                                        <td>{member.user?.email}</td>
                                                        <td>
                                                            {member.status === 'approved' ? <span className="text-green-400">Validé</span> : 
                                                             member.status === 'pending' ? <span className="text-orange-400">En attente</span> : 
                                                             <span className="text-red-400">Refusé</span>}
                                                        </td>
                                                        <td>
                                                            {giftee ? <span className="text-indigo-300">🎁 {giftee.name}</span> : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {members.length === 0 && <tr><td colSpan="4" className="text-center py-2">Aucun inscrit</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Bouton suppression groupe */}
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="btn btn-sm btn-error btn-outline"
                                    >
                                        Supprimer ce groupe
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </section>


        {/* --- SECTION 2 : ANNUAIRE GLOBAL (Pour info) --- */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
          <h2 className="text-xl font-bold text-white mb-4">
            🌍 Annuaire Global ({users.length} comptes)
          </h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="table table-pin-rows text-white w-full">
              <thead>
                <tr className="text-slate-400 bg-slate-900">
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 border-b border-white/10">
                    <td>#{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>
                      <button 
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'admin'} 
                      >
                        ✖
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