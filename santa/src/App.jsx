import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import GroupManage from './pages/GroupManage';
import UserView from './pages/UserView';
import RegisterPage from './pages/RegisterPage';

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

        <Route path="/register" element={<RegisterPage />} /> 
      </Routes>
    </Router>
  );
}

export default App;