import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Loader, Search, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

const CadastroFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    cargo: '',
    area: '',
    setor: '',
    operacao: '',
  });

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (err) {
      setError('Erro ao carregar funcionários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.cargo || !formData.setor || !formData.operacao) {
      setError('Preencha todos os campos obrigatórios (nome, cargo, setor e operação)');
      return;
    }

    try {
      setLoading(true);

      if (editando && funcionarioSelecionado) {
        // Atualizar funcionário existente
        const { error } = await supabase
          .from('pessoas')
          .update(formData)
          .eq('id', funcionarioSelecionado.id);

        if (error) throw error;
        setSuccess('Funcionário atualizado com sucesso!');
      } else {
        // Criar novo funcionário
        const { error } = await supabase
          .from('pessoas')
          .insert([formData]);

        if (error) throw error;
        setSuccess('Funcionário cadastrado com sucesso!');
      }

      fetchFuncionarios();
      handleCloseModal();
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?\n\nIsso também excluirá todos os registros de atribuições e faltas associados a este funcionário.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('pessoas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Funcionário excluído com sucesso!');
      fetchFuncionarios();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setFormData({
      name: funcionario.name,
      cargo: funcionario.cargo,
      area: funcionario.area || '',
      setor: funcionario.setor,
      operacao: funcionario.operacao,
    });
    setEditando(true);
    setModalAberto(true);
  };

  const handleNovo = () => {
    setFuncionarioSelecionado(null);
    setFormData({
      name: '',
      cargo: '',
      area: '',
      setor: '',
      operacao: '',
    });
    setEditando(false);
    setModalAberto(true);
  };

  const handleCloseModal = () => {
    setModalAberto(false);
    setFuncionarioSelecionado(null);
    setEditando(false);
    setFormData({
      name: '',
      cargo: '',
      area: '',
      setor: '',
      operacao: '',
    });
  };

  const filteredFuncionarios = funcionarios.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.operacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.area && f.area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && funcionarios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Users className="w-12 h-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-slate-600 text-lg">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Funcionários</h2>
        </div>
        <button
          onClick={handleNovo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Novo Funcionário
        </button>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 flex-1">{success}</p>
          <button onClick={() => setSuccess('')}>
            <X className="w-5 h-5 text-green-600" />
          </button>
        </div>
      )}

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo, setor, operação ou área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Área</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Setor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Operação</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFuncionarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                  </td>
                </tr>
              ) : (
                filteredFuncionarios.map(funcionario => (
                  <tr key={funcionario.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{funcionario.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.cargo}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.area || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.setor}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.operacao}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(funcionario)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(funcionario.id, funcionario.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="text-sm text-slate-600">
        Total: <span className="font-semibold">{filteredFuncionarios.length}</span> funcionário(s)
        {searchTerm && ` (filtrado de ${funcionarios.length})`}
      </div>

      {/* Modal Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editando ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <button onClick={handleCloseModal} className="text-white hover:bg-blue-800 p-1 rounded transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Silva"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Operador de Produção"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Área
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Ex: Produção"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Setor *
                  </label>
                  <input
                    type="text"
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    placeholder="Ex: Montagem"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Operação *
                  </label>
                  <input
                    type="text"
                    value={formData.operacao}
                    onChange={(e) => setFormData({ ...formData, operacao: e.target.value })}
                    placeholder="Ex: Turno 1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ℹ️ Dica:</span> Campos marcados com * são obrigatórios.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-slate-300 text-slate-800 rounded-lg font-semibold hover:bg-slate-400 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {editando ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroFuncionarios;
