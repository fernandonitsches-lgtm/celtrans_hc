import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, AlertCircle, CheckCircle, Loader,
  Shield, Mail, Lock, Eye, EyeOff, Building2,
  Trash2, RefreshCw, UserCheck, X
} from 'lucide-react';

const AdminPanel = () => {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [formData, setFormData]   = useState({ email: '', senha: '' });

  const [aba, setAba]               = useState('usuarios');
  const [userCds, setUserCds]       = useState([]);
  const [cdsDisponiveis, setCdsDisponiveis] = useState([]);
  const [loadingCds, setLoadingCds] = useState(false);
  const [errorCds, setErrorCds]     = useState('');
  const [successCds, setSuccessCds] = useState('');
  const [novoVinculo, setNovoVinculo] = useState({ user_id: '', cd: '' });
  const [cdCustom, setCdCustom]     = useState(false);
  const [cdNovo, setCdNovo]         = useState('');

  useEffect(() => {
    if (aba === 'cds') fetchCdsData();
  }, [aba]);

  const fetchCdsData = async () => {
    setLoadingCds(true);
    setErrorCds('');
    try {
      const { data: pessoasData, error: pErr } = await supabase
        .from('pessoas').select('cd').not('cd', 'is', null);
      if (pErr) throw pErr;

      const cdsUnicos = [...new Set((pessoasData || []).map(p => p.cd).filter(Boolean))].sort();
      setCdsDisponiveis(cdsUnicos);

      // Busca vínculos da tabela user_cds para exibir lista
      const { data: vinculosData } = await supabase
        .from('user_cds').select('*').order('created_at', { ascending: false });
      setUserCds(vinculosData || []);
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
      // 1. Salva no metadata do usuário (usado pelo useAuth para filtrar)
      const { error: metaError } = await supabase.auth.admin.updateUserById(
        novoVinculo.user_id.trim(),
        { user_metadata: { cd: cdFinal } }
      );

      // Se não tiver permissão de admin no frontend, usa RPC
      if (metaError) {
        // Fallback: salva na tabela user_cds (método antigo)
        const { error: upsertError } = await supabase
          .from('user_cds')
          .upsert({ user_id: novoVinculo.user_id.trim(), cd: cdFinal }, { onConflict: 'user_id' });
        if (upsertError) throw upsertError;
      }

      // 2. Sempre salva na tabela user_cds para manter histórico/lista
      await supabase
        .from('user_cds')
        .upsert({ user_id: novoVinculo.user_id.trim(), cd: cdFinal }, { onConflict: 'user_id' });

      setSuccessCds(`✓ CD "${cdFinal}" vinculado! O usuário precisa fazer logout e login para aplicar.`);
      setTimeout(() => setSuccessCds(''), 5000);
      setNovoVinculo({ user_id: '', cd: '' });
      setCdNovo(''); setCdCustom(false);
      await fetchCdsData();
    } catch (err) {
      setErrorCds('Erro ao vincular: ' + err.message);
    } finally {
      setLoadingCds(false);
    }
  };

  const handleRemoverVinculo = async (id, userId) => {
    if (!confirm('Remover restrição de CD? O usuário passará a ver todos os CDs.')) return;
    setLoadingCds(true);
    try {
      // Remove metadata do usuário
      const { error: metaError } = await supabase.auth.admin.updateUserById(
        userId, { user_metadata: { cd: null } }
      );

      // Remove da tabela user_cds
      await supabase.from('user_cds').delete().eq('id', id);

      setSuccessCds('Restrição removida. Usuário agora vê todos os CDs.');
      setTimeout(() => setSuccessCds(''), 3000);
      await fetchCdsData();
    } catch (err) {
      setErrorCds('Erro ao remover: ' + err.message);
    } finally {
      setLoadingCds(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.email || !formData.senha) { setError('Email e senha são obrigatórios'); return; }
    if (formData.senha.length < 6) { setError('A senha deve ter no mínimo 6 caracteres'); return; }
    try {
      setLoading(true);
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });
      if (authError) { setError('Erro ao criar usuário: ' + authError.message); return; }
      setSuccess(`Usuário ${formData.email} cadastrado! Vá em "Restrição por CD" para vincular o CD dele.`);
      setFormData({ email: '', senha: '' });
      setTimeout(() => setSuccess(''), 8000);
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cadastro com CD já na criação ──
  const handleCadastroComCd = async (e) => {
    e.preventDefault();
    // Usa a aba de CDs após cadastro
    handleCadastro(e);
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
                  <p className="text-purple-200 text-xs mt-0.5">Após cadastrar, vá em "Restrição por CD" para definir o acesso</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm flex-1">{error}</p>
                  <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400" /></button>
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 text-sm flex-1">{success}</p>
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
                </div>

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

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Como vincular</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  1. Cadastre o usuário na aba anterior<br/>
                  2. Copie o UUID dele em <strong>Supabase → Authentication → Users</strong><br/>
                  3. Cole aqui e selecione o CD<br/>
                  4. O usuário precisa fazer <strong>logout e login</strong> para aplicar
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-white" />
                <h2 className="text-sm font-bold text-white">Vincular usuário a um CD</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">UUID do usuário *</label>
                  <input type="text" value={novoVinculo.user_id}
                    onChange={(e) => setNovoVinculo({ ...novoVinculo, user_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-sm font-mono" />
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
                        placeholder="Ex: MG, DF, SP..."
                        className="flex-1 px-3 py-2.5 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" autoFocus />
                      <button type="button" onClick={() => { setCdCustom(false); setCdNovo(''); }}
                        className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium">
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

            {/* Lista de vínculos */}
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
                </div>
              ) : userCds.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Nenhum vínculo cadastrado</p>
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mt-0.5">
                            <Building2 className="w-2.5 h-2.5" /> {vinculo.cd}
                          </span>
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

        {/* Níveis de acesso */}
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