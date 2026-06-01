import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Loader, Search, X, Filter, Building2 } from 'lucide-react';

const getNextId = async () => {
  const { data, error } = await supabase.from('pessoas').select('id').order('id', { ascending: false }).limit(1);
  if (error) throw new Error('Erro ao buscar próximo ID: ' + error.message);
  return data && data.length > 0 ? data[0].id + 1 : 1;
};

const pessoasService = {
  fetchAll: async () => {
    const { data, error } = await supabase.from('pessoas').select('*').order('name', { ascending: true });
    if (error) throw new Error('Erro ao buscar pessoas: ' + error.message);
    return data || [];
  },
  insert: async (formData) => {
    const nextId = await getNextId();
    const novoRegistro = {
      id: nextId,
      name: formData.name,
      cargo: formData.cargo,
      area: formData.area || '',
      setor: formData.setor,
      operacao: formData.operacao,
      cd: formData.cd || '',
      de_ferias: formData.de_ferias || false,
      em_recrutamento: formData.em_recrutamento || false,
    };
    const { data, error } = await supabase.from('pessoas').insert([novoRegistro]).select();
    if (error) throw new Error('Erro ao inserir: ' + error.message);
    return data;
  },
  update: async (id, formData) => {
    const { error } = await supabase.from('pessoas').update(formData).eq('id', id);
    if (error) throw new Error('Erro ao atualizar: ' + error.message);
  },
  deleteById: async (id) => {
    const { error } = await supabase.from('pessoas').delete().eq('id', id);
    if (error) throw new Error('Erro ao deletar: ' + error.message);
  },
  demitir: async (id, nome) => {
    const { error } = await supabase.from('pessoas')
      .update({ nome_anterior: nome, name: 'VAGA EM RECRUTAMENTO', de_ferias: false, em_recrutamento: true })
      .eq('id', id);
    if (error) throw new Error('Erro ao demitir: ' + error.message);
  },
  removerVagasPorNome: async (nome) => {
    const { data } = await supabase.from('pessoas').select('id').eq('em_recrutamento', true).eq('nome_anterior', nome);
    if (data && data.length > 0) {
      for (const vaga of data) await supabase.from('pessoas').delete().eq('id', vaga.id);
    }
    return data?.length || 0;
  },
  removerVagaPorSetorOperacao: async (setor, operacao) => {
    const { data } = await supabase.from('pessoas').select('id').eq('em_recrutamento', true).eq('setor', setor).eq('operacao', operacao).limit(1);
    if (data && data.length > 0) await supabase.from('pessoas').delete().eq('id', data[0].id);
    return data?.length || 0;
  },
};

const formInicial = { name: '', cargo: '', area: '', setor: '', operacao: '', cd: '', de_ferias: false, em_recrutamento: false };

const derivarOpcoes = (funcionarios, operacaoSelecionada) => ({
  operacao: [...new Set(funcionarios.map(f => f.operacao).filter(Boolean))].sort(),
  cargo:    [...new Set(funcionarios.map(f => f.cargo).filter(Boolean))].sort(),
  setor:    [...new Set(funcionarios.filter(f => !operacaoSelecionada || f.operacao === operacaoSelecionada).map(f => f.setor).filter(Boolean))].sort(),
  area:     [...new Set(funcionarios.filter(f => !operacaoSelecionada || f.operacao === operacaoSelecionada).map(f => f.area).filter(Boolean))].sort(),
  cd:       [...new Set(funcionarios.map(f => f.cd).filter(Boolean))].sort(),
});

const filtrarFuncionarios = (funcionarios, searchTerm, mostrarVagas, filterCd) =>
  funcionarios.filter(f => {
    const matchCd = filterCd === 'todos' || f.cd === filterCd;
    const match =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.operacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.area && f.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.cd && f.cd.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCd && (mostrarVagas ? f.em_recrutamento && match : !f.em_recrutamento && match);
  });

