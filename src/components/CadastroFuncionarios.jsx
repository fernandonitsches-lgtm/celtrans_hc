import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Loader, Search, X, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Responsabilidade única: buscar próximo ID disponível ──
const getNextId = async () => {
  const { data, error } = await supabase
    .from('pessoas')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0].id + 1 : 1;
};

// ── Responsabilidade única: operações CRUD no banco ──
const pessoasService = {
  fetchAll: async () => {
    const { data, error } = await supabase
      .from('pessoas')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  insert: async (formData) => {
    const nextId = await getNextId();
    const novoFuncionario = {
      id: nextId,
      name: formData.name,
      cargo: formData.cargo,
      area: formData.area || '',
      setor: formData.setor,
      operacao: formData.operacao,
      de_ferias: formData.de_ferias || false,
      em_recrutamento: false,
    };
    const { data, error } = await supabase
      .from('pessoas')
      .insert([novoFuncionario])
      .select();
    if (error) throw error;
    return data;
  },

  update: async (id, formData) => {
    const { error } = await supabase
      .from('pessoas')
      .update(formData)
      .eq('id', id);
    if (error) throw error;
  },

  deleteById: async (id) => {
    const { error } = await supabase
      .from('pessoas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  demitir: async (id, nome) => {
    const { error } = await supabase
      .from('pessoas')
      .update({
        nome_anterior: nome,
        name: 'VAGA EM RECRUTAMENTO',
        de_ferias: false,
        em_recrutamento: true,
      })
      .eq('id', id);
    if (error) throw error;
  },

  removerVagasPorNome: async (nome) => {
    const { data } = await supabase
      .from('pessoas')
      .select('id')
      .eq('em_recrutamento', true)
      .eq('nome_anterior', nome);
    if (data && data.length > 0) {
      for (const vaga of data) {
        await supabase.from('pessoas').delete().eq('id', vaga.id);
      }
    }
    return data?.length || 0;
  },

  removerVagaPorSetorOperacao: async (setor, operacao) => {
    const { data } = await supabase
      .from('pessoas')
      .select('id')
      .eq('em_recrutamento', true)
      .eq('setor', setor)
      .eq('operacao', operacao)
      .limit(1);
    if (data && data.length > 0) {
      await supabase.from('pessoas').delete().eq('id', data[0].id);
    }
    return data?.length || 0;
  },
};

// ── Responsabilidade única: estado inicial do form ──
const formInicial = {
  name: '',
  cargo: '',
  area: '',
  setor: '',
  operacao: '',
  de_ferias: false,
  em_recrutamento: false,
};

const CadastroFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarVagas, setMostrarVagas] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [formData, setFormData] = useState(formInicial);
  const [modoRecrutamento, setModoRecrutamento] = useState(false);
  const [setorCustom, setSetorCustom] = useState(false);

  // ── Opções derivadas do banco ──
  const opcoesOperacao = [...new Set(funcionarios.map(f => f.operacao).filter(Boolean))].sort();
  const opcoesCargo = [...new Set(funcionarios.map(f => f.cargo).filter(Boolean))].sort();
  const opcoesSetor = [...new Set(
    funcionarios
      .filter(f => !formData.operacao || f.operacao === formData.operacao)
      .map(f => f.setor)
      .filter(Boolean)
  )].sort();
  const opcoesArea = [...new Set(
    funcionarios
      .filter(f => !formData.operacao || f.operacao === formData.operacao)
      .map(f => f.area)
      .filter(Boolean)
  )].sort();

  useEffect(() => {
    carregarFuncionarios();

    const subscription = supabase
      .channel('pessoas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pessoas' }, carregarFuncionarios)
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await pessoasService.fetchAll();
      setFuncionarios(data);
    } catch (err) {
      setError('Erro ao carregar funcionários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exibirSucesso = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
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
        await pessoasService.update(funcionarioSelecionado.id, formData);
        exibirSucesso('Funcionário atualizado com sucesso!');
      } else {
        await pessoasService.insert(formData);

        // Remover vagas correspondentes
        const removidosPorNome = await pessoasService.removerVagasPorNome(formData.name);
        const removidosPorSetor = await pessoasService.removerVagaPorSetorOperacao(formData.setor, formData.operacao);
        const vagasRemovidas = removidosPorNome + removidosPorSetor;

        exibirSucesso('Funcionário cadastrado com sucesso!' + (vagasRemovidas > 0 ? ' Vaga(s) removida(s).' : ''));
      }

      await carregarFuncionarios();
      handleCloseModal();
    } catch (err) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nome) => {
    const isVaga = nome === 'VAGA EM RECRUTAMENTO';
    const mensagem = isVaga
      ? 'Tem certeza que deseja excluir esta vaga em recrutamento?'
      : `Tem certeza que deseja demitir "${nome}"?\n\nO registro vira uma vaga em recrutamento automaticamente.`;

    if (!confirm(mensagem)) return;

    try {
      setLoading(true);
      if (isVaga) {
        await pessoasService.deleteById(id);
        exibirSucesso('Vaga em recrutamento removida!');
      } else {
        await pessoasService.demitir(id, nome);
        exibirSucesso('Funcionário demitido e vaga aberta em recrutamento!');
      }
      await carregarFuncionarios();
    } catch (err) {
      setError('Erro ao deletar: ' + err.message);
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
      de_ferias: funcionario.de_ferias || false,
      em_recrutamento: false,
    });
    setEditando(true);
    setModalAberto(true);
  };

  const handleNovo = () => {
    setFuncionarioSelecionado(null);
    setModoRecrutamento(false);
    setFormData(formInicial);
    setEditando(false);
    setModalAberto(true);
  };

  const handleNovaVaga = () => {
    setFuncionarioSelecionado(null);
    setModoRecrutamento(true);
    setFormData({ ...formInicial, name: 'VAGA EM RECRUTAMENTO', em_recrutamento: true });
    setEditando(false);
    setModalAberto(true);
  };

  const handleCloseModal = () => {
    setModalAberto(false);
    setFuncionarioSelecionado(null);
    setEditando(false);
    setModoRecrutamento(false);
    setSetorCustom(false);
    setFormData(formInicial);
  };

  const filteredFuncionarios = funcionarios.filter(f => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.operacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.area && f.area.toLowerCase().includes(searchTerm.toLowerCase()));
    return mostrarVagas ? f.em_recrutamento && matchesSearch : !f.em_recrutamento && matchesSearch;
  });

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
        <div className="flex gap-2">
          <button onClick={handleNovaVaga} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Plus className="w-5 h-5" />
            Vaga em Recrutamento
          </button>
          <button onClick={handleNovo} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-5 h-5" />
            Novo Funcionário
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')}><X className="w-5 h-5 text-red-600" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 flex-1">{success}</p>
          <button onClick={() => setSuccess('')}><X className="w-5 h-5 text-green-600" /></button>
        </div>
      )}

      {/* Busca e Filtro */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo, setor, operação ou área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setMostrarVagas(!mostrarVagas)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              mostrarVagas ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            {mostrarVagas ? 'Vagas' : 'Funcionários'}
          </button>
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
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFuncionarios.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                  </td>
                </tr>
              ) : (
                filteredFuncionarios.map(funcionario => (
                  <tr key={funcionario.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {funcionario.em_recrutamento
                        ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Vaga em Recrutamento</span>
                        : funcionario.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.cargo}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.area || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.setor}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{funcionario.operacao}</td>
                    <td className="px-4 py-3 text-center">
                      {funcionario.de_ferias ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Férias</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Ativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(funcionario)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(funcionario.id, funcionario.name)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Excluir">
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
        Total: <span className="font-semibold">{filteredFuncionarios.length}</span> {mostrarVagas ? 'vaga(s) em recrutamento' : 'funcionário(s)'}
        {searchTerm && ` (filtrado de ${funcionarios.filter(f => mostrarVagas ? f.em_recrutamento : !f.em_recrutamento).length})`}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {modoRecrutamento ? 'Nova Vaga em Recrutamento' : editando ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <button onClick={handleCloseModal} className="text-white hover:bg-blue-800 p-1 rounded transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {!modoRecrutamento && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo *</label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Selecione o cargo...</option>
                    {opcoesCargo.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Área</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione a área...</option>
                    {opcoesArea.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Setor *</label>
                  {!setorCustom ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.setor}
                        onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      >
                        <option value="">Selecione o setor...</option>
                        {opcoesSetor.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setSetorCustom(true); setFormData(f => ({ ...f, setor: '' })); }}
                        className="px-3 py-2 bg-blue-50 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium whitespace-nowrap"
                      >
                        + Novo
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.setor}
                        onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                        placeholder="Digite o nome do novo setor..."
                        className="flex-1 px-4 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => { setSetorCustom(false); setFormData(f => ({ ...f, setor: '' })); }}
                        className="px-3 py-2 bg-slate-100 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                      >
                        ← Lista
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Operação *</label>
                  <select
                    value={formData.operacao}
                    onChange={(e) => { setFormData({ ...formData, operacao: e.target.value, setor: '', area: '' }); setSetorCustom(false); }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Selecione a operação...</option>
                    {opcoesOperacao.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>

                {!modoRecrutamento && (
                  <div className="md:col-span-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.de_ferias}
                        onChange={(e) => setFormData({ ...formData, de_ferias: e.target.checked })}
                        className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-slate-800">Funcionário está de férias</span>
                        <p className="text-xs text-slate-600 mt-1">Quando marcado, o funcionário não aparecerá na atribuição diária</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800"><span className="font-semibold">Dica:</span> Campos marcados com * são obrigatórios.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 bg-slate-300 text-slate-800 rounded-lg font-semibold hover:bg-slate-400 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
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