// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, initDB } from '../utils/auth';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [name, setName] = useState('');
  const [agentNumber, setAgentNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    initDB(); // Generate data awal saat halaman login dimuat
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const user = loginUser(name, agentNumber);
    
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'leader') navigate('/leader');
      else navigate('/agent');
    } else {
      setError('Akun tidak ditemukan. Pastikan Nama dan Nomor Agen sesuai atau hubungi Admin.');
    }
  };

  // Tombol jalan pintas untuk prototype (Bisa dihapus saat rilis)
  const quickLogin = (role) => {
    if(role === 'admin') { setName('Admin Utama'); setAgentNumber('ADMIN-001'); }
    if(role === 'leader') { setName('Ahmad Leader'); setAgentNumber('LDR-001'); }
    if(role === 'agent') { setName('Siti Agent'); setAgentNumber('AGT-001'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-green-900">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-green-900 p-4 rounded-full text-white mb-4">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prudential Syariah</h2>
          <p className="text-gray-500 text-sm text-center">Masuk ke portal komunitas Anda.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Agen</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-900"
              value={agentNumber}
              onChange={(e) => setAgentNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
            Login Securely <Lock className="w-4 h-4" />
          </button>
        </form>

        <hr className="my-6 border-gray-200" />
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">PILIH AKUN DEMO</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => quickLogin('admin')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Admin</button>
            <button onClick={() => quickLogin('leader')} className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Leader</button>
            <button onClick={() => quickLogin('agent')} className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">Agent</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;