const CadastroFuncionarios = ({ userCd = 'todos' }) => {
  const [funcionarios, setFuncionarios]         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [success, setSuccess]                   = useState('');
  const [searchTerm, setSearchTerm]             = useState('');
  const [mostrarVagas, setMostrarVagas]         = useState(false);
  const [filterCd, setFilterCd]                 = useState(userCd);
  const cdBloqueado                             = userCd !== 'todos';
  const [modalAberto, setModalAberto]           = useState(false);
  const [editando, setEditando]                 = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [formData, setFormData]                 = useState(formInicial);
  const [modoRecrutamento, setModoRecrutamento] = useState(false);
  const [setorCustom, setSetorCustom]           = useState(false);
  const [cdCustom, setCdCustom]                 = useState(false);
  const [confirmarDelete, setConfirmarDelete]   = useState(null);

  const opcoes = derivarOpcoes(funcionarios, formData.operacao);
  const cdsUnicos = [...new Set(funcionarios.map(f => f.cd).filter(Boolean))].sort();
  const filteredFuncionarios = filtrarFuncionarios(funcionarios, searchTerm, mostrarVagas, filterCd);

  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await pessoasService.fetchAll();
        if (mounted) setFuncionarios(data);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    carregar();
    const subscription = supabase
      .channel('pessoas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pessoas' }, () => { if (mounted) carregar(); })
      .subscribe();
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await pessoasService.fetchAll();
      setFuncionarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exibirSucesso = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleCloseModal = () => {
    setModalAberto(false);
    setFuncionarioSelecionado(null);
    setEditando(false);
    setModoRecrutamento(false);
    setSetorCustom(false);
    setCdCustom(false);
    setFormData(formInicial);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!modoRecrutamento && !formData.name) { setError('Preencha o nome do funcionário'); return; }
    if (!formData.cargo || !formData.setor || !formData.operacao) { setError('Preencha todos os campos obrigatórios (cargo, setor e operação)'); return; }
    try {
      setLoading(true);
      if (editando && funcionarioSelecionado) {
        await pessoasService.update(funcionarioSelecionado.id, formData);
        exibirSucesso('Atualizado com sucesso!');
      } else if (modoRecrutamento) {
        await pessoasService.insert(formData);
        exibirSucesso('Vaga em recrutamento criada!');
        setMostrarVagas(true);
      } else {
        await pessoasService.insert(formData);
        const r1 = await pessoasService.removerVagasPorNome(formData.name);
        const r2 = await pessoasService.removerVagaPorSetorOperacao(formData.setor, formData.operacao);
        exibirSucesso('Funcionário cadastrado!' + (r1 + r2 > 0 ? ` ${r1 + r2} vaga(s) removida(s).` : ''));
      }
      await carregarFuncionarios();
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, nome) => setConfirmarDelete({ id, nome });

  const handleConfirmarDelete = async () => {
    const { id, nome } = confirmarDelete;
    setConfirmarDelete(null);
    const isVaga = nome === 'VAGA EM RECRUTAMENTO';
    try {
      setLoading(true);
      if (isVaga) { await pessoasService.deleteById(id); exibirSucesso('Vaga removida!'); }
      else { await pessoasService.demitir(id, nome); exibirSucesso('Funcionário demitido e vaga aberta!'); }
      await carregarFuncionarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setFormData({
      name: funcionario.name, cargo: funcionario.cargo, area: funcionario.area || '',
      setor: funcionario.setor, operacao: funcionario.operacao, cd: funcionario.cd || '',
      de_ferias: funcionario.de_ferias || false, em_recrutamento: funcionario.em_recrutamento || false,
    });
    setEditando(true);
    setModalAberto(true);
  };

  const handleNovo = () => {
    setFuncionarioSelecionado(null);
    setModoRecrutamento(false);
    // Pré-preenche CD se usuário for restrito
    setFormData({ ...formInicial, cd: cdBloqueado ? userCd : '' });
    setEditando(false);
    setModalAberto(true);
  };

  const handleNovaVaga = () => {
    setFuncionarioSelecionado(null);
    setModoRecrutamento(true);
    setFormData({ ...formInicial, name: 'VAGA EM RECRUTAMENTO', em_recrutamento: true, cd: cdBloqueado ? userCd : '' });
    setEditando(false);
    setModalAberto(true);
  };

  if (loading && funcionarios.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-800">Gestão de Funcionários</h2>
          {cdBloqueado && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              <Building2 className="w-3 h-3" /> {userCd}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleNovaVaga}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm font-semibold">
            <Plus className="w-4 h-4" /> Vaga em Recrutamento
          </button>
          <button onClick={handleNovo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold">
            <Plus className="w-4 h-4" /> Novo Funcionário
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 flex-1 text-sm">{error}</p>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 flex-1 text-sm">{success}</p>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4 text-green-400" /></button>
        </div>
      )}

      {/* Busca e Filtros */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por nome, cargo, setor, CD..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
          </div>
          {cdsUnicos.length > 0 && (
            <select
              value={filterCd}
              onChange={(e) => !cdBloqueado && setFilterCd(e.target.value)}
              disabled={cdBloqueado}
              className={`px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 ${cdBloqueado ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <option value="todos">Todos os CDs</option>
              {cdsUnicos.map(cd => <option key={cd} value={cd}>{cd}</option>)}
            </select>
          )}
          <button onClick={() => setMostrarVagas(!mostrarVagas)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${mostrarVagas ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <Filter className="w-4 h-4" />
            {mostrarVagas ? 'Vagas' : 'Funcionários'}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">CD</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Área</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Setor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Operação</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFuncionarios.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-slate-400 text-sm">
                    {searchTerm || filterCd !== 'todos' ? 'Nenhum registro encontrado' : mostrarVagas ? 'Nenhuma vaga em recrutamento' : 'Nenhum funcionário cadastrado'}
                  </td>
                </tr>
              ) : filteredFuncionarios.map(funcionario => (
                <tr key={funcionario.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {funcionario.em_recrutamento
                      ? <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Vaga em Recrutamento</span>
                      : funcionario.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{funcionario.cargo}</td>
                  <td className="px-4 py-3">
                    {funcionario.cd
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          <Building2 className="w-3 h-3" />{funcionario.cd}
                        </span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{funcionario.area || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{funcionario.setor}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{funcionario.operacao}</td>
                  <td className="px-4 py-3 text-center">
                    {funcionario.em_recrutamento
                      ? <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Recrutamento</span>
                      : funcionario.de_ferias
                        ? <span className="inline-flex px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Férias</span>
                        : funcionario.em_licenca
                          ? <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Licença</span>
                          : <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Ativo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(funcionario)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(funcionario.id, funcionario.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <p className="text-xs text-slate-400">
        Total: <span className="font-semibold text-slate-600">{filteredFuncionarios.length}</span> {mostrarVagas ? 'vaga(s)' : 'funcionário(s)'}
        {(searchTerm || filterCd !== 'todos') && ` (filtrado de ${funcionarios.filter(f => mostrarVagas ? f.em_recrutamento : !f.em_recrutamento).length})`}
      </p>

      {/* Modal Confirmar Delete */}
      {confirmarDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {confirmarDelete.nome === 'VAGA EM RECRUTAMENTO' ? 'Excluir vaga?' : 'Demitir funcionário?'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {confirmarDelete.nome === 'VAGA EM RECRUTAMENTO'
                ? 'Tem certeza que deseja excluir esta vaga?'
                : `Tem certeza que deseja demitir "${confirmarDelete.nome}"? O registro vira uma vaga em recrutamento.`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmarDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm">Cancelar</button>
              <button onClick={handleConfirmarDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`sticky top-0 p-5 flex items-center justify-between rounded-t-2xl ${modoRecrutamento ? 'bg-purple-600' : 'bg-blue-600'}`}>
              <h2 className="text-xl font-bold text-white">
                {modoRecrutamento ? 'Nova Vaga em Recrutamento' : editando ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <button onClick={handleCloseModal} className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {!modoRecrutamento && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome Completo *</label>
                    <input type="text" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                )}

                {modoRecrutamento && (
                  <div className="md:col-span-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-800"><span className="font-semibold">Nome:</span> VAGA EM RECRUTAMENTO (automático)</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cargo *</label>
                  <select value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" required>
                    <option value="">Selecione o cargo...</option>
                    {opcoes.cargo.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Área</label>
                  <select value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option value="">Selecione a área...</option>
                    {opcoes.area.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Operação *</label>
                  <select value={formData.operacao}
                    onChange={(e) => { setFormData({ ...formData, operacao: e.target.value, setor: '', area: '' }); setSetorCustom(false); }}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" required>
                    <option value="">Selecione a operação...</option>
                    {opcoes.operacao.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Setor *</label>
                  {!setorCustom ? (
                    <div className="flex gap-2">
                      <select value={formData.setor} onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" required>
                        <option value="">Selecione o setor...</option>
                        {opcoes.setor.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                      <button type="button" onClick={() => { setSetorCustom(true); setFormData(f => ({ ...f, setor: '' })); }}
                        className="px-3 py-2 bg-blue-50 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-100 transition text-xs font-medium whitespace-nowrap">
                        + Novo
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={formData.setor} onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                        placeholder="Nome do novo setor..."
                        className="flex-1 px-3 py-2.5 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required autoFocus />
                      <button type="button" onClick={() => { setSetorCustom(false); setFormData(f => ({ ...f, setor: '' })); }}
                        className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 transition text-xs font-medium">
                        ← Lista
                      </button>
                    </div>
                  )}
                </div>

                {/* Campo CD */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> CD (Centro de Distribuição)</span>
                  </label>
                  {cdBloqueado ? (
                    // Usuário restrito: CD fixo, não pode alterar
                    <div className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-600 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-blue-700">{userCd}</span>
                      <span className="text-slate-400 text-xs ml-1">(fixo para seu perfil)</span>
                    </div>
                  ) : !cdCustom ? (
                    <div className="flex gap-2">
                      <select value={formData.cd} onChange={(e) => setFormData({ ...formData, cd: e.target.value })}
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                        <option value="">Sem CD / Selecione...</option>
                        {opcoes.cd.map(cd => <option key={cd} value={cd}>{cd}</option>)}
                      </select>
                      <button type="button" onClick={() => { setCdCustom(true); setFormData(f => ({ ...f, cd: '' })); }}
                        className="px-3 py-2 bg-blue-50 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-100 transition text-xs font-medium whitespace-nowrap">
                        + Novo
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={formData.cd} onChange={(e) => setFormData({ ...formData, cd: e.target.value })}
                        placeholder="Nome do novo CD..."
                        className="flex-1 px-3 py-2.5 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" autoFocus />
                      <button type="button" onClick={() => { setCdCustom(false); setFormData(f => ({ ...f, cd: '' })); }}
                        className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 transition text-xs font-medium">
                        ← Lista
                      </button>
                    </div>
                  )}
                </div>

                {!modoRecrutamento && (
                  <div className="md:col-span-2 bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.de_ferias}
                        onChange={(e) => setFormData({ ...formData, de_ferias: e.target.checked })}
                        className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-2 focus:ring-orange-500" />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Funcionário está de férias</span>
                        <p className="text-xs text-slate-500 mt-0.5">Não aparecerá na atribuição diária</p>
                      </div>
                    </label>
                  </div>
                )}

                {!modoRecrutamento && editando && (
                  <div className="md:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.em_recrutamento}
                        onChange={(e) => setFormData({ ...formData, em_recrutamento: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-2 focus:ring-purple-500" />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Vaga em recrutamento</span>
                        <p className="text-xs text-slate-500 mt-0.5">Aparece como vaga aberta</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal}
                  className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className={`px-5 py-2 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2 text-sm ${modoRecrutamento ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {editando ? 'Atualizar' : modoRecrutamento ? 'Criar Vaga' : 'Cadastrar'}
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