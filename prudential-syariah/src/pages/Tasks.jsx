// src/pages/Tasks.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  getCurrentUser, getTasks, addTaskDB, toggleTaskStatus, deleteTaskDB, getAgentsByLeader
} from '../utils/auth';
import { 
  CheckCircle2, Circle, Plus, Trash2, ListTodo, User, AlertCircle, 
  ArrowRightCircle, CalendarDays, ChevronLeft, ChevronRight, 
  BarChart2, CheckSquare, Clock, Activity, Users, Code, Briefcase, X, AlignLeft
} from 'lucide-react';

// REVISI: Jam dimulai dari 09:00
const AVAILABLE_TIME_SLOTS = [
  "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", 
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", 
  "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00"
];

const Tasks = () => {
  const user = getCurrentUser();
  const isLeader = user?.role === 'leader';
  
  const [tasks, setTasks] = useState([]);
  const [myAgents, setMyAgents] = useState([]);
  const [viewMode, setViewMode] = useState('list'); 
  
  // Modals
  const [selectedTaskModal, setSelectedTaskModal] = useState(null); 
  const [dailyScheduleModal, setDailyScheduleModal] = useState(null); 
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  // Form State
  const [taskFormType, setTaskFormType] = useState('delegate'); 
  const [listFilter, setListFilter] = useState('all'); 
  const [dateFilter, setDateFilter] = useState('today'); 
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState(''); 
  const [priority, setPriority] = useState('Medium');
  const [selectedAgentNum, setSelectedAgentNum] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  const [currentDate, setCurrentDate] = useState(new Date());

  const loadData = () => {
    const allTasks = getTasks();
    if (isLeader) { setTasks(allTasks.filter(t => t.leaderId === user.agentNumber)); setMyAgents(getAgentsByLeader(user.agentNumber)); } 
    else { setTasks(allTasks.filter(t => t.agentNumber === user.agentNumber)); }
  };

  useEffect(() => { loadData(); }, []);

  const addTimeSlot = () => {
    if (selectedTimeSlot && !timeSlots.includes(selectedTimeSlot)) {
      setTimeSlots([...timeSlots, selectedTimeSlot].sort());
      setSelectedTimeSlot('');
    }
  };
  const removeTimeSlot = (slot) => {
    setTimeSlots(timeSlots.filter(s => s !== slot));
  };

  const handleGoToTask = (taskId) => {
    setViewMode('list');
    setDateFilter('all'); 
    setTimeout(() => {
      const element = document.getElementById(`task-${taskId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedTaskId(taskId);
      setTimeout(() => setHighlightedTaskId(null), 3000);
    }, 100);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle || !dueDate) return;

    let targetAgentNum = user.agentNumber;
    let assignerText = 'Self';
    if (isLeader) {
      if (taskFormType === 'delegate') {
        if (!selectedAgentNum) return alert('Pilih agen!');
        targetAgentNum = selectedAgentNum; assignerText = `Assigned by Leader (${user.name})`;
      } else { targetAgentNum = user.agentNumber; assignerText = 'Self'; }
    }

    // REVISI: Gabungkan timeSlots dengan selectedTimeSlot jika belum di-add via tombol "+"
    let finalTimeSlots = [...timeSlots];
    if (selectedTimeSlot && !finalTimeSlots.includes(selectedTimeSlot)) {
      finalTimeSlots.push(selectedTimeSlot);
    }
    finalTimeSlots.sort();

    addTaskDB({
      id: Date.now(), title: newTaskTitle, description: newTaskDesc, 
      priority, status: 'Pending', assigner: assignerText, agentNumber: targetAgentNum, 
      leaderId: isLeader ? user.agentNumber : user.leaderId, dueDate, 
      timeSlots: finalTimeSlots, 
      createdAt: new Date().toISOString()
    });
    
    setNewTaskTitle(''); setNewTaskDesc(''); setTimeSlots([]); setSelectedTimeSlot(''); loadData();
  };

  const handleToggle = (id) => { toggleTaskStatus(id); loadData(); };
  const handleDelete = (id) => { deleteTaskDB(id); loadData(); };

  const getPriorityStyle = (pri) => {
    if (pri === 'High') return 'bg-red-100 text-red-700 border-red-200';
    if (pri === 'Medium') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };
  
  let displayedTasks = tasks.filter(t => {
    if (!isLeader) return t.agentNumber === user.agentNumber;
    if (listFilter === 'personal') return t.agentNumber === user.agentNumber;
    if (listFilter === 'delegated') return t.agentNumber !== user.agentNumber;
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayObj = new Date(todayStr);

  displayedTasks = displayedTasks.filter(t => {
    if (dateFilter === 'all') return true;
    if (dateFilter === 'today') return t.dueDate === todayStr;
    if (dateFilter === 'week') {
      const taskDate = new Date(t.dueDate);
      const diffTime = taskDate - todayObj;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    if (dateFilter === 'month') return t.dueDate.startsWith(todayStr.substring(0, 7));
    return true;
  });

  displayedTasks.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    const timeA = a.timeSlots && a.timeSlots.length > 0 ? a.timeSlots[0] : '24:00';
    const timeB = b.timeSlots && b.timeSlots.length > 0 ? b.timeSlots[0] : '24:00';
    return timeA.localeCompare(timeB);
  });

  const totalTasks = displayedTasks.length;
  const completedTasks = displayedTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const year = currentDate.getFullYear(); const month = currentDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); 
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

  if (user?.role === 'admin') return <Layout><div className="p-10 text-center">Fitur khusus Leader dan Agent.</div></Layout>;

  return (
    <Layout>
      <div className="mb-6 flex flex-col xl:flex-row justify-between xl:items-end gap-6 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><ListTodo className="w-8 h-8 text-green-900" />{isLeader ? 'Delegasi & Monitoring Tugas' : 'Jadwal & Tugas Harian'}</h1>
          <p className="text-gray-500 mt-2">Kelola produktivitas, jadwal jam, dan deadline harian.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start xl:self-auto shadow-inner border border-slate-200 gap-1">
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-green-900 shadow-sm border border-gray-200' : 'text-gray-500'}`}><BarChart2 className="w-4 h-4" /> Overview & List</button>
          <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-green-900 shadow-sm border border-gray-200' : 'text-gray-500'}`}><CalendarDays className="w-4 h-4" /> Calendar View</button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ListTodo className="w-6 h-6" /></div><div><p className="text-xs font-bold text-gray-400 uppercase">Total Tugas</p><h3 className="text-2xl font-extrabold text-gray-900">{totalTasks}</h3></div></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckSquare className="w-6 h-6" /></div><div><p className="text-xs font-bold text-gray-400 uppercase">Selesai</p><h3 className="text-2xl font-extrabold text-gray-900">{completedTasks}</h3></div></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Clock className="w-6 h-6" /></div><div><p className="text-xs font-bold text-gray-400 uppercase">Tertunda</p><h3 className="text-2xl font-extrabold text-gray-900">{pendingTasks}</h3></div></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden"><div className="flex justify-between items-end mb-2"><p className="text-xs font-bold text-gray-400 uppercase">Progress</p><span className={`text-lg font-extrabold ${progressPercentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>{progressPercentage}%</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner"><div className={`h-2.5 rounded-full transition-all duration-1000 ${progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercentage}%` }}></div></div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                {isLeader ? (
                  <div className="flex bg-slate-100 p-1 rounded-lg mb-6 shadow-inner">
                    <button onClick={() => setTaskFormType('delegate')} className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-md ${taskFormType === 'delegate' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><ArrowRightCircle className="w-4 h-4" /> Delegasi</button>
                    <button onClick={() => setTaskFormType('personal')} className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-md ${taskFormType === 'personal' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}><Briefcase className="w-4 h-4" /> Pribadi</button>
                  </div>
                ) : <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-green-900"/> Tambah Tugas Baru</h2>}

                <form onSubmit={handleAddTask} className="space-y-4">
                  {isLeader && taskFormType === 'delegate' && (
                    <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Delegasikan ke Agen</label><select required value={selectedAgentNum} onChange={e => setSelectedAgentNum(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 bg-white"><option value="" disabled>-- Pilih Agen --</option>{myAgents.map(a => <option key={a.agentNumber} value={a.agentNumber}>{a.name}</option>)}</select></div>
                  )}
                  <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Judul Tugas</label><input type="text" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Contoh: Follow up Bapak Budi" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-900" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Keterangan / Detail</label><textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="Tulis instruksi detail..." rows="2" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-900 resize-none"></textarea></div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal</label><input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-900 bg-white" /></div>
                    
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Waktu / Jam (Opsional)</label>
                      <div className="flex gap-2 mb-2">
                        <select value={selectedTimeSlot} onChange={e => setSelectedTimeSlot(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-900 bg-white">
                          <option value="" disabled>-- Pilih Jam Utama --</option>
                          {AVAILABLE_TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                        </select>
                        <button type="button" onClick={addTimeSlot} title="Tambah Ekstra Jam" className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 rounded-xl font-bold text-slate-700 transition-colors"><Plus className="w-5 h-5"/></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {timeSlots.map(ts => (
                          <span key={ts} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3"/> {ts}
                            <button type="button" onClick={() => removeTimeSlot(ts)} className="hover:text-red-500 ml-1"><X className="w-3 h-3"/></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prioritas</label><div className="flex gap-2">{['Low', 'Medium', 'High'].map(p => (<div key={p} onClick={() => setPriority(p)} className={`flex-1 text-center py-2 rounded-lg text-xs font-bold cursor-pointer border ${priority === p ? getPriorityStyle(p) : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{p}</div>))}</div></div>
                  </div>
                  <button type="submit" className={`w-full py-3 rounded-xl text-sm font-bold text-white mt-4 shadow-sm ${isLeader && taskFormType === 'delegate' ? 'bg-blue-600' : 'bg-green-900'}`}>Simpan Tugas</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-2">
                <div className="flex flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-gray-900 mr-2">List Tugas:</h2>
                  {[{id:'today', label:'Hari Ini'}, {id:'week', label:'Minggu Ini'}, {id:'month', label:'Bulan Ini'}, {id:'all', label:'Semua'}].map(f => (
                    <button key={f.id} onClick={() => setDateFilter(f.id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors shadow-sm ${dateFilter === f.id ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{f.label}</button>
                  ))}
                </div>

                {isLeader && (
                  <div className="flex gap-2">
                    {[{ id: 'all', label: 'All' }, { id: 'personal', label: 'Pribadi' }, { id: 'delegated', label: 'Delegasi' }].map(f => (
                      <button key={f.id} onClick={() => setListFilter(f.id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${listFilter === f.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600'}`}>{f.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {displayedTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border-dashed border border-gray-200 p-12 text-center"><ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Tidak ada tugas pada filter ini.</p></div>
              ) : (
                displayedTasks.map(task => {
                  const isCompleted = task.status === 'Completed';
                  const isPersonal = isLeader && task.agentNumber === user.agentNumber;
                  const canToggle = !isLeader || isPersonal;
                  const isHighlighted = task.id === highlightedTaskId;

                  return (
                    <div 
                      key={task.id} 
                      id={`task-${task.id}`}
                      onClick={() => setSelectedTaskModal(task)} 
                      className={`bg-white rounded-xl border p-4 flex items-start gap-4 group cursor-pointer transition-all duration-500 ${
                        isHighlighted 
                        ? 'ring-4 ring-blue-400 bg-blue-50/60 shadow-lg scale-[1.02] border-blue-300 z-10' 
                        : isCompleted 
                          ? 'opacity-60 bg-slate-50 border-gray-200' 
                          : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <button onClick={(e) => { e.stopPropagation(); canToggle && handleToggle(task.id); }} className={`mt-1 shrink-0 ${!canToggle ? 'cursor-default' : 'hover:scale-110 transition-transform'}`}>{isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Circle className="w-6 h-6 text-gray-300" />}</button>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString('id-ID', {month: 'short', day:'numeric'})}</span>
                          
                          {task.timeSlots && task.timeSlots.length > 0 && (
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                               <Clock className="w-3 h-3"/> {task.timeSlots.join(', ')}
                             </span>
                          )}

                          {isLeader && <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${isPersonal ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{isPersonal ? <Briefcase className="w-3 h-3" /> : <User className="w-3 h-3" />} {isPersonal ? 'Tugas Pribadi' : myAgents.find(a => a.agentNumber === task.agentNumber)?.name}</span>}
                        </div>
                        <h3 className={`font-semibold text-base ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h3>
                        {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* KALENDER */}
      {viewMode === 'calendar' && (
        <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-6 flex flex-col h-[75vh]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-extrabold text-slate-900">{monthNames[month]} {year}</h2><div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1 bg-gray-50"><button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg"><ChevronLeft className="w-5 h-5" /></button><button onClick={goToToday} className="px-4 py-1.5 text-sm font-semibold hover:bg-white rounded-lg">Today</button><button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg"><ChevronRight className="w-5 h-5" /></button></div></div>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-7 gap-3 mb-2">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="text-center text-[11px] font-extrabold text-gray-400">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-3">
                {blanks.map((_, i) => <div key={`b-${i}`} className="min-h-[120px]"></div>)}
                {days.map(d => {
                  const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayTasks = tasks.filter(t => t.dueDate === dateStr);
                  
                  dayTasks.sort((a,b) => {
                     const ta = a.timeSlots?.length ? a.timeSlots[0] : '24:00';
                     const tb = b.timeSlots?.length ? b.timeSlots[0] : '24:00';
                     return ta.localeCompare(tb);
                  });

                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div 
                      key={d} 
                      onClick={() => setDailyScheduleModal(dateStr)} // MUNCULKAN RINGKASAN HARIAN
                      className={`min-h-[120px] rounded-2xl p-3 flex flex-col border border-transparent cursor-pointer transition-all ${isToday ? 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-100/50' : 'bg-slate-50 hover:border-blue-300 hover:shadow-sm'}`}
                    >
                      <div className="mb-2"><span className={`text-sm font-bold flex items-center justify-center w-8 h-8 rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}`}>{d}</span></div>
                      
                      <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
                        {dayTasks.map(t => {
                          let style = 'bg-white border-gray-200 text-gray-700'; 
                          if (isLeader) style = (t.agentNumber === user.agentNumber) ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-blue-50 text-blue-800 border-blue-200';
                          if (t.status === 'Completed') style = 'opacity-50 bg-gray-50 text-gray-400 line-through border-gray-100';
                          
                          return (
                            <div 
                              key={t.id} title={t.title} 
                              onClick={(e) => { e.stopPropagation(); setSelectedTaskModal(t); }} 
                              className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border shadow-sm truncate hover:scale-[1.02] transition-transform ${style}`}
                            >
                               {/* REVISI: Jam Dihilangkan dari Display Kalender */}
                               <span className="truncate">{t.title}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100"><h3 className="font-bold text-lg mb-6">Summary</h3><div className="flex justify-between items-end mb-4"><div className="flex items-baseline gap-2"><span className="text-5xl font-extrabold text-indigo-600">{pendingTasks}</span><span className="text-sm text-gray-400 font-bold uppercase">Active</span></div><span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-extrabold">{progressPercentage}% Done</span></div><div className="w-full bg-slate-100 h-2.5 rounded-full"><div className="bg-emerald-500 h-full rounded-full" style={{width: `${progressPercentage}%`}}></div></div></div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-[calc(75vh-200px)] flex flex-col">
               <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-900">Upcoming</h3><AlertCircle className="w-5 h-5 text-orange-500" /></div>
               <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {tasks.filter(t => t.status !== 'Completed').sort((a,b) => {
                     const dateA = new Date(a.dueDate); const dateB = new Date(b.dueDate);
                     if (dateA - dateB !== 0) return dateA - dateB;
                     const timeA = a.timeSlots?.length ? a.timeSlots[0] : '24:00';
                     const timeB = b.timeSlots?.length ? b.timeSlots[0] : '24:00';
                     return timeA.localeCompare(timeB);
                  }).slice(0, 5).map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => handleGoToTask(task.id)}
                        className="p-3.5 border border-gray-100 rounded-2xl flex items-center gap-3 hover:shadow-md hover:border-blue-300 transition-all bg-white cursor-pointer group"
                      >
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">{task.title}</h4>
                          <div className="flex gap-2 mt-1">
                             <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase inline-block ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
                             {task.timeSlots?.length > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{task.timeSlots[0].split('-')[0]}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[10px] font-extrabold uppercase ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>{isOverdue ? 'Overdue' : 'Pending'}</p>
                          <p className="text-[9px] text-gray-500 font-bold mt-0.5">{new Date(task.dueDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</p>
                        </div>
                      </div>
                    )
                  })}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL JADWAL HARIAN (TIMELINE) --- */}
      {dailyScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-gray-900 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-600" /> Ringkasan Jadwal Harian</h3>
               <button onClick={() => setDailyScheduleModal(null)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50/50">
               <h4 className="text-center font-extrabold text-blue-800 mb-6 text-lg">{new Date(dailyScheduleModal).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</h4>
               
               {(() => {
                  const dayT = tasks.filter(t => t.dueDate === dailyScheduleModal);
                  dayT.sort((a,b) => {
                     const ta = a.timeSlots?.length ? a.timeSlots[0] : '24:00';
                     const tb = b.timeSlots?.length ? b.timeSlots[0] : '24:00';
                     return ta.localeCompare(tb);
                  });
                  
                  if (dayT.length === 0) return <p className="text-center text-gray-400 italic font-medium py-10">Tidak ada jadwal pekerjaan untuk hari ini. Waktunya bersantai!</p>;

                  return (
                    <div className="relative border-l-2 border-blue-200 ml-3 pl-6 space-y-6">
                      {dayT.map(t => (
                        <div key={t.id} className="relative group">
                           {/* Titik Timeline */}
                           <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 group-hover:scale-125 transition-transform"></div>
                           
                           {/* Kartu Tugas */}
                           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all" onClick={() => setSelectedTaskModal(t)}>
                              <div className="flex flex-wrap gap-2 items-center mb-2">
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> {t.timeSlots?.length ? t.timeSlots.join(', ') : 'Sepanjang Hari'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${t.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>{t.status}</span>
                              </div>
                              <h5 className="font-bold text-gray-900 text-sm">{t.title}</h5>
                              {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
                              
                              {isLeader && t.agentNumber !== user.agentNumber && (
                                <div className="mt-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">Agen: {myAgents.find(a=>a.agentNumber===t.agentNumber)?.name}</div>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  );
               })()}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL TASK DETAIL --- */}
      {selectedTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-blue-600" /> Detail Tugas</h3>
              <button onClick={() => setSelectedTaskModal(null)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getPriorityStyle(selectedTaskModal.priority)}`}>{selectedTaskModal.priority} Priority</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${selectedTaskModal.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>{selectedTaskModal.status}</span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">{selectedTaskModal.title}</h2>
              <div className="text-sm text-gray-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 leading-relaxed whitespace-pre-wrap">
                {selectedTaskModal.description || <span className="italic text-gray-400">Tidak ada keterangan spesifik untuk tugas ini.</span>}
              </div>
              
              <div className="space-y-3 bg-white p-4 border border-gray-100 rounded-xl shadow-sm">
                <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-orange-500"/> Tanggal</span>
                  <span className="text-sm font-bold text-gray-900">{new Date(selectedTaskModal.dueDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</span>
                </div>
                {/* REVISI: Penambahan Waktu Jam di dalam Card */}
                <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500"/> Waktu / Jam</span>
                  <span className="text-sm font-bold text-gray-900">{selectedTaskModal.timeSlots?.length ? selectedTaskModal.timeSlots.join(', ') : 'Sepanjang Hari'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1.5"><User className="w-4 h-4 text-blue-500"/> Ditugaskan Kepada</span>
                  <span className="text-sm font-bold text-gray-900">{selectedTaskModal.agentNumber === user.agentNumber ? 'Anda Pribadi' : myAgents.find(a => a.agentNumber === selectedTaskModal.agentNumber)?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-slate-500"/> Dibuat Oleh</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{selectedTaskModal.assigner}</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedTaskModal(null)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm">Tutup Detail</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Tasks;