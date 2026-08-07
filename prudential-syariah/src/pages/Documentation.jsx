// src/pages/Documentation.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getCurrentUser, getFolders, getFiles, addFolderDB, addFileDB } from '../utils/auth';
import { 
  Folder, FileText, Image as ImageIcon, Download, 
  FolderPlus, UploadCloud, X, ArrowLeft 
} from 'lucide-react';

const Documentation = () => {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [currentFolderId, setCurrentFolderId] = useState(null); 
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  // Modals & Form
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('');

  const loadData = () => {
    setFolders(getFolders());
    setFiles(getFiles());
  };

  useEffect(() => { loadData(); }, []);

  const getFileCount = (folderId) => files.filter(f => f.folderId === folderId).length;

  const getCurrentFolderName = () => {
    if (!currentFolderId) return 'Main Directory';
    const f = folders.find(x => x.id === currentFolderId);
    return f ? f.name : 'Unknown';
  };

  const handleBack = () => {
    if (!currentFolderId) return;
    const f = folders.find(x => x.id === currentFolderId);
    setCurrentFolderId(f ? f.parentId : null);
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim() !== '') {
      addFolderDB({ id: Date.now(), name: newFolderName, parentId: currentFolderId });
      setNewFolderName('');
      setShowFolderModal(false);
      loadData();
    }
  };

  const handleUploadFile = (e) => {
    e.preventDefault();
    if (selectedFile && selectedFolderId) {
      const folderTarget = folders.find(f => f.id === parseInt(selectedFolderId));
      addFileDB({
        id: Date.now(),
        name: selectedFile.name,
        owner: user.name,
        date: new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: selectedFile.size > 1024 * 1024 ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : (selectedFile.size / 1024).toFixed(0) + ' KB',
        type: selectedFile.name.split('.').pop().toLowerCase(),
        folderId: folderTarget.id,
      });
      setSelectedFile(null);
      setSelectedFolderId('');
      setShowFileModal(false);
      loadData();
    }
  };

  const getFileIcon = (type) => {
    if (['pdf'].includes(type)) return <FileText className="w-5 h-5 text-red-500" />;
    if (['png', 'jpg', 'jpeg'].includes(type)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-green-500" />;
  };

  const displayFolders = folders.filter(f => f.parentId === currentFolderId);
  const displayFiles = currentFolderId === null ? files : files.filter(f => f.folderId === currentFolderId);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Library</h1>
          <p className="text-gray-500 mt-2">Kelola sumber daya, panduan, dan materi pelatihan tim.</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            <button onClick={() => setShowFolderModal(true)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 bg-white shadow-sm transition-colors">
              <FolderPlus className="w-4 h-4" /> Tambah Folder
            </button>
            <button onClick={() => { setSelectedFolderId(currentFolderId || ''); setShowFileModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-green-900 text-white rounded-lg text-sm font-bold hover:bg-green-800 shadow-sm transition-colors">
              <UploadCloud className="w-4 h-4" /> Upload File
            </button>
          </div>
        )}
      </div>

      {/* NAVIGASI KEMBALI */}
      {currentFolderId !== null && (
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-green-900 mb-6 font-bold text-sm bg-white px-4 py-2 w-max rounded-lg border border-gray-200 shadow-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      )}

      {/* --- FOLDER GRID BESAR --- */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
          {currentFolderId === null ? 'Direktori Utama' : `Isi Folder: ${getCurrentFolderName()}`}
        </h2>
        
        {displayFolders.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Belum ada folder di direktori ini.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayFolders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => setCurrentFolderId(folder.id)}
                className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-green-600 hover:shadow-md transition-all cursor-pointer group h-40"
              >
                <Folder className="w-14 h-14 text-blue-300 group-hover:text-green-600 transition-colors mb-3" fill="currentColor" />
                <h3 className="font-bold text-gray-800 text-base line-clamp-1">{folder.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{getFileCount(folder.id)} Item(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- FILES TABLE --- */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
          {currentFolderId === null ? 'Semua File (Recent)' : 'Dokumen Tersedia'}
        </h2>
        
        {displayFiles.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-400 font-medium">Belum ada dokumen di dalam direktori ini.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr className="text-sm font-medium text-gray-500">
                  <th className="py-4 px-6">Nama File</th>
                  <th className="py-4 px-6">Diunggah Oleh</th>
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayFiles.map((file) => (
                  <tr key={file.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-4">
                      {getFileIcon(file.type)}
                      <div>
                        <span className="font-bold text-sm text-gray-800 block">{file.name}</span>
                        <span className="text-xs text-gray-400 font-medium">{file.size}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium">{file.owner}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{file.date}</td>
                    <td className="py-4 px-6 text-center">
                      <button className="text-gray-400 hover:text-green-700 bg-white border border-gray-200 hover:border-green-700 p-2 rounded-lg transition-all shadow-sm">
                        <Download className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL BUAT FOLDER --- */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-green-900" /> Buat Folder Baru</h2>
              <button onClick={() => setShowFolderModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateFolder} className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Folder</label>
              <input type="text" required autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-900 mb-6" />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2.5 bg-green-900 text-white rounded-xl text-sm font-bold hover:bg-green-800">Buat Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL UPLOAD FILE --- */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-green-900" /> Upload Dokumen</h2>
              <button onClick={() => {setShowFileModal(false); setSelectedFile(null);}} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUploadFile} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Folder Tujuan</label>
                <select required value={selectedFolderId} onChange={(e) => setSelectedFolderId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-900 bg-white">
                  <option value="" disabled>-- Pilih Direktori --</option>
                  {folders.map(f => ( <option key={f.id} value={f.id}>{f.name}</option> ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih File</label>
                <input type="file" required onChange={(e) => setSelectedFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-900 hover:file:bg-green-100 cursor-pointer border border-gray-200 rounded-xl" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => {setShowFileModal(false); setSelectedFile(null);}} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2.5 bg-green-900 text-white rounded-xl text-sm font-bold hover:bg-green-800">Upload ke Sistem</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Documentation;