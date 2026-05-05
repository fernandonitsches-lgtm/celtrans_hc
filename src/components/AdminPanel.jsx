import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, AlertCircle, CheckCircle, Loader, UserCog, Briefcase, TrendingDown } from 'lucide-react';
import CadastroFuncionarios from './CadastroFuncionarios';
import RankingFaltas from './RankingFaltas';

const AdminPanel = () => {
  const [abaAtiva, setAbaAtiva] = useState('usuarios'); // 'usuarios' ou 'funcionarios'
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });

  // Carregar usuários ao montar
  useEffect(() => {
    if (abaAtiva === 'usuarios') {
      fetchUsuarios();
    }
  }, [abaAtiva]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      // Nota: Esta é uma operação limitada sem service role key
      // Para um painel completo, seria ideal usar um backend
      setUsuarios([]);
    } catch (err) {
      setError('Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.senha) {
      setError('Email e senha são obrigatórios');
      return;
    }

    try {
      setLoading(true);

      // Criar usuário na autenticação Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });

      if (authError) {
        setError('Erro ao criar usuário: ' + authError.message);
        return;
      }

      setSuccess(`Usuário ${formData.email} cadastrado com sucesso!`);
      setFormData({ email: '', senha: '' });

      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-slate-800">Painel de Administração</h1>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setAbaAtiva('usuarios')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                abaAtiva === 'usuarios'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-5 h-5" />
              Cadastro de Usuários
            </button>
            <button
              onClick={() => setAbaAtiva('funcionarios')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                abaAtiva === 'funcionarios'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Gestão de Funcionários
            </button>
            <button
              onClick={() => setAbaAtiva('ranking')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                abaAtiva === 'ranking'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              Ranking de Faltas
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba Usuários */}
        {abaAtiva === 'usuarios' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Cadastrar Novo Usuário
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleCadastro} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@email.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    minLength="6"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Cadastrar Usuário
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">💡 Dica:</span> Para deletar ou gerenciar usuários, acesse diretamente o painel de autenticação do Supabase.
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba Pessoas */}
        {abaAtiva === 'funcionarios' && (
          <CadastroFuncionarios />
        )}

        {/* Conteúdo da Aba Ranking */}
        {abaAtiva === 'ranking' && (
          <RankingFaltas />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
