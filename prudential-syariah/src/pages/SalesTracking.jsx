// src/pages/SalesTracking.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  getCurrentUser, getProspects, addProspectDB, 
  setAppointmentDB, submitFollowUpDB, submitClosingDB, incrementProspectFollowUpDB,
  addTaskDB, getAgentsByLeader, getAgentTotalAPI, getPremiumInputs, addPremiumInput,
  completeTaskByTitle, getAllUsers // <-- IMPORT BARU: getAllUsers untuk menterjemahkan Nomor Agen jadi Nama
} from '../utils/auth';
import { 
  Users, CalendarClock, PhoneCall, Award, Plus, X, CheckCircle, 
  TrendingUp, CheckCircle2, AlertCircle, Clock, Repeat
} from 'lucide-react';

const AVAILABLE_TIME_SLOTS = [
  "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", 
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", 
  "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00"
];

const SalesTracking = () => {
  const user = getCurrentUser();
  const isLeader = user?.role === 'leader';

  const [activeTab, setActiveTab] = useState('pipeline'); 
  const [prospects, setProspects] = useState([]);
  const [myAgents, setMyAgents] = useState([]);
  const [listFilter, setListFilter] = useState('all'); 
  
  const [showClosingAlert, setShowClosingAlert] = useState(false);

  // --- STATE MODALS ---
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [showApptModal, setShowApptModal] = useState(false);
  const [apptProspectId, setApptProspectId] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptDesc, setApptDesc] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  const [showFollowUpModal, setShowFollowUpModal] = useState(null); 
  const [followUpNote, setFollowUpNote] = useState('');

  const [showClosingModal, setShowClosingModal] = useState(null);
  const [closeProduct, setCloseProduct] = useState('PRULink Syariah');
  const [closeAmount, setCloseAmount] = useState('');

  const [selectedFollowUpDetail, setSelectedFollowUpDetail] = useState(null);
  const [selectedFUIndex, setSelectedFUIndex] = useState(0);

  const [selectedClosedDetail, setSelectedClosedDetail] = useState(null);
  const [selectedCloseIndex, setSelectedCloseIndex] = useState(0);

  const [circleLeaderboard, setCircleLeaderboard] = useState([]);
  const [closingLogs, setClosingLogs] = useState([]);

  const loadData = () => {
    try {
      const allProspects = getProspects();
      if (isLeader) {
        setProspects(allProspects.filter(p => p.leaderId === user?.agentNumber));
        setMyAgents(getAgentsByLeader(user?.agentNumber));
      } else {
        setProspects(allProspects.filter(p => p.agentNumber === user?.agentNumber));
      }

      const leaderIdToFetch = isLeader ? user?.agentNumber : user?.leaderId;
      setCircleLeaderboard(getAgentsByLeader(leaderIdToFetch).map(a => ({
        ...a, totalAPI: getAgentTotalAPI(a.agentNumber)
      })).sort((a,b) => b.totalAPI - a.totalAPI));

      const allInputs = getPremiumInputs();
      const allUsersList = getAllUsers(); // Ambil semua data user untuk proses masking nama

      // SENSOR KEAMANAN: Jangan simpan agentNumber mentah, ubah jadi Nama Agen di Logs
      const safeLogs = allInputs.filter(i => i.leaderId === leaderIdToFetch).map(log => {
        const agentObj = allUsersList.find(u => u.agentNumber === log.agentNumber);
        return { ...log, agentName: agentObj ? agentObj.name : 'Unknown Agent' };
      }).sort((a,b) => new Date(b.date) - new Date(a.date));
      
      setClosingLogs(safeLogs);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- TIME SLOT LOGIC ---
  const addTimeSlot = () => {
    if (selectedTimeSlot && !timeSlots.includes(selectedTimeSlot)) {
      setTimeSlots([...timeSlots, selectedTimeSlot].sort());
      setSelectedTimeSlot('');
    }
  };
  const removeTimeSlot = (slot) => { setTimeSlots(timeSlots.filter(s => s !== slot)); };

  // --- PIPELINE HANDLERS ---
  const handleAddContact = (e) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;
    addProspectDB({ name: contactName, phone: contactPhone, agentNumber: user?.agentNumber, leaderId: isLeader ? user?.agentNumber : user?.leaderId });
    setContactName(''); setContactPhone(''); setShowContactModal(false); loadData();
  };

  const handleSetAppointment = (e) => {
    e.preventDefault();
    if (apptProspectId && apptDate) {
      const prospect = prospects.find(p => p.id === parseInt(apptProspectId));
      if (!prospect) return;

      completeTaskByTitle(`Pertemuan: ${prospect.name}`, prospect.agentNumber);

      let finalTimeSlots = [...timeSlots];
      if (selectedTimeSlot && !finalTimeSlots.includes(selectedTimeSlot)) finalTimeSlots.push(selectedTimeSlot);
      finalTimeSlots.sort();

      setAppointmentDB(parseInt(apptProspectId), apptDate, finalTimeSlots);
      
      addTaskDB({
        id: Date.now(), title: `Pertemuan: ${prospect.name}`, description: apptDesc, priority: 'High', status: 'Pending',
        assigner: 'System', agentNumber: prospect.agentNumber, leaderId: prospect.leaderId,
        dueDate: apptDate, timeSlots: finalTimeSlots, createdAt: new Date().toISOString()
      });
      
      setApptProspectId(''); setApptDate(''); setApptDesc(''); setTimeSlots([]); setSelectedTimeSlot(''); setShowApptModal(false); loadData();
    }
  };

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (showFollowUpModal && followUpNote) {
      submitFollowUpDB(showFollowUpModal.id, followUpNote);
      completeTaskByTitle(`Pertemuan: ${showFollowUpModal.name}`, showFollowUpModal.agentNumber);
      setFollowUpNote(''); setShowFollowUpModal(null); loadData();
    }
  };

  const handleClosingSubmit = (e) => {
    e.preventDefault();
    if (showClosingModal && closeAmount) {
      submitClosingDB(showClosingModal.id, closeProduct, closeAmount, showClosingModal.agentNumber, showClosingModal.leaderId);
      completeTaskByTitle(`Pertemuan: ${showClosingModal.name}`, showClosingModal.agentNumber);
      setCloseAmount(''); setCloseProduct('PRULink Syariah'); setShowClosingModal(null);
      loadData(); setShowClosingAlert(true); setTimeout(() => setShowClosingAlert(false), 4000);
    }
  };

  const openReselling = (prospect) => {
    setApptProspectId(prospect.id);
    setShowApptModal(true);
  };

  const getAgentNameForProspect = (agentNum) => {
    if (agentNum === user?.agentNumber) return 'Pribadi';
    return myAgents.find(a => a.agentNumber === agentNum)?.name || 'Tim Sales'; // Masking default jika tak ketemu
  };

  // --- FILTER & CALCULATIONS ---
  const displayedProspects = prospects.filter(p => {
    if (!isLeader) return true;
    if (listFilter === 'all') return true;
    if (listFilter === 'personal') return p.agentNumber === user?.agentNumber;
    return p.agentNumber === listFilter;
  });

  const countContact = displayedProspects.filter(p => p.status === 'Contact').length;
  const countAppt = displayedProspects.filter(p => p.status === 'Appointment').length;
  const countFU = displayedProspects.filter(p => p.status === 'Follow Up').length;
  const countClosed = displayedProspects.filter(p => p.closingLogs && p.closingLogs.length > 0).length;

  const selectedProspectObj = prospects.find(p => p.id === parseInt(apptProspectId));

  if (user?.role === 'admin') return <Layout><div className="p-10 text-center">Fitur khusus Agent & Leader.</div></Layout>;

  return (
    <Layout>
      <div className="mb-6 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-blue-600" /> Sales Tracking & Pipeline</h1>
        <div className="flex gap-4 mt-6">
          <button onClick={() => setActiveTab('pipeline')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'pipeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Pipeline Prospek</button>
          <button onClick={() => setActiveTab('production')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'production' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Live Leaderboard Circle</button>
        </div>
      </div>

      {showClosingAlert && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold animate-in slide-in-from-top-10">
          <Award className="w-6 h-6 text-yellow-300" /> Luar Biasa! Sukses Closing dan Omzet API telah ditambahkan.
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="animate-in fade-in duration-300">
          
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
             <div className="flex flex-wrap gap-3">
               <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3"><Users className="w-5 h-5 text-blue-500"/><div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Kontak</p><p className="text-lg font-extrabold text-gray-900 leading-none">{countContact}</p></div></div>
               <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3"><CalendarClock className="w-5 h-5 text-orange-500"/><div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Appt</p><p className="text-lg font-extrabold text-gray-900 leading-none">{countAppt}</p></div></div>
               <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3"><PhoneCall className="w-5 h-5 text-slate-500"/><div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Follow Up</p><p className="text-lg font-extrabold text-gray-900 leading-none">{countFU}</p></div></div>
               <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200 shadow-sm flex items-center gap-3"><Award className="w-5 h-5 text-green-600"/><div className="text-right"><p className="text-[10px] font-bold text-green-600 uppercase">Closed</p><p className="text-lg font-extrabold text-green-800 leading-none">{countClosed}</p></div></div>
             </div>

             {isLeader && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                <button onClick={() => setListFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${listFilter === 'all' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100'}`}>Circle</button>
                <button onClick={() => setListFilter('personal')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${listFilter === 'personal' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100'}`}>Pribadi</button>
                <select 
                  value={listFilter !== 'all' && listFilter !== 'personal' ? listFilter : ''}
                  onChange={(e) => setListFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border outline-none cursor-pointer transition-colors ${listFilter !== 'all' && listFilter !== 'personal' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  <option value="" disabled>-- Tim Agen --</option>
                  {myAgents.map(a => <option key={a.agentNumber} value={a.agentNumber}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-auto xl:h-[70vh]">
            
            {/* KONTINER 1: KONTAK */}
            <div className="bg-slate-50/50 rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2"><div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div><h2 className="text-base font-bold text-gray-900">Daftar Kontak</h2></div>
                <button onClick={() => setShowContactModal(true)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {displayedProspects.filter(p => p.status === 'Contact').length === 0 ? <p className="text-center text-xs text-gray-400 mt-10">Belum ada kontak.</p> : null}
                {displayedProspects.filter(p => p.status === 'Contact').map(p => {
                  const isOwner = p.agentNumber === user?.agentNumber;
                  return (
                    <div key={p.id} className="p-3 border border-gray-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-colors">
                      <h4 className="font-bold text-sm text-gray-900">{p.name}</h4><p className="text-[10px] font-medium text-gray-500 mb-2">{p.phone}</p>
                      {isOwner ? ( <button onClick={() => {setApptProspectId(p.id); setShowApptModal(true);}} className="w-full py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md">+ Appointment</button> ) : <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">Agen: {getAgentNameForProspect(p.agentNumber)}</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* KONTINER 2: APPOINTMENT */}
            <div className="bg-slate-50/50 rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2"><div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><CalendarClock className="w-4 h-4" /></div><h2 className="text-base font-bold text-gray-900">Appointment</h2></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {displayedProspects.filter(p => p.status === 'Appointment').length === 0 ? <p className="text-center text-sm text-gray-400 mt-10">Belum ada jadwal temu.</p> : null}
                {displayedProspects.filter(p => p.status === 'Appointment').map(p => {
                  const isOwner = p.agentNumber === user?.agentNumber;
                  return (
                    <div key={p.id} className="p-4 border border-orange-200 bg-orange-50/40 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                        <span className="text-[9px] font-bold bg-white text-orange-600 px-1.5 py-0.5 rounded shadow-sm border border-orange-100">
                          {p.appointmentDate ? new Date(p.appointmentDate).toLocaleDateString('id-ID', {month:'short', day:'numeric'}) : '-'}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-gray-500 mb-3 flex items-center gap-1"><Clock className="w-3 h-3"/> {p.appointmentTime?.length ? p.appointmentTime[0] : 'TBA'}</p>
                      
                      {isOwner ? (
                        <div className="flex gap-2">
                          <button onClick={() => setShowFollowUpModal(p)} className="flex-1 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg shadow-sm">Follow Up</button>
                          <button onClick={() => setShowClosingModal(p)} className="flex-1 py-1.5 text-[10px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">Closing</button>
                        </div>
                      ) : <span className="text-[10px] font-bold px-2 py-1 bg-white text-slate-600 rounded border border-gray-200">Agen: {getAgentNameForProspect(p.agentNumber)}</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* KONTINER 3: FOLLOW UP */}
            <div className="bg-slate-50/50 rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2"><div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg"><PhoneCall className="w-4 h-4" /></div><h2 className="text-base font-bold text-gray-900">Follow Up</h2></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {displayedProspects.filter(p => p.status === 'Follow Up').map(p => {
                  const isOwner = p.agentNumber === user?.agentNumber;
                  return (
                    <div key={p.id} className="p-3 border border-slate-200 bg-white rounded-2xl shadow-sm cursor-pointer hover:border-slate-400 transition-colors" onClick={() => { setSelectedFollowUpDetail(p); setSelectedFUIndex(0); }}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                        {p.followUpCount > 0 && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">FU Ke-{p.followUpCount}</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 italic mb-2">Klik untuk melihat catatan</p>

                      {isLeader && !isOwner ? ( <span className="text-[10px] font-bold text-slate-500">{getAgentNameForProspect(p.agentNumber)}</span> ) : (
                        <button onClick={(e) => { e.stopPropagation(); setApptProspectId(p.id); setShowApptModal(true);}} className="w-full py-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md">Re-schedule Appt</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* KONTINER 4: CLOSED */}
            <div className="bg-green-50/30 rounded-3xl border border-green-200 shadow-sm p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-green-200">
                <div className="flex items-center gap-2"><div className="p-1.5 bg-green-100 text-green-700 rounded-lg"><Award className="w-4 h-4" /></div><h2 className="text-base font-bold text-gray-900">Sukses Closing</h2></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {displayedProspects.filter(p => p.closingLogs && p.closingLogs.length > 0).map(p => {
                  const isOwner = p.agentNumber === user?.agentNumber;
                  const isCurrentlyActive = p.status !== 'Closed'; 

                  return (
                    <div key={p.id} className="p-3 border border-green-200 bg-white rounded-2xl shadow-sm cursor-pointer hover:border-green-400 transition-colors relative overflow-hidden" onClick={() => { setSelectedClosedDetail(p); setSelectedCloseIndex(0); }}>
                      {isCurrentlyActive && <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>}
                      <div className="flex justify-between items-start mb-2 mt-1">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1">{p.name} {isCurrentlyActive && <Repeat className="w-3 h-3 text-orange-500" title="Sedang Reselling" />}</h4>
                          {isLeader && !isOwner && <p className="text-[9px] text-gray-500">{getAgentNameForProspect(p.agentNumber)}</p>}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      
                      {isOwner && (
                        <button onClick={(e) => { e.stopPropagation(); openReselling(p); }} className="w-full py-1.5 mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-100 flex items-center justify-center gap-1">
                          <Repeat className="w-3 h-3"/> Reselling / Upgrade
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: LIVE LEADERBOARD SAJA */}
      {activeTab === 'production' && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[75vh] max-w-5xl mx-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl"><h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-500"/> Live Leaderboard Circle</h2><span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Real-time Ranking</span></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
              {circleLeaderboard.map((agent, index) => (
                <div key={agent.agentNumber} className={`p-5 rounded-2xl border flex items-center justify-between ${index === 0 ? 'bg-yellow-50/50 border-yellow-200 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                  <div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-xl ${index === 0 ? 'bg-yellow-400 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</div><div><h4 className="font-bold text-gray-900 text-lg">{agent.name} {agent.agentNumber === user?.agentNumber && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2 align-middle">You</span>}</h4>
                  
                  {/* SENSOR NOMOR AGEN: Ganti dengan Role agar nomor agen aman */}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{agent.role}</p>
                  </div></div>
                  <div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase">Total API</p><p className={`text-2xl font-extrabold ${index===0 ? 'text-yellow-600' : 'text-green-700'}`}>IDR {agent.totalAPI.toLocaleString('id-ID')} Jt</p></div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-3xl">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Log Closing Terbaru</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {closingLogs.slice(0,6).map(log => (
                  <div key={log.id} className="min-w-[240px] bg-white border border-gray-200 p-4 rounded-xl shadow-sm shrink-0">
                    <div className="flex justify-between mb-1">
                      {/* SENSOR NOMOR AGEN: Ganti dengan Nama Asli Agen (Ter-mapping dari loadData) */}
                      <span className="text-[10px] font-bold text-blue-600 truncate max-w-[120px]">{log.agentName}</span>
                      <span className="text-[10px] text-gray-400">{log.date ? new Date(log.date).toLocaleDateString('id-ID', {month:'short', day:'numeric'}) : '-'}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{log.clientName}</p>
                    <p className="text-xs text-gray-500 truncate">{log.productType}</p>
                    <p className="text-base font-extrabold text-green-600 mt-2">IDR {log.amount} Jt</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DAFTAR KONTAK --- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Tambah Kontak</h3><button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Prospek</label><input type="text" required autoFocus value={contactName} onChange={e=>setContactName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600" /></div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nomor WhatsApp/HP</label><input type="text" required value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600" /></div>
              <div className="flex gap-3 justify-end pt-2"><button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm">Simpan Kontak</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL BUAT APPOINTMENT & RESCHEDULE --- */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-orange-600" /> Jadwal Pertemuan</h3>
              <button onClick={() => setShowApptModal(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSetAppointment} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedProspectObj?.status === 'Follow Up' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" /> Ini akan jadi usaha Follow-Up ke-{(selectedProspectObj?.followUpCount || 0) + 1}. Semangat!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Prospek</label>
                <select required value={apptProspectId} onChange={e=>setApptProspectId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-600 bg-white">
                  <option value="" disabled>-- Pilih Prospek --</option>
                  {prospects.filter(p => p.agentNumber === user?.agentNumber && (p.status === 'Contact' || p.status === 'Follow Up' || p.status === 'Closed')).map(p => <option key={p.id} value={p.id}>{p.name} {p.status === 'Closed' ? '(Reselling)' : ''}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal</label>
                  <input type="date" required value={apptDate} onChange={e=>setApptDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-600" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Waktu / Jam</label>
                  <div className="flex gap-2 mb-2">
                    <select value={selectedTimeSlot} onChange={e => setSelectedTimeSlot(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-600 bg-white">
                      <option value="" disabled>-- Pilih Jam Utama --</option>
                      {AVAILABLE_TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                    </select>
                    <button type="button" onClick={addTimeSlot} title="Tambah Ekstra Jam" className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 rounded-xl font-bold text-slate-700 transition-colors"><Plus className="w-5 h-5"/></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {timeSlots.map(ts => (
                      <span key={ts} className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded border border-orange-200 flex items-center gap-1">
                        <Clock className="w-3 h-3"/> {ts} <button type="button" onClick={() => removeTimeSlot(ts)} className="hover:text-red-500 ml-1"><X className="w-3 h-3"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Keterangan / Tujuan Pertemuan</label>
                <textarea value={apptDesc} onChange={e=>setApptDesc(e.target.value)} rows="2" placeholder="Contoh: Menjelaskan ilustrasi premi..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-600 resize-none"></textarea>
              </div>

              <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-xs font-medium border border-orange-100">Jadwal otomatis ditambahkan ke To-Do List & Kalender.</div>
              <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-sm mt-2">Set Jadwal Pertemuan</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL FORM FOLLOW UP --- */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-gray-900 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-slate-600" /> Catatan Follow Up</h3><button onClick={() => setShowFollowUpModal(null)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleFollowUpSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4"><p className="text-xs text-gray-500 font-bold uppercase">Prospek</p><p className="text-base font-extrabold text-gray-900">{showFollowUpModal.name}</p></div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Laporan / Kendala (Wajib)</label>
                <textarea required autoFocus value={followUpNote} onChange={e=>setFollowUpNote(e.target.value)} rows="4" placeholder="Mengapa belum closing? Apa keberatan nasabah?..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-600 resize-none"></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 shadow-sm">Simpan Catatan & Pindah ke Follow Up</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL FORM CLOSING --- */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-green-50"><h3 className="font-bold text-green-900 flex items-center gap-2"><Award className="w-5 h-5 text-green-600" /> Input Data Closing</h3><button onClick={() => setShowClosingModal(null)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleClosingSubmit} className="p-6 space-y-4">
              <div className="bg-green-50 p-3 rounded-xl border border-green-200 mb-4"><p className="text-xs text-green-700 font-bold uppercase">Nasabah Closing</p><p className="text-lg font-extrabold text-green-900">{showClosingModal.name}</p></div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Produk Asuransi</label><select value={closeProduct} onChange={e=>setCloseProduct(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-600 bg-white"><option>PRULink Syariah</option><option>PRUCinta</option><option>Lainnya</option></select></div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nominal API (Juta)</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span><input type="number" step="0.1" required value={closeAmount} onChange={e=>setCloseAmount(e.target.value)} placeholder="15" className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-600" /></div></div>
              <button type="submit" className="w-full py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-sm mt-4">Simpan Data Closing</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DETAIL FOLLOW UP (HISTORY) --- */}
      {selectedFollowUpDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-gray-900 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-slate-600" /> Histori Laporan Follow Up</h3><button onClick={() => setSelectedFollowUpDetail(null)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button></div>
            <div className="p-6">
               <h2 className="text-xl font-extrabold text-gray-900 mb-4">{selectedFollowUpDetail.name}</h2>
               
               {selectedFollowUpDetail.followUpLogs && selectedFollowUpDetail.followUpLogs.length > 0 ? (
                 (() => {
                   const fuLog = selectedFollowUpDetail.followUpLogs?.[Number(selectedFUIndex)];
                   return (
                     <>
                       <div className="mb-4">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Riwayat Laporan</label>
                         <select value={selectedFUIndex} onChange={e=>setSelectedFUIndex(Number(e.target.value))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white font-bold text-slate-700">
                            {selectedFollowUpDetail.followUpLogs.map((log, i) => (
                               <option key={i} value={i}>Laporan Ke-{log.count} {i === 0 ? '(Terbaru)' : ''}</option>
                            ))}
                         </select>
                       </div>
                       
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex gap-4 border-b border-dashed border-gray-200 pb-3 mb-3">
                             <div className="flex-1">
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Tgl Pertemuan</p>
                               <p className="text-sm font-bold text-gray-800">
                                 {fuLog?.apptDate ? new Date(fuLog.apptDate).toLocaleDateString('id-ID', {month:'long', day:'numeric', year:'numeric'}) : '-'}
                               </p>
                             </div>
                             <div className="flex-1 border-l border-gray-200 pl-4">
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Jam Waktu</p>
                               <p className="text-sm font-bold text-gray-800">{fuLog?.apptTime?.length ? fuLog.apptTime[0] : '-'}</p>
                             </div>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan Kendala / Hasil</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fuLog?.note || '-'}</p>
                       </div>
                     </>
                   );
                 })()
               ) : <p className="text-sm text-gray-500 italic">Tidak ada catatan historis.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DETAIL CLOSED (HISTORY RESELLING) --- */}
      {selectedClosedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-green-50"><h3 className="font-bold text-green-900 flex items-center gap-2"><Award className="w-5 h-5 text-green-600" /> Riwayat Closing Nasabah</h3><button onClick={() => setSelectedClosedDetail(null)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button></div>
            <div className="p-6">
               <h2 className="text-xl font-extrabold text-gray-900 mb-4">{selectedClosedDetail.name}</h2>
               
               {selectedClosedDetail.closingLogs && selectedClosedDetail.closingLogs.length > 0 ? (
                 (() => {
                   const cLog = selectedClosedDetail.closingLogs?.[Number(selectedCloseIndex)];
                   return (
                     <>
                       <div className="mb-4">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Transaksi Closing</label>
                         <select value={selectedCloseIndex} onChange={e=>setSelectedCloseIndex(Number(e.target.value))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white font-bold text-green-800">
                            {selectedClosedDetail.closingLogs.map((log, i) => (
                               <option key={i} value={i}>Closing {selectedClosedDetail.closingLogs.length - i} ({new Date(log.date).toLocaleDateString('id-ID', {month:'short', year:'numeric'})})</option>
                            ))}
                         </select>
                       </div>
                       
                       <div className="bg-green-50 p-5 rounded-2xl border border-green-200 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Produk Terjual</p>
                          <h4 className="text-lg font-bold text-green-900 mb-4">{cLog?.product || '-'}</h4>
                          
                          <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Total Omzet API</p>
                          <h2 className="text-4xl font-extrabold text-yellow-600">IDR {cLog?.amount || 0} Jt</h2>
                          
                          <p className="text-xs text-green-700 mt-4 bg-green-100 px-3 py-1 rounded-full font-medium">
                            Tercatat: {cLog?.date ? new Date(cLog.date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : '-'}
                          </p>
                       </div>
                     </>
                   );
                 })()
               ) : <p className="text-sm text-gray-500 italic">Data closing tidak ditemukan.</p>}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default SalesTracking;