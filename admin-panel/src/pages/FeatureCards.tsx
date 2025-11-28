import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Star, Plus, Edit2, Trash2, Power, PowerOff, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureCard {
  _id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  backgroundColor: string;
  textColor?: string;
  enabled: boolean;
  order: number;
  action: {
    type: 'navigate' | 'modal' | 'external';
    target: string;
    params?: any;
  };
}

const API_URL = 'https://ecogastos-production.up.railway.app';

const ICON_OPTIONS = [
  { value: 'star-outline', label: '⭐ Star' },
  { value: 'target-outline', label: '🎯 Target' },
  { value: 'trending-up-outline', label: '📈 Trending Up' },
  { value: 'bulb-outline', label: '💡 Bulb' },
  { value: 'gift-outline', label: '🎁 Gift' },
  { value: 'rocket-outline', label: '🚀 Rocket' },
  { value: 'heart-outline', label: '❤️ Heart' },
  { value: 'trophy-outline', label: '🏆 Trophy' },
  { value: 'wallet-outline', label: '👛 Wallet' },
  { value: 'card-outline', label: '💳 Card' },
];

export const FeatureCards = () => {
  const { user, logout } = useAuth();
  const [cards, setCards] = useState<FeatureCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<FeatureCard | null>(null);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'star-outline',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    textColor: '#1F2937',
    enabled: true,
    order: 0,
    actionType: 'navigate' as 'navigate' | 'modal' | 'external',
    actionTarget: '',
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/feature-cards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Failed to load cards', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('admin_token');
    const cardData = {
      title: formData.title,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      enabled: formData.enabled,
      order: formData.order,
      action: {
        type: formData.actionType,
        target: formData.actionTarget,
      }
    };

    try {
      const url = editingCard 
        ? `${API_URL}/admin/feature-cards/${editingCard._id}`
        : `${API_URL}/admin/feature-cards`;
      
      const method = editingCard ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cardData)
      });

      if (response.ok) {
        setMessage('Card salvo com sucesso!');
        setTimeout(() => setMessage(''), 3000);
        closeModal();
        loadCards();
      }
    } catch (error) {
      console.error('Failed to save card', error);
      setMessage('Erro ao salvar card');
    }
  };

  const handleEdit = (card: FeatureCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description,
      icon: card.icon,
      color: card.color,
      backgroundColor: card.backgroundColor,
      textColor: card.textColor || '#1F2937',
      enabled: card.enabled,
      order: card.order,
      actionType: card.action.type,
      actionTarget: card.action.target,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este card?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/feature-cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('Card deletado com sucesso!');
        setTimeout(() => setMessage(''), 3000);
        loadCards();
      }
    } catch (error) {
      console.error('Failed to delete card', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/feature-cards/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadCards();
      }
    } catch (error) {
      console.error('Failed to toggle card', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCard(null);
    setFormData({
      title: '',
      description: '',
      icon: 'star-outline',
      color: '#6366F1',
      backgroundColor: '#EEF2FF',
      textColor: '#1F2937',
      enabled: true,
      order: 0,
      actionType: 'navigate',
      actionTarget: '',
    });
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
            <div className="bg-purple-100 p-2 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Feature Cards</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Configurações</span>
            </Link>
            <Link 
              to="/users"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg"
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Usuários</span>
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

        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">Gerencie os cards promocionais exibidos no app</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Card</span>
          </button>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {cards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum card criado</h3>
              <p className="text-gray-500 mb-4">Clique em "Novo Card" para criar seu primeiro feature card</p>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: card.backgroundColor, color: card.color }}
                    >
                      {ICON_OPTIONS.find(i => i.value === card.icon)?.label.split(' ')[0] || '⭐'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold" style={{ color: card.textColor || '#1F2937' }}>{card.title}</h3>
                      <p className="text-sm" style={{ color: card.textColor ? `${card.textColor}CC` : '#6B7280' }}>{card.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                        <span>Ordem: {card.order}</span>
                        <span>•</span>
                        <span>Ação: {card.action.type} → {card.action.target}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${card.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {card.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      onClick={() => handleToggle(card._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={card.enabled ? 'Desativar' : 'Ativar'}
                    >
                      {card.enabled ? <Power className="h-5 w-5 text-green-600" /> : <PowerOff className="h-5 w-5 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-5 w-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(card._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCard ? 'Editar Card' : 'Novo Card'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ex: Configure suas Metas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ex: Defina metas de economia mensal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ícone *</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {ICON_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordem</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Fundo</label>
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto</label>
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ação *</label>
                  <select
                    value={formData.actionType}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="navigate">Navegar para Tela</option>
                    <option value="modal">Abrir Modal</option>
                    <option value="external">Link Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target *</label>
                  <input
                    type="text"
                    required
                    value={formData.actionTarget}
                    onChange={(e) => setFormData({ ...formData, actionTarget: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Ex: Goals ou https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">Card Ativo</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
