import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Download, AlertCircle, FileText, CheckCircle } from 'lucide-react';

interface VersionInfo {
  version: string;
  notes: string;
  fileName: string;
  uploadDate: string;
  size: number;
  downloadUrl?: string; // Constructed on frontend or received
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AppUpdateManager = () => {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetchLatestVersion();
  }, []);

  const fetchLatestVersion = async () => {
    try {
      const response = await axios.get(`${API_URL}/updates/latest`);
      setLatestVersion(response.data);
    } catch (error) {
      console.log('No latest version found or error fetching');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Selecione um arquivo APK!' });
      return;
    }

    const formData = new FormData();
    formData.append('apk', file);
    formData.append('version', version);
    formData.append('notes', notes);

    setUploading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token'); // Assuming auth is needed / stored
      await axios.post(`${API_URL}/updates/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      setMessage({ type: 'success', text: 'Upload concluído com sucesso!' });
      setVersion('');
      setNotes('');
      setFile(null);
      // Reset file input manually if needed using ref, but state null is ok for logic
      fetchLatestVersion();
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erro ao enviar arquivo.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Publicar Nova Atualização
        </h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Versão (ex: 1.0.9)</label>
            <input 
              type="text" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="1.0.0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas da Atualização</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none h-24"
              placeholder="O que há de novo nesta versão..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo APK</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <input 
                type="file" 
                accept=".apk"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                "
              />
              {file && <p className="mt-2 text-sm text-green-600 font-medium">Selecionado: {file.name}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2
              ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {uploading ? 'Enviando...' : <><Upload size={20} /> Enviar Atualização</>}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}
      </div>

      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Download className="w-6 h-6" />
          Versão Atual Disponível
        </h2>
        
        {latestVersion ? (
          <div className="bg-gray-50 rounded-lg p-4 border box-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Versão {latestVersion.version}</h3>
                <p className="text-sm text-gray-500">Enviado em: {new Date(latestVersion.uploadDate).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Tamanho: {(latestVersion.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <a 
                href={latestVersion.downloadUrl} 
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} /> Download
              </a>
            </div>
            
            {latestVersion.notes && (
              <div className="bg-white p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                   <FileText size={14} /> Notas da versão:
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{latestVersion.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">Nenhuma versão disponível para download.</p>
        )}
      </div>
    </div>
  );
};
