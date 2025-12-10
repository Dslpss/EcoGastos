import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { configAPI } from '../api';
import { LogOut, Settings, AlertTriangle, Smartphone, RefreshCw, Save, Users, Star, Upload } from 'lucide-react';

import { Link } from 'react-router-dom';

interface AppConfig {
  is_maintenance: boolean;
  maintenance_message: string;
  has_update: boolean;
  update_message: string;
  update_url: string;
  force_update: boolean;
  show_warning: boolean;
  warning_message: string;
  latest_version: string;
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await configAPI.getConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage('');
    try {
      await configAPI.updateConfig(config);
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save config', error);
      setMessage('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">EcoGastos Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/feature-cards"
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg"
            >
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium">Feature Cards</span>
            </Link>
            <Link 
              to="/users"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg"
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Usuários</span>
            </Link>
            <Link 
              to="/updates"
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg"
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Atualizações</span>
            </Link>

            <span className="text-sm text-gray-600 border-l pl-4 border-gray-200">Olá, {user?.name}</span>
            <button 
              onClick={logout}
              className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Maintenance Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Modo Manutenção</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config?.is_maintenance} 
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, is_maintenance: e.target.checked }) : null)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem de Manutenção</label>
                <textarea 
                  value={config?.maintenance_message}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, maintenance_message: e.target.value }) : null)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <p className="text-sm text-gray-500">
                Quando ativado, o aplicativo será bloqueado para todos os usuários com esta mensagem.
              </p>
            </div>
          </div>

          {/* Update Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Atualização do App</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config?.has_update} 
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, has_update: e.target.checked }) : null)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem da Atualização</label>
                <textarea 
                  value={config?.update_message}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, update_message: e.target.value }) : null)}
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Versão Mais Recente</label>
                <input 
                  type="text"
                  value={config?.latest_version || ''}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, latest_version: e.target.value }) : null)}
                  placeholder="1.0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL da Loja/Download</label>
                <input 
                  type="text"
                  value={config?.update_url}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, update_url: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="forceUpdate"
                  checked={config?.force_update}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, force_update: e.target.checked }) : null)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="forceUpdate" className="text-sm font-medium text-gray-700">Atualização Obrigatória (Bloqueante)</label>
              </div>
            </div>
          </div>

          {/* Warning Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:col-span-2">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Aviso no App</h2>
                  <p className="text-sm text-gray-500">Exibir mensagem de alerta não-bloqueante</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config?.show_warning || false}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, show_warning: e.target.checked }) : null)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem de Aviso</label>
                <textarea 
                  value={config?.warning_message || ''}
                  onChange={(e) => setConfig(prev => prev ? ({ ...prev, warning_message: e.target.value }) : null)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                  placeholder="Ex: O sistema passará por manutenção às 22h."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </main>
    </div>
  );
};
