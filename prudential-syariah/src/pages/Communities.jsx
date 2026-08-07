// src/pages/Communities.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAllLeaders, getAllUsers, getAgentsByLeader, getPremiumInputs } from '../utils/auth';
import { Users, TrendingUp, ChevronDown, ChevronUp, Award, Medal, Filter, CalendarDays } from 'lucide-react';

const Communities = () => {
  const [activeTab, setActiveTab] = useState('circle'); 
  const [teams, setTeams] = useState([]);
  const [globalAgents, setGlobalAgents] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);

  // --- STATE FILTER WAKTU BARU ---
  const [timeFilter, setTimeFilter] = useState('current_month'); // 'current_month', 'current_year', 'custom_month', 'custom_range'
  const [customMonth, setCustomMonth] = useState(''); // Format: 'YYYY-MM'
  const [customRangeStart, setCustomRangeStart] = useState(''); // Format: 'YYYY-MM'
  const [customRangeEnd, setCustomRangeEnd] = useState(''); // Format: 'YYYY-MM'

  useEffect(() => {
    calculateLeaderboards();
  }, [timeFilter, customMonth, customRangeStart, customRangeEnd]);

  const calculateLeaderboards = () => {
    const allInputs = getPremiumInputs();
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const currentYearStr = `${now.getFullYear()}`;

    // Logika Filtering Cerdas berdasarkan Dropdown
    const filteredInputs = allInputs.filter(input => {
       const inputMonth = input.date.substring(0, 7); // Ambil 'YYYY-MM' dari 'YYYY-MM-DD...'
       
       if (timeFilter === 'current_month') return inputMonth === currentMonthStr;
       if (timeFilter === 'current_year') return input.date.startsWith(currentYearStr);
       if (timeFilter === 'custom_month' && customMonth) return inputMonth === customMonth;
       if (timeFilter === 'custom_range' && customRangeStart && customRangeEnd) {
         // Perbandingan String YYYY-MM sangat aman secara alfabetikal/numerik
         return inputMonth >= customRangeStart && inputMonth <= customRangeEnd;
       }
       return true; // Jika filter custom belum diisi, tampilkan semua default
    });

    const getFilteredAPI = (agentNum) => filteredInputs.filter(i => i.agentNumber === agentNum).reduce((sum, i) => sum + i.amount, 0);

    // 1. Build Circle Teams
    const leaders = getAllLeaders();
    const teamsData = leaders.map(leader => {
      const agents = getAgentsByLeader(leader.agentNumber);
      const agentsWithApe = agents.map(agent => ({ ...agent, ape: getFilteredAPI(agent.agentNumber) }));
      agentsWithApe.sort((a, b) => b.ape - a.ape);
      return { 
        leader, 
        agents: agentsWithApe, 
        totalApe: agentsWithApe.reduce((sum, a) => sum + a.ape, 0) + getFilteredAPI(leader.agentNumber) 
      };
    });
    teamsData.sort((a, b) => b.totalApe - a.totalApe);
    setTeams(teamsData);

    // 2. Build Global Agents
    const allAgents = getAllUsers().filter(u => u.role === 'agent');
    const enrichedAgents = allAgents.map(a => {
      const leaderName = getAllUsers().find(u => u.agentNumber === a.leaderId)?.name || 'Unknown';
      return { ...a, totalAPI: getFilteredAPI(a.agentNumber), leaderName };
    }).sort((a,b) => b.totalAPI - a.totalAPI);
    setGlobalAgents(enrichedAgents);
  };

  return (
    <Layout>
      <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Users className="w-8 h-8 text-green-900" /> Communities & API Performance</h1>
          <p className="text-gray-500 mt-2">Pantau struktur tim dan persaingan produksi API secara transparan.</p>
          
          <div className="flex gap-4 mt-6">
            <button onClick={() => setActiveTab('circle')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'circle' ? 'border-green-900 text-green-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              Klasemen Antar-Circle
            </button>
            <button onClick={() => setActiveTab('global')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'global' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              Global Agent Leaderboard
            </button>
          </div>
        </div>

        {/* --- UI FILTER WAKTU INTERAKTIF (DROPDOWN) --- */}
        <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-gray-200 shadow-sm w-full lg:w-auto">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Filter className="w-3 h-3"/> Filter Periode API:</span>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown Kategori */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  // Reset input saat ganti mode agar bersih
                  setCustomMonth(''); setCustomRangeStart(''); setCustomRangeEnd('');
                }}
                className="appearance-none pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer w-full md:w-auto"
              >
                <option value="current_month">Sedang Berlangsung (Bulan Ini)</option>
                <option value="current_year">Tahunan (Tahun Ini)</option>
                <option value="custom_month">Pilih Bulan Spesifik</option>
                <option value="custom_range">Pilih Rentang Bulan</option>
              </select>
              <CalendarDays className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Input Dinamis: Bulan Spesifik */}
            {timeFilter === 'custom_month' && (
              <div className="relative animate-in zoom-in-95 duration-200">
                <input 
                  type="month" 
                  value={customMonth} 
                  onChange={(e) => setCustomMonth(e.target.value)} 
                  className="px-4 py-2.5 bg-white border border-blue-300 text-blue-800 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
                />
              </div>
            )}

            {/* Input Dinamis: Rentang Bulan (Range) */}
            {timeFilter === 'custom_range' && (
              <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-xl px-2 shadow-sm animate-in zoom-in-95 duration-200">
                <input 
                  type="month" 
                  value={customRangeStart} 
                  onChange={(e) => setCustomRangeStart(e.target.value)} 
                  className="py-2.5 px-2 text-sm font-bold text-blue-800 outline-none bg-transparent cursor-pointer rounded-l-xl" 
                />
                <span className="text-blue-300 font-extrabold">-</span>
                <input 
                  type="month" 
                  value={customRangeEnd} 
                  onChange={(e) => setCustomRangeEnd(e.target.value)} 
                  className="py-2.5 px-2 text-sm font-bold text-blue-800 outline-none bg-transparent cursor-pointer rounded-r-xl" 
                />
              </div>
            )}
          </div>
        </div>
        {/* ------------------------------------------- */}
      </div>

      {/* TAMPILAN KLASEMEN CIRCLE */}
      {activeTab === 'circle' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {teams.length === 0 ? <p className="text-gray-500">Belum ada tim yang terbentuk.</p> : (
            teams.map((team, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                <div onClick={() => setExpandedTeam(expandedTeam === team.leader.agentNumber ? null : team.leader.agentNumber)} className="p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                    {index === 0 && team.totalApe > 0 ? <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xl ring-4 ring-yellow-50"><Award className="w-6 h-6" /></div> : <div className="w-12 h-12 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-xl">{team.leader.name.charAt(0)}</div>}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Circle: {team.leader.name}</h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Users className="w-4 h-4" /> {team.agents.length} Agents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total API Circle</p>
                      <p className="text-xl font-extrabold text-green-700 flex items-center gap-1 justify-end">IDR {team.totalApe.toLocaleString('id-ID')} Juta <TrendingUp className="w-5 h-5" /></p>
                    </div>
                    <div className="p-2 text-gray-400">{expandedTeam === team.leader.agentNumber ? <ChevronUp /> : <ChevronDown />}</div>
                  </div>
                </div>

                {expandedTeam === team.leader.agentNumber && (
                  <div className="border-t border-gray-100 bg-slate-50 p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Breakdown Produksi Agen</h3>
                    {team.agents.length > 0 ? (
                      <table className="w-full text-left bg-white rounded-lg overflow-hidden border border-gray-200">
                        <thead className="bg-gray-100 border-b border-gray-200"><tr className="text-xs font-bold text-gray-500 uppercase"><th className="py-3 px-4">Nama Agen</th><th className="py-3 px-4 text-right">Produksi API</th></tr></thead>
                        <tbody>
                          {team.agents.map((agent, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                              <td className="py-3 px-4 font-medium text-gray-900">{i === 0 && agent.ape > 0 && <Award className="w-4 h-4 inline text-yellow-500 mr-2" />} {agent.name}</td>
                              <td className="py-3 px-4 text-sm font-bold text-gray-800 text-right">IDR {agent.ape.toLocaleString('id-ID')} Juta</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="text-sm text-gray-500 italic">Belum ada agen di tim ini.</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAMPILAN KLASEMEN GLOBAL AGENTS */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 bg-slate-50 border-b border-gray-200"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Medal className="w-5 h-5 text-blue-600"/> Peringkat Agen Nasional</h2></div>
          <div className="p-6">
            {globalAgents.length === 0 ? <p className="text-center text-gray-500">Belum ada produksi pada periode ini.</p> : (
              <div className="space-y-3">
                {globalAgents.map((agent, index) => (
                  <div key={agent.agentNumber} className={`flex items-center justify-between p-4 rounded-2xl border ${index === 0 ? 'bg-yellow-50/50 border-yellow-300 shadow-md' : index === 1 ? 'bg-gray-50 border-gray-300 shadow-sm' : index === 2 ? 'bg-orange-50/30 border-orange-200 shadow-sm' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{agent.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">Circle: {agent.leaderName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total API</p>
                      <p className={`text-xl font-extrabold ${index === 0 ? 'text-yellow-600' : 'text-blue-700'}`}>IDR {agent.totalAPI.toLocaleString('id-ID')} Jt</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Communities;