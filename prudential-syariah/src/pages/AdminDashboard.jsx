// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  registerNewUser, getAllUsers, getAllLeaders, 
  getBanners, addBanner, deleteBanner, updateBanner
} from '../utils/auth';
import { 
  UserPlus, FolderPlus, ImagePlus, CheckCircle2, 
  X, Trash2, Edit, PlusCircle, AlertTriangle 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  
  // State form registrasi user
  const [regName, setRegName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regRole, setRegRole] = useState('agent');
  const [regLeaderId, setRegLeaderId] = useState('');
  const [notif, setNotif] = useState('');

  // State Banner & Modal
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [banners, setBanners] = useState([]);
  
  // State untuk Data Form Banner & Status Edit
  const [newBanner, setNewBanner] = useState({ 
    badge: '', title: '', description: '', imageUrl: '', imagePosition: 'bg-center' 
  });
  const [editingBannerId, setEditingBannerId] = useState(null); // Null = Mode Tambah Baru
  
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, bannerId: null });

  const loadData = () => {
    setUsers(getAllUsers());
    setLeaders(getAllLeaders());
    setBanners(getBanners());
  };

  useEffect(() => { loadData(); }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    if (regRole === 'agent' && !regLeaderId) return alert('Harap pilih Leader!');
    
    const result = registerNewUser(regName, regNumber, regRole, regRole === 'agent' ? regLeaderId : null);
    if (result.success) {
      setNotif(result.message);
      setRegName(''); setRegNumber(''); setRegLeaderId('');
      loadData();
      setTimeout(() => setNotif(''), 3000);
    } else alert(result.message);
  };

  // --- FUNGSI MANAJEMEN BANNER ---
  const handleSaveBanner = (e) => {
    e.preventDefault();
    if (newBanner.title && newBanner.imageUrl) {
      if (editingBannerId) {
        // Mode Edit
        updateBanner(editingBannerId, newBanner);
      } else {
        // Mode Tambah
        addBanner(newBanner);
      }
      cancelEdit(); // Reset form setelah simpan
      loadData(); 
    }
  };

  const initiateEditBanner = (banner) => {
    setNewBanner({
      badge: banner.badge,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      imagePosition: banner.imagePosition || 'bg-center'
    });
    setEditingBannerId(banner.id);
  };

  const cancelEdit = () => {
    setNewBanner({ badge: '', title: '', description: '', imageUrl: '', imagePosition: 'bg-center' });
    setEditingBannerId(null);
  };

  const initiateDeleteBanner = (id) => setDeleteConfirmModal({ show: true, bannerId: id });
  
  const confirmDeleteBanner = () => {
    if (deleteConfirmModal.bannerId) {
      deleteBanner(deleteConfirmModal.bannerId);
      loadData();
      setDeleteConfirmModal({ show: false, bannerId: null });
      // Jika yang dihapus sedang diedit, reset formnya
      if (deleteConfirmModal.bannerId === editingBannerId) cancelEdit();
    }
  };

  const getLeaderName = (leaderId) => {
    const leader = leaders.find(l => l.agentNumber === leaderId);
    return leader ? leader.name : 'Unknown';
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-gray-500 mt-2">Kelola pendaftaran user, banner carousel, dan dokumentasi file.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Pendaftaran User (Tetap Sama) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 text-green-900 mb-6">
            <UserPlus className="w-6 h-6" />
            <h2 className="text-xl font-bold">Daftar Akun Baru</h2>
          </div>

          {notif && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" /> {notif}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-900 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Agen</label>
              <input type="text" required value={regNumber} onChange={e => setRegNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-300 focus:ring-2 focus:ring-green-900 focus:outline-none" placeholder="Contoh: PRU1234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Akun (Role)</label>
              <select value={regRole} onChange={e => { setRegRole(e.target.value); setRegLeaderId(''); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-green-900 focus:outline-none">
                <option value="agent">Agent</option>
                <option value="leader">Leader</option>
              </select>
            </div>
            {regRole === 'agent' && (
              <div className="p-3 bg-slate-50 border border-gray-200 rounded-lg mt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Tim Leader <span className="text-red-500">*</span></label>
                <select required value={regLeaderId} onChange={e => setRegLeaderId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-green-900 focus:outline-none">
                  <option value="" disabled>-- Pilih Leader --</option>
                  {leaders.map(ldr => (
                    <option key={ldr.agentNumber} value={ldr.agentNumber}>{ldr.name} ({ldr.agentNumber})</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" className="w-full bg-green-900 text-white font-medium py-2.5 rounded-lg hover:bg-green-800 transition-colors mt-2">
              Daftarkan Akun
            </button>
          </form>
        </div>

        {/* Kolom Quick Action & Tabel User (Tetap Sama) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setShowBannerModal(true)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><ImagePlus className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-700">Manajemen Banner</h3>
                <p className="text-xs text-gray-500 mb-2">Tambah/Hapus/Edit poster di Carousel.</p>
                <span className="text-sm text-blue-600 font-medium">Buka Panel &rarr;</span>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/documentation')}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors"><FolderPlus className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-orange-700">Manajemen Dokumen</h3>
                <p className="text-xs text-gray-500 mb-2">Upload file dan atur susunan struktur folder.</p>
                <span className="text-sm text-orange-600 font-medium">Buka Library &rarr;</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Daftar Akun Terdaftar</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-y border-gray-100">
                  <tr className="text-sm text-gray-500">
                    <th className="py-3 px-4 font-semibold">Nama</th>
                    <th className="py-3 px-4 font-semibold">Nomor Agen</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Tim Circle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 text-sm hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-bold">{u.name}</td>
                      <td className="py-3 px-4 text-gray-600">{u.agentNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'leader' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium">
                        {u.role === 'agent' ? (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> {getLeaderName(u.leaderId)}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL MANAJEMEN BANNER --- */}
      {showBannerModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row h-[85vh]">
            
            {/* Kiri: List Banner */}
            <div className="flex-1 bg-slate-50 border-r border-gray-200 flex flex-col overflow-hidden relative">
              <div className="p-6 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Banner Aktif</h2>
                <p className="text-xs text-gray-500 mt-1">Banner ini sedang tayang di halaman Leader & Agent.</p>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {banners.map(banner => (
                  <div 
                    key={banner.id} 
                    className={`bg-white border-2 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all ${
                      editingBannerId === banner.id ? 'border-green-500 shadow-md ring-2 ring-green-100' : 'border-gray-200'
                    }`}
                  >
                    <div className={`h-32 bg-gray-200 bg-cover relative ${banner.imagePosition || 'bg-center'}`} style={{ backgroundImage: `url(${banner.imageUrl})`}}>
                      <div className="absolute inset-0 bg-black/40"></div>
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow">
                        {banner.badge}
                      </span>
                      {/* Indikator Sedang Diedit */}
                      {editingBannerId === banner.id && (
                        <div className="absolute top-3 right-3 bg-green-900 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse shadow">
                          SEDANG DIEDIT
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900">{banner.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{banner.description}</p>
                      </div>
                      
                      {/* Tombol Aksi: Edit & Hapus */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => initiateEditBanner(banner)}
                          className={`p-2 rounded-lg transition-colors ${editingBannerId === banner.id ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title="Edit Banner"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => initiateDeleteBanner(banner.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Banner"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <p className="text-sm text-center text-gray-400 italic mt-10">Belum ada banner.</p>}
              </div>
            </div>

            {/* Kanan: Form Tambah/Edit & Live Preview */}
            <div className="w-full md:w-[450px] flex flex-col relative bg-white transition-all">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {editingBannerId ? (
                      <><Edit className="w-5 h-5 text-blue-600" /> Edit Banner</>
                    ) : (
                      <><PlusCircle className="w-5 h-5 text-green-900" /> Tambah Banner</>
                    )}
                  </h3>
                  {editingBannerId && (
                    <button onClick={cancelEdit} className="text-[10px] text-blue-600 font-bold hover:underline mt-1">
                      BATALKAN EDIT & TAMBAH BARU
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => { setShowBannerModal(false); cancelEdit(); }} 
                  disabled={deleteConfirmModal.show}
                  className={`text-gray-400 hover:text-red-500 self-start ${deleteConfirmModal.show ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveBanner} className="p-6 flex-1 overflow-y-auto flex flex-col space-y-4">
                
                {/* === FITUR LIVE PREVIEW === */}
                <div className="mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Live Preview</label>
                  <div className="w-full h-36 bg-slate-100 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner">
                    {newBanner.imageUrl ? (
                      <div 
                        className={`w-full h-full bg-cover transition-all duration-300 ${newBanner.imagePosition}`}
                        style={{ backgroundImage: `url(${newBanner.imageUrl})` }}
                      >
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                           <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded w-max mb-1 uppercase">
                             {newBanner.badge || 'BADGE'}
                           </span>
                           <h4 className="text-white font-bold text-sm leading-tight drop-shadow-md">
                             {newBanner.title || 'Judul Banner Muncul Disini'}
                           </h4>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-4">
                        Masukkan URL gambar untuk pratinjau
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Badge</label>
                    <input type="text" required value={newBanner.badge} onChange={e => setNewBanner({...newBanner, badge: e.target.value})} placeholder="Promo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fokus Gambar</label>
                    <select required value={newBanner.imagePosition} onChange={e => setNewBanner({...newBanner, imagePosition: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none bg-white">
                      <option value="bg-top">Atas</option>
                      <option value="bg-center">Tengah (Center)</option>
                      <option value="bg-bottom">Bawah</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Judul Utama</label>
                  <input type="text" required value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} placeholder="Pelatihan Agen 2024" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deskripsi Singkat</label>
                  <textarea required value={newBanner.description} onChange={e => setNewBanner({...newBanner, description: e.target.value})} placeholder="Deskripsi acara..." rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none resize-none"></textarea>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">URL / Link Gambar</label>
                  <input type="url" required value={newBanner.imageUrl} onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} placeholder="https://contoh.com/gambar.jpg" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-900 focus:outline-none" />
                </div>
                
                <div className="pt-2 mt-auto">
                  <button type="submit" disabled={deleteConfirmModal.show} className={`w-full py-3 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${editingBannerId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-900 hover:bg-green-800'}`}>
                    {editingBannerId ? 'Simpan Perubahan' : 'Terbitkan Banner'}
                  </button>
                </div>
              </form>

              {/* POP-UP KONFIRMASI HAPUS */}
              {deleteConfirmModal.show && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-100 animate-in fade-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Banner?</h3>
                    <p className="text-sm text-gray-500 mb-6">Tindakan ini tidak dapat dibatalkan. Banner ini tidak akan lagi tampil di halaman user.</p>
                    <div className="flex gap-3 justify-center">
                      <button 
                        onClick={() => setDeleteConfirmModal({ show: false, bannerId: null })} 
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmDeleteBanner} 
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Ya, Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default AdminDashboard;