// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './utils/auth';

// Import Semua Halaman
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LeaderDashboard from './pages/LeaderDashboard';
import AgentDashboard from './pages/AgentDashboard';
import Documentation from './pages/Documentation';
import Communities from './pages/Communities';
import Tasks from './pages/Tasks';
import SalesTracking from './pages/SalesTracking';

// Proteksi Route berdasarkan Role
const PrivateRoute = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" />;
  
  // Jika rute memiliki batasan role dan user tidak termasuk, lempar kembali ke root
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  // 🔥 FIX 1: Jadikan user sebagai State agar aplikasi menyadari jika ada perubahan (login/logout)
  const [user, setUser] = useState(getCurrentUser());

  return (
    <Router>
      <Routes>
        {/* 🔥 FIX 2: Kirim fungsi setUser ke prop onLogin. 
            Jika user sudah login, arahkan langsung ke root '/' */}
        <Route path="/login" element={
          !user ? <Login onLogin={(userData) => setUser(userData)} /> : <Navigate to="/" />
        } />
        
        {/* Auto Redirect Root ke Halaman yang Sesuai Role */}
        <Route path="/" element={
          !user ? <Navigate to="/login" /> :
          user.role === 'admin' ? <Navigate to="/admin" /> :
          user.role === 'leader' ? <Navigate to="/leader" /> :
          <Navigate to="/agent" />
        } />

        {/* Rute Dashboard Utama */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/leader" element={<PrivateRoute allowedRoles={['leader']}><LeaderDashboard /></PrivateRoute>} />
        <Route path="/agent" element={<PrivateRoute allowedRoles={['agent']}><AgentDashboard /></PrivateRoute>} />

        {/* Rute Tambahan (Bisa diakses semua role yang login) */}
        <Route path="/documentation" element={<PrivateRoute><Documentation /></PrivateRoute>} />
        <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/sales" element={<PrivateRoute><SalesTracking /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;