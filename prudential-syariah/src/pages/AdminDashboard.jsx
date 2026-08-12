// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  getCurrentUser, getAllUsers, registerNewUser, getAllLeaders,
  getBanners, addBanner, deleteBanner, 
  getFolders, getFiles, addFileDB, deleteFileDB, renameFileDB 
} from '../utils/auth';
import { 
  ShieldCheck, Folder, File, Trash2, Image as ImageIcon, 
  Plus, Edit2, Eye, Download, FileText, X, UserPlus, Link, Upload
} from 'lucide-react';

const AdminDashboard = () => {
  const user = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  // --- STATE REGISTRASI AGEN/LEADER ---
  const [regName, setRegName] = useState('');
  const [regAgentNumber, setRegAgentNumber] = useState('');
  const [regRole, setRegRole] = useState('agent');
  const [regLeaderId, setRegLeaderId] = useState('');
  const [regMsg, setRegMsg] = useState({ text: '', type: '' });
  
  // --- STATE MATERIAL UPLOAD ---
  const [uploadType, setUploadType] = useState('file'); 
  const [selectedFolder, setSelectedFolder] = useState('');
  const [matFile, setMatFile] = useState(null);
  const [notebookTitle, setNotebookTitle] = useState('');
  const [notebookContent, setNotebookContent] = useState('');

  // --- MODALS ---
  const [previewModal, setPreviewModal] = useState(null); 
  const [renameModal, setRenameModal] = useState(null);
  const [renameText, setRenameText] = useState('');
  
  // --- STATE BANNER UPLOAD MODAL ---
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDescription, setBannerDescription] = useState(''); 
  const [bannerLink, setBannerLink] = useState('');
  const [bannerFileObj, setBannerFileObj] = useState(null);

  const loadData = () => {
    setUsers(getAllUsers().filter(u => u.role !== 'admin'));
    setLeaders(getAllLeaders());
    setBanners(getBanners());
    setFolders(getFolders());
    setFiles(getFiles());
  };

  useEffect(() => { loadData(); }, []);

  const handleRegisterUser = (e) => {
    e.preventDefault();
    setRegMsg({ text: '', type: '' });

    if (regRole === 'agent' && !regLeaderId) {
      return setRegMsg({ text: 'Pilih Leader untuk Agen ini!', type: 'error' });
    }

    const res = registerNewUser(regName, regAgentNumber, regRole, regLeaderId);
    if (res.success) {
      setRegMsg({ text: 'Registrasi Berhasil!', type: 'success' });
      setRegName(''); setRegAgentNumber(''); setRegRole('agent'); setRegLeaderId('');
      loadData();
      setTimeout(() => setRegMsg({ text: '', type: '' }), 3000);
    } else {
      setRegMsg({ text: res.message, type: 'error' });
    }
  };

  const submitBanner = (e) => {
    e.preventDefault();
    if (!bannerFileObj) return alert('Silakan pilih file gambar banner!');
    if (bannerFileObj.size > 2 * 1024 * 1024) return alert('Maksimal 2MB untuk versi LocalStorage Demo.');
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      addBanner({ 
        title: bannerTitle, 
        description: bannerDescription,
        link: bannerLink, 
        image: ev.target.result, 
        active: true 
      });
      setShowBannerModal(false);
      setBannerTitle('');
      setBannerDescription('');
      setBannerLink('');
      setBannerFileObj(null);
      loadData();
    };
    reader.readAsDataURL(bannerFileObj);
  };

  const handleMaterialUpload = (e) => {
    e.preventDefault();
    if (!selectedFolder) return alert('Pilih folder terlebih dahulu!');

    if (uploadType === 'file') {
      if (!matFile) return alert('Pilih file!');
      if (matFile.size > 2 * 1024 * 1024) return alert('Maksimal 2MB untuk versi LocalStorage Demo.');
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        addFileDB({
          id: Date.now(), folderId: parseInt(selectedFolder),
          name: matFile.name, type: 'file', mimeType: matFile.type,
          data: ev.target.result,
          createdAt: new Date().toISOString()
        });
        setMatFile(null); 
        document.getElementById('file-upload-input').value = ''; 
        loadData();
      };
      reader.readAsDataURL(matFile);

    } else if (uploadType === 'notebook') {
      if (!notebookTitle || !notebookContent) return alert('Isi judul dan konten notebook!');
      
      addFileDB({
        id: Date.now(), folderId: parseInt(selectedFolder),
        name: notebookTitle, type: 'notebook', mimeType: 'text/plain',
        content: notebookContent,
        createdAt: new Date().toISOString()
      });
      setNotebookTitle(''); setNotebookContent(''); loadData();
    }
  };

  const submitRename = (e) => {
    e.preventDefault();
    if (renameModal && renameText) {
      renameFileDB(renameModal.id, renameText);
      setRenameModal(null); setRenameText(''); loadData();
    }
  };

  const handleDownload = (file) => {
    if (file.type === 'notebook') {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${file.name}.txt`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const a = document.createElement('a'); a.href = file.data; a.download = file.name; a.click();
    }
  };

  if (user?.role !== 'admin') return <Layout><div className="p-10 text-center font-bold text-red-600">Akses Ditolak.</div></Layout>;

  return (
    <Layout>
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-red-600" /> Admin Control Panel</h1>
        <p className="text-gray-500 mt-2">Kelola pendaftaran Agen/Leader, Banner Promo, dan Materi Pembelajaran.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- KOLOM KIRI --- */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><UserPlus className="w-5 h-5 text-indigo-600"/> Pendaftaran Agen & Leader</h2>
            
            {regMsg.text && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-bold ${regMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {regMsg.text}
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Lengkap</label><input type="text" required value={regName} onChange={e=>setRegName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" /></div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nomor Agen / ID Baru</label><input type="text" required value={regAgentNumber} onChange={e=>setRegAgentNumber(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role/Peran</label><select value={regRole} onChange={e=>setRegRole(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white"><option value="agent">Agen</option><option value="leader">Leader</option></select></div>
                {regRole === 'agent' && (
                  <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Leader</label><select required value={regLeaderId} onChange={e=>setRegLeaderId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white"><option value="" disabled>-- Leader --</option>{leaders.map(l => <option key={l.agentNumber} value={l.agentNumber}>{l.name}</option>)}</select></div>
                )}
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-sm">Daftarkan Akun</button>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-4">
               <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Daftar Pengguna Aktif ({users.length})</h3>
               <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                 {users.map(u => (
                   <div key={u.agentNumber} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                     <div>
                       <p className="text-sm font-bold text-gray-900">{u.name}</p>
                       <p className="text-[10px] text-gray-500">{u.agentNumber}</p>
                     </div>
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.role === 'leader' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-pink-600"/> Kelola Banner Promo</h2>
              <button onClick={() => setShowBannerModal(true)} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-pink-200 transition-colors">
                <Plus className="w-3 h-3"/> Tambah Banner
              </button>
            </div>
            
            <div className="space-y-3">
              {banners.length === 0 ? <p className="text-sm text-gray-500 italic">Belum ada banner aktif.</p> : banners.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden w-full">
                    <img src={b.image} alt="banner" className="h-14 w-24 object-cover rounded-lg border border-gray-200 shrink-0" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Gambar+Rusak'} />
                    <div className="truncate flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{b.title || 'Banner Tanpa Judul'}</p>
                      {b.description && <p className="text-xs text-gray-600 truncate mt-0.5">{b.description}</p>}
                      {b.link ? (
                        <a href={b.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5 truncate"><Link className="w-3 h-3 shrink-0"/> {b.link}</a>
                      ) : (
                        <p className="text-[10px] text-gray-400 mt-0.5">Tidak ada tautan web</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => {deleteBanner(b.id); loadData();}} className="p-2 text-red-500 hover:bg-red-100 rounded-lg shrink-0 ml-2"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- KOLOM KANAN --- */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col h-[1000px] lg:h-auto">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Folder className="w-5 h-5 text-green-600"/> Upload Materi Pembelajaran</h2>
          
          <form onSubmit={handleMaterialUpload} className="bg-slate-50 p-4 rounded-2xl border border-gray-200 mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Folder</label><select required value={selectedFolder} onChange={e=>setSelectedFolder(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white"><option value="" disabled>-- Folder --</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipe Upload</label><select value={uploadType} onChange={e=>setUploadType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white font-bold text-green-800"><option value="file">File Dokumen/Gambar</option><option value="notebook">Catatan Teks / Link</option></select></div>
            </div>

            {uploadType === 'file' ? (
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih File (Max 2MB)</label><input id="file-upload-input" type="file" required onChange={e => setMatFile(e.target.files[0])} className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-sm" /></div>
            ) : (
               <div className="space-y-3 animate-in slide-in-from-top-2">
                 <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Judul Catatan</label><input type="text" required value={notebookTitle} onChange={e=>setNotebookTitle(e.target.value)} placeholder="Contoh: Script Offering..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" /></div>
                 <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Isi Catatan / Link</label><textarea required value={notebookContent} onChange={e=>setNotebookContent(e.target.value)} rows="4" placeholder="Ketik script atau paste link YouTube di sini..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none"></textarea></div>
               </div>
            )}
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-sm flex items-center justify-center gap-2"><Upload className="w-4 h-4"/> Mulai Upload</button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
             {files.length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">Belum ada file materi.</p> : files.map(f => (
               <div key={f.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3 overflow-hidden">
                   {f.type === 'notebook' ? <FileText className="w-8 h-8 text-orange-500 shrink-0"/> : <File className="w-8 h-8 text-blue-500 shrink-0"/>}
                   <div className="truncate">
                     <p className="font-bold text-sm text-gray-900 truncate">{f.name}</p>
                     <p className="text-[10px] text-gray-500 uppercase">{f.type === 'notebook' ? 'NOTEBOOK TEXT' : 'FILE DOKUMEN'} • Folder ID: {f.folderId}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-1 shrink-0">
                   <button onClick={() => setPreviewModal(f)} title="Preview" className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg"><Eye className="w-4 h-4"/></button>
                   <button onClick={() => handleDownload(f)} title="Download" className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg"><Download className="w-4 h-4"/></button>
                   <button onClick={() => { setRenameModal(f); setRenameText(f.name); }} title="Rename" className="p-1.5 text-orange-500 hover:bg-orange-100 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                   <button onClick={() => { deleteFileDB(f.id); loadData(); }} title="Hapus" className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* --- MODAL FORM UPLOAD BANNER CERDAS --- */}
      {showBannerModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-pink-50">
              <h3 className="font-bold text-pink-900 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-pink-600" /> Tambah Banner Baru</h3>
              <button onClick={() => setShowBannerModal(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-lg p-1 shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitBanner} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Judul / Nama Banner</label>
                <input type="text" required value={bannerTitle} onChange={e=>setBannerTitle(e.target.value)} placeholder="Contoh: Promo Syariah Bulan Ini" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-600" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deskripsi Singkat</label>
                <textarea value={bannerDescription} onChange={e=>setBannerDescription(e.target.value)} rows="2" placeholder="Contoh: Dapatkan ekstra komisi untuk closing produk ini..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-600 resize-none"></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Link URL (Opsional)</label>
                <input type="url" value={bannerLink} onChange={e=>setBannerLink(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-600" />
                <p className="text-[10px] text-gray-500 mt-1">Jika diisi, banner bisa diklik oleh agen.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">File Gambar (Max 2MB)</label>
                <input type="file" required accept="image/*" onChange={e => setBannerFileObj(e.target.files[0])} className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-sm" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-pink-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-pink-700 mt-4 flex items-center justify-center gap-2"><Upload className="w-4 h-4"/> Simpan Banner</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PREVIEW --- */}
      {previewModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> Preview Dokumen</h3>
              <button onClick={() => setPreviewModal(null)} className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-center">
              {previewModal.type === 'notebook' ? (
                <div className="w-full max-w-2xl bg-yellow-50 p-6 rounded-2xl border border-yellow-200 text-gray-800 whitespace-pre-wrap leading-relaxed font-medium shadow-sm">
                  <h4 className="text-xl font-bold mb-4 border-b border-yellow-200 pb-2">{previewModal.name}</h4>
                  {previewModal.content}
                </div>
              ) : previewModal.mimeType?.includes('image') ? (
                <img src={previewModal.data} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-gray-200" />
              ) : previewModal.mimeType?.includes('pdf') ? (
                <iframe src={previewModal.data} className="w-full h-[75vh] rounded-xl border border-gray-200 shadow-sm" title="PDF Preview" />
              ) : (
                <div className="text-center py-10 bg-white w-full max-w-md rounded-2xl p-8 shadow-sm">
                  <File className="w-20 h-20 text-gray-300 mx-auto mb-4"/>
                  <h4 className="text-lg font-bold text-gray-800">{previewModal.name}</h4>
                  <p className="text-sm text-gray-500 font-medium mt-2">Maaf, format file ini tidak dapat dipreview langsung di browser.</p>
                  <button onClick={() => handleDownload(previewModal)} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 mx-auto"><Download className="w-4 h-4"/> Download File Saja</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL RENAME --- */}
      {renameModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-gray-900">Ubah Nama File</h3><button onClick={() => setRenameModal(null)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button></div>
            <form onSubmit={submitRename} className="p-6">
              <input type="text" required autoFocus value={renameText} onChange={e=>setRenameText(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 mb-4" />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700">Simpan Nama Baru</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;