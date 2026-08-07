// src/pages/LeaderDashboard.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BannerCarousel from '../components/BannerCarousel';
import { 
  getCurrentUser, getAgentsByLeader, getReportsForLeader, 
  getTeamTotalAPI, getAgentTotalAPI, updateUserTarget 
} from '../utils/auth';
import { TrendingUp, ArrowRight, MessageSquareText, Clock, Target, Edit2, X, Award } from 'lucide-react';

const LeaderDashboard = () => {
  const user = getCurrentUser();
  const [myAgents, setMyAgents] = useState([]);
  const [teamReports, setTeamReports] = useState([]);
  
  // Data Real-time API
  const [teamTotalAPI, setTeamTotalAPI] = useState(0);
  const [teamTarget, setTeamTarget] = useState(user?.target || 2000);

  // State Modal Set Target
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetType, setTargetType] = useState(''); // 'team' atau 'agent'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newTargetValue, setNewTargetValue] = useState('');

  // State Modal View All (Progress Bar)
  const [showViewAll, setShowViewAll] = useState(false);

  const loadDashboardData = () => {
    if (user) {
      // Refresh user data (kalau targetnya diubah)
      const refreshedUser = getCurrentUser();
      setTeamTarget(refreshedUser.target || 2000);

      const agents = getAgentsByLeader(refreshedUser.agentNumber);
      // Sematkan data kalkulasi ke tiap agen
      const enrichedAgents = agents.map(agent => {
        const achieved = getAgentTotalAPI(agent.agentNumber);
        const target = agent.target || 150;
        const percentage = target > 0 ? (achieved / target) * 100 : 0;
        let status = 'Needs Focus';
        let color = 'text-red-700 bg-red-100';
        
        if (percentage >= 100) { status = 'Target Reached'; color = 'text-blue-700 bg-blue-100'; }
        else if (percentage >= 50) { status = 'On Track'; color = 'text-green-700 bg-green-100'; }

        return { ...agent, achieved, target, percentage, status, color };
      });
      
      // Urutkan berdasarkan persentase tertinggi
      enrichedAgents.sort((a, b) => b.percentage - a.percentage);
      
      setMyAgents(enrichedAgents);
      setTeamTotalAPI(getTeamTotalAPI(refreshedUser.agentNumber));
      setTeamReports(getReportsForLeader(refreshedUser.agentNumber));
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  const openSetTarget = (type, agent = null) => {
    setTargetType(type);
    if (type === 'team') {
      setNewTargetValue(teamTarget);
    } else {
      setSelectedAgent(agent);
      setNewTargetValue(agent.target);
    }
    setShowTargetModal(true);
  };

  const handleSaveTarget = (e) => {
    e.preventDefault();
    if (targetType === 'team') {
      updateUserTarget(user.agentNumber, newTargetValue);
    } else if (targetType === 'agent' && selectedAgent) {
      updateUserTarget(selectedAgent.agentNumber, newTargetValue);
    }
    setShowTargetModal(false);
    loadDashboardData(); // Refresh data
  };

  const teamProgressPercent = teamTarget > 0 ? (teamTotalAPI / teamTarget) * 100 : 0;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assalamualaikum, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Berikut adalah ringkasan kinerja dan laporan terbaru dari tim Anda.</p>
      </div>

      <BannerCarousel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: Agent Monitoring & Reports */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TABEL AGENT */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Agent Monitoring</h2>
              <button onClick={() => setShowViewAll(true)} className="text-sm font-medium text-gray-500 hover:text-green-900 flex items-center gap-1 transition-colors">
                View All Progress <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr className="text-sm text-gray-600">
                    <th className="py-4 px-6 font-semibold">Agent Name</th>
                    <th className="py-4 px-6 font-semibold">Target (API)</th>
                    <th className="py-4 px-6 font-semibold">Achieved</th>
                    <th className="py-4 px-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myAgents.length > 0 ? (
                    myAgents.slice(0, 5).map((agent, i) => ( // Hanya tampil 5 teratas di tabel depan
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{agent.name}</p>
                              <p className="text-xs text-gray-400">{agent.agentNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 font-medium group">
                          IDR {agent.target.toLocaleString('id-ID')} Jt
                          <button onClick={() => openSetTarget('agent', agent)} className="ml-2 text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="w-3 h-3 inline" />
                          </button>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-gray-900">
                          IDR {agent.achieved.toLocaleString('id-ID')} Jt
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold flex items-center w-max gap-1.5 ${agent.color}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {agent.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500 text-sm italic">
                        Belum ada agent yang didaftarkan. Minta admin menambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LIST LAPORAN MASUK DARI AGENT */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-green-900" /> Laporan Progress Terbaru
              </h2>
            </div>
            <div className="space-y-4">
              {teamReports.length > 0 ? (
                teamReports.slice(0,4).map(report => (
                  <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {report.agentName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{report.agentName}</h4>
                          <p className="text-xs text-gray-500 font-medium">{report.type}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {report.date}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed p-8 text-center">
                  <p className="text-gray-500 text-sm">Belum ada laporan aktivitas yang dikirimkan oleh tim Anda.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Performance Summary */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Summary</h2>
          <div className="bg-white rounded-2xl shadow-sm border-t-4 border-t-green-900 border-x border-b border-gray-100 p-6 relative overflow-hidden group">
            
            <button onClick={() => openSetTarget('team')} className="absolute top-4 right-4 text-gray-300 hover:text-green-900 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all z-10" title="Edit Target Circle">
              <Edit2 className="w-4 h-4" />
            </button>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Circle API</p>
            <h3 className="text-4xl font-extrabold text-gray-900 mb-2">
              <span className="text-lg text-gray-400 font-bold mr-1">IDR</span>
              {teamTotalAPI >= 1000 ? (teamTotalAPI/1000).toFixed(2) + ' M' : teamTotalAPI + ' Jt'}
            </h3>
            
            {teamProgressPercent >= 100 ? (
              <p className="text-sm text-blue-600 font-bold flex items-center gap-1 mb-8">
                <Award className="w-4 h-4" /> Target Terlampaui!
              </p>
            ) : (
              <p className="text-sm text-green-600 font-medium flex items-center gap-1 mb-8">
                <TrendingUp className="w-4 h-4" /> Keep pushing!
              </p>
            )}

            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-600">Annual Target Progress</span>
                <span className="text-gray-900 font-bold">{teamProgressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner relative">
                <div 
                  className={`h-3 rounded-full relative transition-all duration-1000 ${teamProgressPercent >= 100 ? 'bg-blue-600' : 'bg-green-900'}`} 
                  style={{ width: `${Math.min(teamProgressPercent, 100)}%` }}
                >
                   <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 skew-x-12"></div>
                </div>
              </div>
              <p className="text-xs text-right text-gray-500 font-medium">Target: IDR {teamTarget.toLocaleString('id-ID')} Juta</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL SET TARGET --- */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-900" /> 
                Atur Target {targetType === 'team' ? 'Circle' : 'Agen'}
              </h3>
              <button onClick={() => setShowTargetModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTarget} className="p-6">
              {targetType === 'agent' && (
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  Mengatur target individu untuk: <strong className="text-blue-800">{selectedAgent?.name}</strong>
                </p>
              )}
              <label className="block text-sm font-bold text-gray-700 mb-2">Target API Tahunan (Juta Rp)</label>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                <input 
                  type="number" required autoFocus
                  value={newTargetValue} onChange={e => setNewTargetValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-900 font-semibold text-lg"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowTargetModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2.5 bg-green-900 text-white rounded-xl text-sm font-bold hover:bg-green-800 shadow-sm">Simpan Target</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL VIEW ALL (PROGRESS BAR) --- */}
      {showViewAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" /> Leaderboard & API Progress
                </h2>
                <p className="text-sm text-gray-500 mt-1">Pantau pencapaian individu setiap agen di Circle Anda.</p>
              </div>
              <button onClick={() => setShowViewAll(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-slate-50">
              {myAgents.length > 0 ? (
                myAgents.map((agent, index) => (
                  <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative group">
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-lg border-2 border-white shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{agent.name} <span className="text-xs font-normal text-gray-400 ml-1">({agent.agentNumber})</span></h4>
                          <button onClick={() => {setShowViewAll(false); openSetTarget('agent', agent);}} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            <Edit2 className="w-3 h-3" /> UBAH TARGET
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Achieved</p>
                        <p className="text-lg font-extrabold text-green-700">IDR {agent.achieved.toLocaleString('id-ID')} Jt</p>
                      </div>
                    </div>

                    <div className="relative pt-2">
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className={agent.percentage >= 100 ? 'text-blue-600' : 'text-gray-600'}>{agent.percentage.toFixed(1)}%</span>
                        <span className="text-gray-400">Target: {agent.target.toLocaleString('id-ID')} Jt</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-1000 ${agent.percentage >= 100 ? 'bg-blue-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(agent.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Tidak ada data agen untuk ditampilkan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default LeaderDashboard;