// src/utils/auth.js

export const initDB = () => {
  // FIX BUG LOGIN: Paksa Admin Utama selalu ada di database
  let users = JSON.parse(localStorage.getItem('users'));
  if (!users || !Array.isArray(users)) users = [];
  
  if (!users.some(u => u.role === 'admin')) {
    users.unshift({ name: 'Admin Utama', agentNumber: 'ADMIN-001', role: 'admin', target: 0 });
    localStorage.setItem('users', JSON.stringify(users));
  }

  if (!localStorage.getItem('banners')) localStorage.setItem('banners', JSON.stringify([]));
  if (!localStorage.getItem('reports')) localStorage.setItem('reports', JSON.stringify([]));
  if (!localStorage.getItem('premium_inputs')) localStorage.setItem('premium_inputs', JSON.stringify([]));
  if (!localStorage.getItem('folders')) localStorage.setItem('folders', JSON.stringify([{ id: 1, name: 'General', parentId: null }]));
  if (!localStorage.getItem('files')) localStorage.setItem('files', JSON.stringify([]));
  if (!localStorage.getItem('tasks')) localStorage.setItem('tasks', JSON.stringify([]));
  if (!localStorage.getItem('prospects')) localStorage.setItem('prospects', JSON.stringify([]));
};

export const loginUser = (name, agentNumber) => {
  initDB();
  const users = JSON.parse(localStorage.getItem('users')) || [];
  // FIX BUG LOGIN: Tambahkan .trim() agar kebal terhadap spasi yang tidak disengaja
  const user = users.find((u) => u.name.toLowerCase().trim() === name.toLowerCase().trim() && u.agentNumber.trim() === agentNumber.trim());
  if (user) { localStorage.setItem('currentUser', JSON.stringify(user)); return user; }
  return null;
};

export const logoutUser = () => localStorage.removeItem('currentUser');
export const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser')) || null;

export const registerNewUser = (name, agentNumber, role, leaderId = null) => {
  initDB(); // Pastikan DB siap
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.find(u => u.agentNumber.trim() === agentNumber.trim())) return { success: false, message: 'Nomor Agen sudah terdaftar!' };
  
  const newUser = { name: name.trim(), agentNumber: agentNumber.trim(), role, target: role === 'leader' ? 1000 : 100 };
  if (role === 'agent' && leaderId) newUser.leaderId = leaderId;
  
  users.push(newUser); 
  localStorage.setItem('users', JSON.stringify(users));
  return { success: true, message: 'User berhasil didaftarkan!' };
};

export const getAllUsers = () => JSON.parse(localStorage.getItem('users')) || [];
export const getAllLeaders = () => getAllUsers().filter(u => u.role === 'leader');
export const getAgentsByLeader = (leaderId) => getAllUsers().filter(u => u.role === 'agent' && u.leaderId === leaderId);
export const updateUserTarget = (agentNumber, newTarget) => {
  const users = getAllUsers(); const index = users.findIndex(u => u.agentNumber === agentNumber);
  if (index !== -1) {
    users[index].target = parseFloat(newTarget); localStorage.setItem('users', JSON.stringify(users));
    const current = getCurrentUser();
    if (current && current.agentNumber === agentNumber) { current.target = parseFloat(newTarget); localStorage.setItem('currentUser', JSON.stringify(current)); }
  }
};

export const getBanners = () => JSON.parse(localStorage.getItem('banners')) || [];
export const addBanner = (obj) => { const b = getBanners(); b.push({ ...obj, id: Date.now() }); localStorage.setItem('banners', JSON.stringify(b)); };
export const deleteBanner = (id) => { localStorage.setItem('banners', JSON.stringify(getBanners().filter(b => b.id !== id))); };

export const getReports = () => JSON.parse(localStorage.getItem('reports')) || [];
export const addReport = (obj) => { const r = getReports(); r.unshift({ ...obj, id: Date.now(), date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) }); localStorage.setItem('reports', JSON.stringify(r)); };
export const getReportsForLeader = (leaderId) => getReports().filter(r => r.leaderId === leaderId);

export const getPremiumInputs = () => JSON.parse(localStorage.getItem('premium_inputs')) || [];
export const addPremiumInput = (agentNumber, leaderId, clientName, productType, amount) => { const inputs = getPremiumInputs(); inputs.push({ id: Date.now(), agentNumber, leaderId, clientName, productType, amount: parseFloat(amount), date: new Date().toISOString() }); localStorage.setItem('premium_inputs', JSON.stringify(inputs)); };
export const getAgentTotalAPI = (agentNumber) => getPremiumInputs().filter(i => i.agentNumber === agentNumber).reduce((sum, current) => sum + current.amount, 0);
export const getTeamTotalAPI = (leaderId) => getPremiumInputs().filter(i => i.leaderId === leaderId).reduce((sum, current) => sum + current.amount, 0);

