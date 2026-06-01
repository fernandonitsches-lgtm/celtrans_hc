import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, AlertCircle, CheckCircle, Loader,
  Shield, Mail, Lock, Eye, EyeOff, Building2,
  Trash2, RefreshCw, UserCheck, X
} from 'lucide-react';

const AdminPanel = () => {
  // ── Cadastro de usuário ──
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [formData, setFormData]   = useState({ email: '', senha: '' });

  // ── Gestão de CDs ──
  const [aba, setAba]               = useState('usuarios'); // 'usuarios' | 'cds'
  const [usuarios, setUsuarios]     = useState([]);
  const [userCds, setUserCds]       = useState([]);
  const [cdsDisponiveis, setCdsDisponiveis] = useState([]);
  const [loadingCds, setLoadingCds] = useState(false);
  const [errorCds, setErrorCds]     = useState('');
  const [successCds, setSuccessCds] = useState('');
  const [novoVinculo, setNovoVinculo] = useState({ user_id: '', cd: '' });
  const [cdCustom, setCdCustom]     = useState(false);
  const [cdNovo, setCdNovo]         = useState('');

  // ── Carrega usuários e vínculos ao abrir aba CDs ──
  useEffect(() => {
    if (aba === 'cds') {
      fetchCdsData();
    }
  }, [aba]);

  const fetchCdsData = async () => {
    setLoadingCds(true);
    setErrorCds('');
    try {
      // Busca usuários auth via listUsers (admin only via service role)
      // Como não temos service role no front, buscamos user_cds e pessoas para os CDs
      const [{ data: vinculosData, error: vErr }, { data: pessoasData, error: pErr }] = await Promise.all([
        supabase.from('user_cds').select('*').order('created_at', { ascending: false }),
        supabase.from('pessoas').select('cd').not('cd', 'is', null),
      ]);

      if (vErr) throw vErr;
      if (pErr) throw pErr;

      setUserCds(vinculosData || []);

      // CDs únicos das pessoas cadastradas
      const cdsUnicos = [...new Set((pessoasData || []).map(p => p.cd).filter(Boolean))].sort();
      setCdsDisponiveis(cdsUnicos);
    } catch (err) {
      setErrorCds('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoadingCds(false);
    }
  };

  const handleAdicionarVinculo = async () => {
    const cdFinal = cdCustom ? cdNovo.trim() : novoVinculo.cd;
    if (!novoVinculo.user_id.trim()) { setErrorCds('Informe o UUID do usuário'); return; }
    if (!cdFinal) { setErrorCds('Selecione ou digite o CD'); return; }

    setLoadingCds(true);
    setErrorCds('');
    try {
      // Upsert — se já existe para esse user_id, atualiza
      const { error } = await supabase
        .from('user_cds')
        .upsert({ user_id: novoVinculo.user_id.trim(), cd: cdFinal }, { onConflict: 'user_id' });

      if (error) throw error;

      setSuccessCds(`CD "${cdFinal}" vinculado com sucesso!`);
      setTimeout(() => setSuccessCds(''), 3000);
      setNovoVinculo({ user_id: '', cd: '' });
      setCdNovo('');
      setCdCustom(false);
      await fetchCdsData();
    } catch (err) {
      setErrorCds('Erro ao vincular: ' + err.message);
    } finally {
      setLoadingCds(false);
    }
  };

  const handleRemoverVinculo = async (id, userId) => {
    if (!confirm('Remover restrição de CD deste usuário? Ele passará a ver todos os CDs.')) return;
    setLoadingCds(true);
    try {
      const { error } = await supabase.from('user_cds').delete().eq('id', id);
      if (error) throw error;
      setSuccessCds('Restrição removida. Usuário agora vê todos os CDs.');
      setTimeout(() => setSuccessCds(''), 3000);
      await fetchCdsData();
    } catch (err) {
      setErrorCds('Erro ao remover: ' + err.message);
    } finally {
      setLoadingCds(false);
    }
  };

  // ── Cadastro de usuário ──
  const handleCadastro = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.email || !formData.senha) { setError('Email e senha são obrigatórios'); return; }
    if (formData.senha.length < 6) { setError('A senha deve ter no mínimo 6 caracteres'); return; }
    try {
      setLoading(true);
      const { error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.senha });
      if (authError) { setError('Erro ao criar usuário: ' + authError.message); return; }
      setSuccess(`Usuário ${formData.email} cadastrado! Copie o UUID em Authentication → Users para vincular um CD.`);
      setFormData({ email: '', senha: '' });
      setTimeout(() => setSuccess(''), 8000);
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Painel de Administração</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gerencie acessos e restrições de CD</p>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex border-b border-slate-100">
            {[
              { id: 'usuarios', label: 'Cadastrar Usuário', icon: <Users className="w-4 h-4" /> },
              { id: 'cds', label: 'Restrição por CD', icon: <Building2 className="w-4 h-4" /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setAba(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 font-semibold transition text-sm ${
                  aba === tab.id ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-700'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ABA: Cadastrar Usuário ── */}
        {aba === 'usuarios' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-purple-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Cadastrar Novo Usuário</h2>
                  <p className="text-purple-200 text-xs mt-0.5">O usuário receberá acesso ao sistema após o cadastro</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-semibold text-sm">Erro ao cadastrar</p>
                    <p className="text-red-600 text-xs mt-0.5">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-700 font-semibold text-sm">Usuário cadastrado!</p>
                    <p className="text-green-600 text-xs mt-0.5">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCadastro} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email do usuário *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@empresa.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 text-sm" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha de acesso *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showSenha ? 'text' : 'password'} value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 text-sm"
                      required minLength="6" />
                    <button type="button" onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.senha && formData.senha.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
                  )}
                </div>

                {formData.senha && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          formData.senha.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                            : 'bg-slate-100'
                        }`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formData.senha.length < 6 ? 'Muito curta' : formData.senha.length < 9 ? 'Fraca' : formData.senha.length < 12 ? 'Média' : 'Forte'}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading || !formData.email || formData.senha.length < 6}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                  {loading ? <><Loader className="w-4 h-4 animate-spin" /> Cadastrando...</> : <><Users className="w-4 h-4" /> Cadastrar Usuário</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ABA: Restrição por CD ── */}
        {aba === 'cds' && (
          <div className="space-y-4">

            {/* Mensagens */}
            {errorCds && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm flex-1">{errorCds}</p>
                <button onClick={() => setErrorCds('')}><X className="w-4 h-4 text-red-400" /></button>
              </div>
            )}
            {successCds && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700 text-sm">{successCds}</p>
              </div>
            )}

            {/* Explicação */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Como funciona</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Ao vincular um CD a um usuário, ele verá <strong>apenas</strong> as pessoas, faltas e dados daquele CD.
                  Usuários sem vínculo veem tudo. Admins sempre veem tudo.
                </p>
              </div>
            </div>

            {/* Formulário de novo vínculo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Vincular usuário a um CD</h2>
                  <p className="text-blue-200 text-xs mt-0.5">O UUID do usuário está em Authentication → Users no Supabase</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">UUID do usuário *</label>
                  <input
                    type="text"
                    value={novoVinculo.user_id}
                    onChange={(e) => setNovoVinculo({ ...novoVinculo, user_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-sm font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1">Copie o ID do usuário direto do painel do Supabase</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">CD *</label>
                  {!cdCustom ? (
                    <div className="flex gap-2">
                      <select value={novoVinculo.cd}
                        onChange={(e) => setNovoVinculo({ ...novoVinculo, cd: e.target.value })}
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-sm">
                        <option value="">Selecione o CD...</option>
                        {cdsDisponiveis.map(cd => <option key={cd} value={cd}>{cd}</option>)}
                      </select>
                      <button type="button" onClick={() => { setCdCustom(true); setNovoVinculo({ ...novoVinculo, cd: '' }); }}
                        className="px-3 py-2 bg-blue-50 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-100 transition text-xs font-medium whitespace-nowrap">
                        + Digitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={cdNovo} onChange={(e) => setCdNovo(e.target.value)}
                        placeholder="Nome do CD..."
                        className="flex-1 px-3 py-2.5 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" autoFocus />
                      <button type="button" onClick={() => { setCdCustom(false); setCdNovo(''); }}
                        className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 transition text-xs font-medium">
                        ← Lista
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={handleAdicionarVinculo}
                  disabled={loadingCds || !novoVinculo.user_id.trim() || (!novoVinculo.cd && !cdNovo.trim())}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                  {loadingCds ? <Loader className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Vincular CD ao usuário
                </button>
              </div>
            </div>

            {/* Lista de vínculos existentes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-700 text-sm">Vínculos ativos</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{userCds.length} usuário(s) com CD restrito</p>
                </div>
                <button onClick={fetchCdsData} disabled={loadingCds}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition">
                  <RefreshCw className={`w-4 h-4 ${loadingCds ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingCds ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
              ) : userCds.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">Nenhum vínculo cadastrado</p>
                  <p className="text-slate-300 text-xs mt-1">Todos os usuários veem todos os CDs</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {userCds.map(vinculo => (
                    <div key={vinculo.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-slate-400 truncate">{vinculo.user_id}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              <Building2 className="w-2.5 h-2.5" /> {vinculo.cd}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleRemoverVinculo(vinculo.id, vinculo.user_id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition flex-shrink-0 ml-3">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info de permissões — sempre visível */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Níveis de acesso</h3>
          <div className="space-y-3">
            {[
              { role: 'Administrador', desc: 'Acesso completo a todos os CDs, gestão de funcionários e usuários', color: 'bg-purple-100 text-purple-700' },
              { role: 'Usuário com CD', desc: 'Vê apenas pessoas, faltas e dados do CD vinculado', color: 'bg-blue-100 text-blue-700' },
              { role: 'Usuário padrão', desc: 'Sem restrição de CD — vê todas as operações', color: 'bg-green-100 text-green-700' },
            ].map(item => (
              <div key={item.role} className="flex items-start gap-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5 ${item.color}`}>
                  {item.role}
                </span>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;