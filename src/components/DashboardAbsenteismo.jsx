import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Calendar, Filter, Users, AlertCircle, RefreshCw, Building2, Plus, Trash2, X } from 'lucide-react';
import { MOTIVOS_AUSENCIA } from '../constants/motivos';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const CORES = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1'];

// Retorna array de datas úteis (seg-sex, excluindo feriados do CD)
const getDiasUteis = (ano, mes, feriados, cd) => {
  const feriadosSet = new Set(
    feriados
      .filter(f => !f.cd || f.cd === cd || cd === 'todos')
      .map(f => f.data)
  );
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias = [];
  for (let d = 1; d <= ultimoDia; d++) {
    const data = new Date(ano, mes - 1, d);
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;
    const dataStr = `${ano}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (feriadosSet.has(dataStr)) continue;
    dias.push(dataStr);
  }
  return dias;
};

// Dias úteis de uma semana específica dentro do mês
const getDiasUteisSemana = (diasUteisMes, semana) => {
  return diasUteisMes.filter(d => {
    const dia = parseInt(d.split('-')[2]);
    return Math.ceil(dia / 7) === semana;
  });
};

const DashboardAbsenteismo = ({ initialPeople = [], operacoes = [], cds = [], filterCdExterno = 'todos', userCd = 'todos' }) => {
  const [faltas, setFaltas]       = useState([]);
  const [faltasMes, setFaltasMes] = useState([]); // todas as faltas do mês sem filtro de período
  const [pessoas, setPessoas]     = useState([]);
  const [feriados, setFeriados]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [periodoTipo, setPeriodoTipo] = useState('mensal');
  const [mesAno, setMesAno]       = useState('');
  const [filterCd, setFilterCd]   = useState(filterCdExterno);
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [aba, setAba]             = useState('timeline');
  const [modalFeriados, setModalFeriados] = useState(false);
  const [novoFeriado, setNovoFeriado]     = useState({ data: '', descricao: '', cd: '' });
  const [savingFeriado, setSavingFeriado] = useState(false);

  const temRestricaoCd = userCd !== 'todos';

  useEffect(() => {
    const hoje = new Date();
    setMesAno(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => { setFilterCd(filterCdExterno); }, [filterCdExterno]);
  useEffect(() => { if (mesAno) fetchDados(); }, [mesAno, filterCd, filterOperacao]);

  const fetchDados = async () => {
    try {
      setLoading(true); setError('');
      const [ano, mes] = mesAno.split('-');
      const dataInicio = `${ano}-${mes}-01`;
      const ultimoDia  = new Date(ano, mes, 0).getDate();
      const dataFim    = `${ano}-${mes}-${ultimoDia}`;

      const [
        { data: faltasData,   error: fErr },
        { data: pessoasData,  error: pErr },
        { data: feriadosData, error: ferErr },
      ] = await Promise.all([
        supabase.from('faltas_diarias').select('*').gte('data', dataInicio).lte('data', dataFim).order('data', { ascending: true }),
        supabase.from('pessoas').select('*'),
        supabase.from('feriados').select('*').gte('data', dataInicio).lte('data', dataFim),
      ]);

      if (fErr) throw fErr;
      if (pErr) throw pErr;
      if (ferErr) throw ferErr;

      // Salva todas as faltas do mês para usar no cálculo mensal
      let todasFaltas = faltasData || [];
      todasFaltas = todasFaltas.filter(f => f.operacao !== 'SUPORTE');
      if (filterCd !== 'todos') todasFaltas = todasFaltas.filter(f => f.cd === filterCd);
      if (filterOperacao !== 'todas') todasFaltas = todasFaltas.filter(f => f.operacao === filterOperacao);
      setFaltasMes(todasFaltas);
      setFaltas(todasFaltas);
      setPessoas(pessoasData || []);
      setFeriados(feriadosData || []);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarFeriado = async () => {
    if (!novoFeriado.data || !novoFeriado.descricao.trim()) return;
    setSavingFeriado(true);
    try {
      const { error } = await supabase.from('feriados').insert({
        data: novoFeriado.data,
        descricao: novoFeriado.descricao.trim(),
        nacional: false,
        cd: novoFeriado.cd || null, // null = vale para todos
      });
      if (error) throw error;
      setNovoFeriado({ data: '', descricao: '', cd: '' });
      await fetchDados();
    } catch (err) {
      alert('Erro ao salvar feriado: ' + err.message);
    } finally {
      setSavingFeriado(false);
    }
  };

  const handleRemoverFeriado = async (id) => {
    if (!confirm('Remover este feriado?')) return;
    await supabase.from('feriados').delete().eq('id', id);
    await fetchDados();
  };

  // ── Dias úteis do mês filtrados por CD ──
  const [ano, mes] = mesAno ? mesAno.split('-').map(Number) : [0, 0];
  const diasUteisMes = mesAno ? getDiasUteis(ano, mes, feriados, filterCd) : [];
  const totalDiasUteisMes = diasUteisMes.length;

  // ── Hoje e semana atual ──
  const hoje = new Date().toISOString().split('T')[0];
  const semanaHoje = Math.ceil(new Date().getDate() / 7);
  const diasUteisSemanaAtual = getDiasUteisSemana(diasUteisMes, semanaHoje);
  const totalDiasUteisSemana = diasUteisSemanaAtual.length;

  // ── Colaboradores ativos (sem férias, licença, suporte, recrutamento, analista geral) ──
  const colaboradoresAtivos = (cd) => {
    return pessoas.filter(p => {
      if (p.de_ferias || p.em_licenca || p.em_recrutamento) return false;
      if (p.operacao === 'SUPORTE' || p.operacao === 'ANALISTA GERAL') return false;
      if (cd !== 'todos' && p.cd !== cd) return false;
      if (filterOperacao !== 'todas' && p.operacao !== filterOperacao) return false;
      return true;
    });
  };
  const ativosCount = colaboradoresAtivos(filterCd).length;

  // ── Cálculo de absenteísmo por período ──
  const calcAbsenteismoPeriodo = () => {
    if (ativosCount === 0) return '0.00';

    if (periodoTipo === 'diario') {
      // Faltas de hoje ÷ ativos × 100
      const faltasHoje = faltasMes.filter(f => f.data === hoje).length;
      return ((faltasHoje / ativosCount) * 100).toFixed(2);
    }

    if (periodoTipo === 'semanal') {
      // Faltas da semana atual ÷ (ativos × dias úteis da semana) × 100
      const faltasSemana = faltasMes.filter(f => diasUteisSemanaAtual.includes(f.data)).length;
      const denominador  = ativosCount * (totalDiasUteisSemana || 1);
      return ((faltasSemana / denominador) * 100).toFixed(2);
    }

    // Mensal: faltas do mês ÷ (ativos × dias úteis do mês) × 100
    const denominador = ativosCount * totalDiasUteisMes;
    if (denominador === 0) return '0.00';
    return ((faltasMes.length / denominador) * 100).toFixed(2);
  };

  const calcAbsenteismoPorOp = (operacao, faltasOp) => {
    const ativos = pessoas.filter(p => {
      if (p.de_ferias || p.em_licenca || p.em_recrutamento) return false;
      if (p.operacao !== operacao) return false;
      if (filterCd !== 'todos' && p.cd !== filterCd) return false;
      return true;
    }).length;
    const denominador = ativos * totalDiasUteisMes;
    if (denominador === 0) return '0.0';
    return ((faltasOp / denominador) * 100).toFixed(2);
  };

  // ── Faltas do período selecionado para os KPIs ──
  const faltasPeriodo = () => {
    if (periodoTipo === 'diario')  return faltasMes.filter(f => f.data === hoje);
    if (periodoTipo === 'semanal') return faltasMes.filter(f => diasUteisSemanaAtual.includes(f.data));
    return faltasMes;
  };
  const faltasAtivas = faltasPeriodo();

  // ── Label do período ──
  const labelPeriodo = periodoTipo === 'diario' ? 'Hoje' : periodoTipo === 'semanal' ? 'Esta semana' : 'Este mês';
  const denominadorLabel = periodoTipo === 'diario'
    ? `${ativosCount} ativos`
    : periodoTipo === 'semanal'
    ? `${ativosCount} × ${totalDiasUteisSemana} dias = ${ativosCount * totalDiasUteisSemana}`
    : `${ativosCount} × ${totalDiasUteisMes} dias = ${ativosCount * totalDiasUteisMes}`;

  // ── Timeline ──
  const dadosTimeline = () => {
    if (!mesAno) return { labels: [], valores: [] };
    const ultimoDia = new Date(ano, mes, 0).getDate();

    if (periodoTipo === 'diario') {
      const labels = [], valores = [];
      for (let d = 1; d <= ultimoDia; d++) {
        const dataStr = `${ano}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        labels.push(`${String(d).padStart(2,'0')}/${String(mes).padStart(2,'0')}`);
        valores.push(faltasMes.filter(f => f.data === dataStr).length);
      }
      return { labels, valores };
    }

    if (periodoTipo === 'semanal') {
      const semanas = {};
      faltasMes.forEach(f => {
        const semana = `Sem ${Math.ceil(new Date(f.data + 'T00:00:00').getDate() / 7)}`;
        semanas[semana] = (semanas[semana] || 0) + 1;
      });
      const labels = Object.keys(semanas).sort();
      return { labels, valores: labels.map(l => semanas[l]) };
    }

    // Mensal: últimos 6 meses
    const labels = [], valores = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ano, mes - 1 - i, 1);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const a = d.getFullYear();
      labels.push(`${m}/${a}`);
      valores.push(faltasMes.filter(f => f.data.startsWith(`${a}-${m}`)).length);
    }
    return { labels, valores };
  };

  const rankingColaboradores = () => {
    const contagem = {};
    faltasAtivas.forEach(f => {
      if (f.operacao === 'SUPORTE') return;
      if (!contagem[f.pessoa_id]) contagem[f.pessoa_id] = { nome: f.pessoa_nome, cargo: f.cargo, operacao: f.operacao, total: 0 };
      contagem[f.pessoa_id].total++;
    });
    return Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 10);
  };

  const rankingOperacoes = () => {
    const totalPorOp = {}, faltasPorOp = {};
    pessoas.forEach(p => {
      if (p.de_ferias || p.em_licenca || p.em_recrutamento) return;
      if (!p.operacao || p.operacao === 'SUPORTE' || p.operacao === 'ANALISTA GERAL') return;
      if (filterCd !== 'todos' && p.cd !== filterCd) return;
      totalPorOp[p.operacao] = (totalPorOp[p.operacao] || 0) + 1;
    });
    faltasMes.forEach(f => {
      if (f.operacao === 'SUPORTE') return;
      faltasPorOp[f.operacao] = (faltasPorOp[f.operacao] || 0) + 1;
    });
    return Object.keys(totalPorOp).map(op => ({
      operacao: op,
      faltas: faltasPorOp[op] || 0,
      total: totalPorOp[op],
      pct: calcAbsenteismoPorOp(op, faltasPorOp[op] || 0),
    })).sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));
  };

  const dadosStatus = () => {
    const base = filterCd === 'todos' ? pessoas : pessoas.filter(p => p.cd === filterCd);
    return {
      ativos:       base.filter(p => !p.de_ferias && !p.em_licenca && !p.em_recrutamento && p.operacao !== 'ANALISTA GERAL' && p.operacao !== 'SUPORTE').length,
      suporte:      base.filter(p => !p.de_ferias && !p.em_licenca && !p.em_recrutamento && p.operacao === 'SUPORTE').length,
      ferias:       base.filter(p => p.de_ferias).length,
      licenca:      base.filter(p => p.em_licenca).length,
      recrutamento: base.filter(p => p.em_recrutamento).length,
    };
  };

  const timeline     = dadosTimeline();
  const rankingColab = rankingColaboradores();
  const rankingOps   = rankingOperacoes();
  const status       = dadosStatus();
  const maiorColab   = rankingColab[0]?.total || 1;
  const maiorOp      = rankingOps[0] ? parseFloat(rankingOps[0].pct) : 1;
  const absPct       = calcAbsenteismoPeriodo();

  // Feriados filtrados por CD para exibir no modal
  const feriadosDoCD = feriados.filter(f => !f.cd || f.cd === filterCd || filterCd === 'todos');

  const lineData = {
    labels: timeline.labels,
    datasets: [{ label: 'Faltas', data: timeline.valores, borderColor: 'rgba(239,68,68,1)', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, pointBackgroundColor: 'rgba(239,68,68,1)', pointRadius: 4 }],
  };
  const lineOptions = { responsive: true, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } };

  const doughnutData = {
    labels: ['Ativos', 'SUPORTE', 'Férias', 'Licença', 'Recrutamento'],
    datasets: [{ data: [status.ativos, status.suporte, status.ferias, status.licenca, status.recrutamento], backgroundColor: ['#10b981','#14b8a6','#f59e0b','#8b5cf6','#6366f1'], borderWidth: 0 }],
  };
  const doughnutOptions = { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 } } } }, cutout: '65%' };

  const barOpData = {
    labels: rankingOps.map(o => o.operacao.length > 12 ? o.operacao.slice(0, 12) + '…' : o.operacao),
    datasets: [{ label: '% Absenteísmo', data: rankingOps.map(o => parseFloat(o.pct)), backgroundColor: rankingOps.map((_, i) => CORES[i % CORES.length]), borderRadius: 6 }],
  };
  const barOpOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Carregando dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">Dashboard de Absenteísmo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {periodoTipo === 'diario'
                ? 'Diário: faltas ÷ ativos × 100'
                : periodoTipo === 'semanal'
                ? 'Semanal: faltas ÷ (ativos × dias úteis da semana) × 100'
                : 'Mensal: faltas ÷ (ativos × dias úteis do mês) × 100'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalFeriados(true)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-medium">
            <Calendar className="w-4 h-4" /> Feriados ({feriadosDoCD.length})
          </button>
          <button onClick={fetchDados}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition text-sm">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="month" value={mesAno} onChange={(e) => setMesAno(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          {!temRestricaoCd && cds.length > 1 && (
            <select value={filterCd} onChange={(e) => setFilterCd(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="todos">Todos os CDs</option>
              {cds.map(cd => <option key={cd} value={cd}>{cd}</option>)}
            </select>
          )}
          {temRestricaoCd && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
              <Building2 className="w-3.5 h-3.5" /> CD: {filterCd}
            </span>
          )}
          <select value={filterOperacao} onChange={(e) => setFilterOperacao(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="todas">Todas as operações</option>
            {operacoes.filter(op => op !== 'SUPORTE').map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {[{ value: 'diario', label: 'Diário' }, { value: 'semanal', label: 'Semanal' }, { value: 'mensal', label: 'Mensal' }].map(opt => (
              <button key={opt.value} onClick={() => setPeriodoTipo(opt.value)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${periodoTipo === opt.value ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Info denominador */}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <span>📅 Dias úteis mês: <strong className="text-slate-600">{totalDiasUteisMes}</strong></span>
          {periodoTipo === 'semanal' && <span>📅 Dias úteis semana: <strong className="text-slate-600">{totalDiasUteisSemana}</strong></span>}
          <span>👥 Ativos: <strong className="text-slate-600">{ativosCount}</strong></span>
          <span>📊 Denominador: <strong className="text-slate-600">{denominadorLabel}</strong></span>
          {feriadosDoCD.length > 0 && <span className="text-amber-600">🗓 {feriadosDoCD.length} feriado(s) descontado(s)</span>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: `Faltas (${labelPeriodo})`, value: faltasAtivas.length, color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
          { label: 'Pessoas Afetadas', value: rankingColab.length, color: 'text-orange-600', bg: 'bg-orange-50', icon: '👤' },
          { label: `Absenteísmo (${labelPeriodo})`, value: absPct + '%', color: 'text-purple-600', bg: 'bg-purple-50', icon: '📊' },
          { label: 'Operações com Falta', value: rankingOps.filter(o => o.faltas > 0).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏭' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[
            { id: 'timeline',      label: 'Linha do Tempo',  icon: <TrendingDown className="w-4 h-4" /> },
            { id: 'colaboradores', label: 'Por Colaborador', icon: <Users className="w-4 h-4" /> },
            { id: 'operacoes',     label: 'Por Operação',    icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'status',        label: 'Status Geral',    icon: <BarChart3 className="w-4 h-4" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 font-semibold transition text-sm whitespace-nowrap ${aba === tab.id ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-700'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABA: Linha do Tempo */}
      {aba === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-700">Faltas por período</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full capitalize">{periodoTipo}</span>
          </div>
          {timeline.valores.every(v => v === 0)
            ? <div className="text-center py-16"><div className="text-4xl mb-3">🎉</div><p className="text-slate-500 font-medium">Nenhuma falta neste período</p></div>
            : <Line data={lineData} options={lineOptions} />}
        </div>
      )}

      {/* ABA: Por Colaborador */}
      {aba === 'colaboradores' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-1">Top 10 — Colaboradores com mais faltas</h3>
          <p className="text-xs text-slate-400 mb-5">{labelPeriodo}</p>
          {rankingColab.length === 0
            ? <div className="text-center py-16"><div className="text-4xl mb-3">🎉</div><p className="text-slate-500 font-medium">Nenhuma falta registrada</p></div>
            : (
              <div className="space-y-3">
                {rankingColab.map((pessoa, idx) => {
                  const pct = Math.round((pessoa.total / maiorColab) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="text-sm font-bold text-slate-400 w-6 text-right flex-shrink-0">{idx + 1}º</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 text-sm truncate block">{pessoa.nome}</span>
                            <span className="text-xs text-slate-400">{pessoa.cargo} · {pessoa.operacao}</span>
                          </div>
                          <span className="text-lg font-bold text-red-600 ml-4 flex-shrink-0">{pessoa.total}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CORES[idx % CORES.length] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* ABA: Por Operação */}
      {aba === 'operacoes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-1">Absenteísmo por operação (%)</h3>
            <p className="text-xs text-slate-400 mb-5">faltas ÷ (ativos × {totalDiasUteisMes} dias úteis) × 100</p>
            {rankingOps.length === 0
              ? <div className="text-center py-16"><p className="text-slate-400">Sem dados suficientes</p></div>
              : <Bar data={barOpData} options={barOpOptions} />}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-5">Ranking por operação</h3>
            <div className="space-y-3">
              {rankingOps.map((op, idx) => {
                const pct = maiorOp > 0 ? Math.round((parseFloat(op.pct) / maiorOp) * 100) : 0;
                return (
                  <div key={op.operacao} className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-400 w-6 text-right flex-shrink-0">{idx + 1}º</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{op.operacao}</span>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className="text-xs text-slate-400">{op.faltas} faltas / {op.total} ativos</span>
                          <span className="text-base font-bold text-red-600">{op.pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CORES[idx % CORES.length] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA: Status Geral */}
      {aba === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-5">Distribuição de status</h3>
            <div className="max-w-xs mx-auto">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-5">Resumo dos colaboradores</h3>
            <div className="space-y-3">
              {[
                { label: 'Ativos', value: status.ativos, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'SUPORTE', value: status.suporte, color: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' },
                { label: 'Férias', value: status.ferias, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Em Licença', value: status.licenca, color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
                { label: 'Recrutamento', value: status.recrutamento, color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
              ].map(item => {
                const total = status.ativos + status.suporte + status.ferias + status.licenca + status.recrutamento;
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-semibold text-xs ${item.text}`}>{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{pct}%</span>
                        <span className={`text-xl font-bold ${item.text}`}>{item.value}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white bg-opacity-60 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-800">{status.ativos + status.suporte + status.ferias + status.licenca + status.recrutamento}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Feriados */}
      {modalFeriados && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Feriados do mês</h3>
                <p className="text-xs text-slate-400 mt-0.5">{mesAno} — {totalDiasUteisMes} dias úteis após descontar feriados</p>
              </div>
              <button onClick={() => setModalFeriados(false)} className="p-1 rounded-lg hover:bg-slate-100 transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {/* Adicionar feriado */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="date" value={novoFeriado.data}
                    onChange={(e) => setNovoFeriado({ ...novoFeriado, data: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <input type="text" value={novoFeriado.descricao}
                    onChange={(e) => setNovoFeriado({ ...novoFeriado, descricao: e.target.value })}
                    placeholder="Descrição do feriado..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="flex gap-2">
                  {/* Seletor de CD — null = todos */}
                  <select value={novoFeriado.cd}
                    onChange={(e) => setNovoFeriado({ ...novoFeriado, cd: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">Todos os CDs (nacional)</option>
                    {cds.map(cd => <option key={cd} value={cd}>{cd}</option>)}
                  </select>
                  <button onClick={handleAdicionarFeriado}
                    disabled={savingFeriado || !novoFeriado.data || !novoFeriado.descricao.trim()}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-1 text-sm font-semibold flex-shrink-0">
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
              </div>

              {/* Lista de feriados */}
              {feriadosDoCD.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Nenhum feriado neste mês</div>
              ) : (
                <div className="space-y-2">
                  {feriadosDoCD.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{f.descricao}</p>
                        <p className="text-xs text-slate-400">{new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.nacional && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Nacional</span>}
                        {f.cd && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{f.cd}</span>}
                        {!f.nacional && (
                          <button onClick={() => handleRemoverFeriado(f.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAbsenteismo;