// src/pages/AgentDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BannerCarousel from '../components/BannerCarousel';
import { getCurrentUser, addReport, getAgentTotalAPI, getTasks } from '../utils/auth';
import { Send, CheckCircle, TrendingUp, Briefcase, ListTodo, ArrowRight } from 'lucide-react';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [totalAPI, setTotalAPI] = useState(getAgentTotalAPI(user?.agentNumber));

  // State Form Laporan Teks
  const [reportType, setReportType] = useState('Daily Progress Report');
  const [description, setDescription] = useState('');
  const [notifReport, setNotifReport] = useState(false);

  // Ambil Data Tasks untuk Overview Singkat
  const myTasks = getTasks().filter(t => t.agentNumber === user?.agentNumber);
  const completedTasks = myTasks.filter(t => t.status === 'Completed').length;
  const progressPercent = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0;
  const pendingTasks = myTasks.filter(t => t.status !== 'Completed').slice(0, 3); // Ambil 3 tugas tertunda saja

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (description.trim() !== '') {
      addReport({ agentName: user.name, agentNumber: user.agentNumber, leaderId: user.leaderId, type: reportType, description });
      setNotifReport(true); setDescription(''); setReportType('Daily Progress Report');
      setTimeout(() => setNotifReport(false), 3000);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assalamualaikum, {user?.name}</h1>
          <p className="text-gray-500 mt-1">Fokus pada proses, hasil akan mengikuti.</p>
        </div>
        <div 
          onClick={() => navigate('/sales')}
          className="text-right bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors group"
        >
          <p className="text-xs text-gray-400 font-bold uppercase group-hover:text-blue-600 transition-colors">Pencapaian API Anda <ArrowRight className="w-3 h-3 inline ml-1"/></p>
          <p className="text-xl font-extrabold text-green-700">IDR {totalAPI.toLocaleString('id-ID')} Juta</p>
        </div>
      </div>

      <BannerCarousel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: TO-DO LIST OVERVIEW */}
        <div 
          onClick={() => navigate('/tasks')}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 group-hover:bg-blue-400 transition-colors"></div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">To-Do List Hari Ini</h2>
            <ListTodo className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="mb-6 flex justify-between items-end">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{progressPercent}%</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Tugas Selesai</p>
            </div>
            <p className="text-sm font-bold text-blue-600">Buka Detail Task &rarr;</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden shadow-inner">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{width: `${progressPercent}%`}}></div>
          </div>

          <div className="flex-1 space-y-3">
             <h4 className="text-xs font-bold text-gray-400 uppercase">Prioritas Tertunda:</h4>
             {pendingTasks.length === 0 ? (
               <p className="text-sm text-gray-500 italic">Semua tugas beres! Hebat.</p>
             ) : (
               pendingTasks.map(t => (
                 <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                   <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
                   <p className="text-sm font-semibold text-gray-700 truncate">{t.title}</p>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* KOLOM KANAN: REPORT SUBMISSION (KUALITATIF) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-900"></div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Laporan Aktivitas</h2>
            <Briefcase className="w-5 h-5 text-green-900" />
          </div>
          <p className="text-sm text-gray-500 mb-6">Kirim progres lapangan, kendala, atau evaluasi mingguan ke Leader.</p>

          {notifReport && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle className="w-5 h-5 shrink-0" /> Laporan berhasil dikirim!
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="flex-1 flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jenis Laporan</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none bg-white">
                <option>Daily Progress Report</option>
                <option>Kendala Lapangan</option>
                <option>Weekly Evaluation</option>
              </select>
            </div>
            
            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deskripsi Detail</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none resize-none" placeholder="Berikan detail aktivitas, hasil pertemuan, dll..."></textarea>
            </div>
            
            <button type="submit" className="w-full bg-green-900 text-white font-bold py-3.5 rounded-xl hover:bg-green-800 transition-colors mt-2 flex items-center justify-center gap-2 shadow-sm">
              <Send className="w-4 h-4" /> Kirim Laporan ke Leader
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
};

export default AgentDashboard;