export const getFolders = () => JSON.parse(localStorage.getItem('folders')) || [];
export const addFolderDB = (folder) => { const f = getFolders(); f.push(folder); localStorage.setItem('folders', JSON.stringify(f)); };

export const getFiles = () => JSON.parse(localStorage.getItem('files')) || [];
export const addFileDB = (file) => { const f = getFiles(); f.unshift(file); localStorage.setItem('files', JSON.stringify(f)); };
export const deleteFileDB = (id) => { localStorage.setItem('files', JSON.stringify(getFiles().filter(x => x.id !== id))); };
export const renameFileDB = (id, newName) => { 
  const f = getFiles(); 
  const index = f.findIndex(x => x.id === id); 
  if (index !== -1) { f[index].name = newName; localStorage.setItem('files', JSON.stringify(f)); } 
};

export const getTasks = () => JSON.parse(localStorage.getItem('tasks')) || [];
export const addTaskDB = (task) => { const t = getTasks(); t.unshift(task); localStorage.setItem('tasks', JSON.stringify(t)); };
export const toggleTaskStatus = (taskId) => { const t = getTasks(); const index = t.findIndex(x => x.id === taskId); if (index !== -1) { t[index].status = t[index].status === 'Pending' ? 'Completed' : 'Pending'; localStorage.setItem('tasks', JSON.stringify(t)); } };
export const deleteTaskDB = (taskId) => { localStorage.setItem('tasks', JSON.stringify(getTasks().filter(x => x.id !== taskId))); };
export const completeTaskByTitle = (titleKeyword, agentNumber) => {
  const t = getTasks(); let changed = false;
  t.forEach(task => { if (task.agentNumber === agentNumber && task.title.includes(titleKeyword) && task.status === 'Pending') { task.status = 'Completed'; changed = true; }});
  if (changed) localStorage.setItem('tasks', JSON.stringify(t));
};

export const getProspects = () => JSON.parse(localStorage.getItem('prospects')) || [];
export const addProspectDB = (prospect) => { const p = getProspects(); p.unshift({ ...prospect, id: Date.now(), status: 'Contact', appointmentDate: null, appointmentTime: [], followUpCount: 0, followUpLogs: [], closingLogs: [] }); localStorage.setItem('prospects', JSON.stringify(p)); };
export const setAppointmentDB = (id, date, timeSlots) => { const p = getProspects(); const index = p.findIndex(x => x.id === id); if (index !== -1) { p[index].status = 'Appointment'; p[index].appointmentDate = date; p[index].appointmentTime = timeSlots || []; localStorage.setItem('prospects', JSON.stringify(p)); }};
export const submitFollowUpDB = (id, note) => { const p = getProspects(); const index = p.findIndex(x => x.id === id); if (index !== -1) { p[index].status = 'Follow Up'; p[index].followUpCount = (p[index].followUpCount || 0) + 1; if (!p[index].followUpLogs) p[index].followUpLogs = []; p[index].followUpLogs.unshift({ count: p[index].followUpCount, date: new Date().toISOString(), apptDate: p[index].appointmentDate, apptTime: p[index].appointmentTime, note: note }); localStorage.setItem('prospects', JSON.stringify(p)); }};
export const submitClosingDB = (id, product, amount, agentNumber, leaderId) => { const p = getProspects(); const index = p.findIndex(x => x.id === id); if (index !== -1) { p[index].status = 'Closed'; if (!p[index].closingLogs) p[index].closingLogs = []; p[index].closingLogs.unshift({ id: Date.now(), date: new Date().toISOString(), product: product, amount: parseFloat(amount) }); localStorage.setItem('prospects', JSON.stringify(p)); addPremiumInput(agentNumber, leaderId, p[index].name, product, amount); }};
export const incrementProspectFollowUpDB = (id) => { const p = getProspects(); const index = p.findIndex(x => x.id === id); if (index !== -1) { p[index].followUpCount = (p[index].followUpCount || 0) + 1; localStorage.setItem('prospects', JSON.stringify(p)); }};
export const updateProspectStatusDB = (id, newStatus, appointmentDate = null) => { const p = getProspects(); const index = p.findIndex(x => x.id === id); if (index !== -1) { p[index].status = newStatus; if (appointmentDate) p[index].appointmentDate = appointmentDate; localStorage.setItem('prospects', JSON.stringify(p)); }};