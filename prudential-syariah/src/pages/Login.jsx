// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { loginUser, registerNewUser, getAllLeaders, initDB } from '../utils/auth';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [agentNumber, setAgentNumber] = useState('');
  const [role, setRole] = useState('agent');
  const [leaderId, setLeaderId] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Pastikan DB siap saat halaman dimuat agar Admin ter-inject dengan benar
  useEffect(() => {
    initDB();
  }, []);

  const leaders = getAllLeaders();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setMsg('');

    if (isRegister) {
      if (role === 'agent' && !leaderId) return setError('Pilih Leader Anda!');
      const res = registerNewUser(name, agentNumber, role, leaderId);
      if (res.success) {
        setMsg('Registrasi Berhasil! Silakan Login.');
        setIsRegister(false); setName(''); setAgentNumber('');
      } else {
        setError(res.message);
      }
    } else {
      const user = loginUser(name, agentNumber);
      if (user) onLogin(user);
      else setError('Nama atau Nomor Agen salah atau tidak terdaftar!');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* KIRI: BRANDING PRUDENTIAL SYARIAH (HIJAU EMERALD) */}
      <div className="hidden lg:flex w-1/2 bg-emerald-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Ornamen Desain */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-10 -right-10 w-72 h-72 bg-emerald-800 rounded-full opacity-50 blur-2xl"></div>

        <div className="relative z-10">
          <div className="bg-white text-emerald-700 font-extrabold text-xl px-4 py-2 inline-block rounded-lg mb-8 shadow-md tracking-wide">
            PRUDENTIAL <span className="font-medium">Syariah</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Community Panel <br/> <span className="text-emerald-200">Agency System</span>
          </h1>
          <p className="text-emerald-100 text-lg max-w-md leading-relaxed">
            Sistem terpadu untuk manajemen aktivitas agen, tracking penjualan, leaderboard real-time, dan materi edukasi.
          </p>
        </div>

        <div className="relative z-10 text-emerald-200 text-sm font-medium">
          &copy; 2026 Prudential Syariah. Internal Use Only.
        </div>
      </div>

      {/* KANAN: FORM LOGIN/REGISTER */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {isRegister ? 'Daftar Akun Baru' : 'Selamat Datang'}
            </h2>
            <p className="text-sm text-gray-500">
              {isRegister ? 'Lengkapi data di bawah untuk bergabung ke sistem.' : 'Masukkan kredensial Anda untuk mengakses dashboard.'}
            </p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-2 animate-in fade-in"><span className="w-2 h-2 rounded-full bg-red-600"></span> {error}</div>}
          {msg && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl mb-6 text-sm font-bold border border-emerald-100 flex items-center gap-2 animate-in fade-in"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> {msg}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Nama Lengkap (Sesuai KTP)</label>
              <input type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all bg-gray-50 focus:bg-white" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">{isRegister ? 'Buat Nomor Agen / ID' : 'Nomor Agen / ID'}</label>
              <input type="text" required value={agentNumber} onChange={e=>setAgentNumber(e.target.value.toUpperCase())} placeholder="Contoh: AGT-001" className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all bg-gray-50 focus:bg-white" />
            </div>
            
            {isRegister && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Peran</label>
                  <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-600 outline-none bg-gray-50 focus:bg-white">
                    <option value="agent">Agen</option>
                    <option value="leader">Leader</option>
                  </select>
                </div>
                {role === 'agent' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Pilih Leader</label>
                    <select required value={leaderId} onChange={e=>setLeaderId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-600 outline-none bg-gray-50 focus:bg-white">
                      <option value="" disabled>-- Leader --</option>
                      {leaders.map(l => <option key={l.agentNumber} value={l.agentNumber}>{l.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
            
            <button type="submit" className="w-full bg-emerald-700 text-white font-extrabold tracking-wide py-4 rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-md mt-2">
              {isRegister ? 'Daftarkan Akun' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'} 
              <button onClick={() => { setIsRegister(!isRegister); setError(''); setMsg(''); }} className="text-emerald-700 font-extrabold ml-1.5 hover:underline transition-all">
                {isRegister ? 'Login di sini' : 'Daftar di sini'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;