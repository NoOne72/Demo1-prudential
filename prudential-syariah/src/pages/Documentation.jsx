// src/pages/Documentation.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getFolders, getFiles } from '../utils/auth';
import { 
  Folder, File, FileText, Eye, Download, X, Search, BookOpen, ChevronRight 
} from 'lucide-react';

const Documentation = () => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals untuk Preview
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    setFolders(getFolders());
    setFiles(getFiles());
  }, []);

  // --- LOGIKA DOWNLOAD (Sama persis dengan Admin, super aman) ---
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

  // --- FILTERING FILE ---
  const displayedFiles = files.filter(f => {
    const matchFolder = activeFolderId === 'all' || f.folderId === activeFolderId;
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <Layout>
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><BookOpen className="w-8 h-8 text-emerald-700" /> Pusat Materi & Edukasi</h1>
        <p className="text-gray-500 mt-2">Akses skrip penawaran, brosur produk, dan dokumen penting untuk menunjang penjualan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* KOLOM KIRI: Daftar Folder */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4">Direktori Materi</h2>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveFolderId('all')} 
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${activeFolderId === 'all' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                <span className="flex items-center gap-2"><Folder className={`w-4 h-4 ${activeFolderId === 'all' ? 'text-emerald-600' : 'text-gray-400'}`}/> Semua File</span>
                {activeFolderId === 'all' && <ChevronRight className="w-4 h-4" />}
              </button>
              
              {folders.map(folder => (
                <button 
                  key={folder.id} 
                  onClick={() => setActiveFolderId(folder.id)} 
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-sm ${activeFolderId === folder.id ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                >
                  <span className="flex items-center gap-2"><Folder className={`w-4 h-4 ${activeFolderId === folder.id ? 'text-emerald-600' : 'text-gray-400'}`}/> {folder.name}</span>
                  {activeFolderId === folder.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Daftar File & Pencarian */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 min-h-[60vh] flex flex-col">
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Cari nama dokumen atau script..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* List File */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedFiles.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-bold text-lg">File Tidak Ditemukan</p>
                  <p className="text-sm">Coba cari dengan kata kunci lain atau pilih folder berbeda.</p>
                </div>
              ) : (
                displayedFiles.map(file => {
                  const isNotebook = file.type === 'notebook';
                  const folderName = folders.find(f => f.id === file.folderId)?.name || 'General';

                  return (
                    <div key={file.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`p-3 rounded-xl shrink-0 ${isNotebook ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                          {isNotebook ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors" title={file.name}>{file.name}</h4>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase mt-1 tracking-wider">{folderName}</p>
                        </div>
                      </div>
                      
                      <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                        <button onClick={() => setPreviewModal(file)} className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors">
                          <Eye className="w-4 h-4" /> Baca
                        </button>
                        <button onClick={() => handleDownload(file)} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors">
                          <Download className="w-4 h-4" /> Unduh
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL PREVIEW (Sama dengan Admin) --- */}
      {previewModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Membaca Materi: <span className="text-emerald-700 ml-1">{previewModal.name}</span>
              </h3>
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
                  <button onClick={() => handleDownload(previewModal)} className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 mx-auto"><Download className="w-4 h-4"/> Download File Saja</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Documentation;