import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import GroupManage from './pages/GroupManage';

// --- COMPOSANTS TEMPORAIRES (On les déplacera plus tard dans src/pages) ---







// 4. Vue Utilisateur (Inscription ou Résultat)
const UserView = () => (
  <div style={{ padding: '20px' }}>
    <h2> Mon Secret Santa</h2>
    <p>Ici : Statut de mon inscription ou révélation du binôme.</p>
  </div>
);

// --- CONFIGURATION DU ROUTEUR ---

function App() {
  return (
    <Router>
      <Routes>
        {/* Route publique : Accueil / Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Routes Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Routes Modérateur (Gestion d'un groupe spécifique par son ID) */}
        <Route path="/group-manage/:groupId" element={<GroupManage />} />

        {/* Routes Utilisateur (Vue d'un groupe pour s'inscrire) */}
        <Route path="/group/:groupId" element={<UserView />} />
      </Routes>
    </Router>
  );
}

export default App;