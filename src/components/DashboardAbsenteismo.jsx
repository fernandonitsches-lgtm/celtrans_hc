import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Calendar, Filter, Users, AlertCircle, RefreshCw, Building2 } from 'lucide-react';
import { MOTIVOS_AUSENCIA } from '../constants/motivos';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const LABEL_MOTIVO = (valor) => {
  const found = MOTIVOS_AUSENCIA.find(m => m.value === valor);
  return found ? found.label : valor || 'Sem motivo';
};

const CORES = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1'];

// userCd: 'todos' = admin, outro valor = restrito
const DashboardAbsenteismo = ({ initialPeople = [], operacoes = [], cds = [], filterCdExterno = 'todos', userCd = 'todos' }) => {
  const [faltas, setFaltas]   = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [periodoTipo, setPeriodoTipo] = useState('mensal');
  const [mesAno, setMesAno]   = useState('');
  const [filterCd, setFilterCd] = useState(filterCdExterno);
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [aba, setAba]         = useState('timeline');

  const temRestricaoCd = userCd !== 'todos';

  useEffect(() => {
    const hoje = new Date();
    setMesAno(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  // Sincroniza filterCd com o externo (quando admin muda no SectorAssignment)
  useEffect(() => { setFilterCd(filterCdExterno); }, [filterCdExterno]);

  useEffect(() => { if (mesAno) fetchDados(); }, [mesAno, filterCd, filterOperacao]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      setError('');
      const [ano, mes] = mesAno.split('-');
      const dataInicio = `${ano}-${mes}-01`;
      const ultimoDia  = new Date(ano, mes, 0).getDate();
      const dataFim    = `${ano}-${mes}-${ultimoDia}`;

      const [{ data: faltasData, error: fErr }, { data: pessoasData, error: pErr }] = await Promise.all([
        supabase.from('faltas_diarias').select('*').gte('data', dataInicio).lte('data', dataFim).order('data', { ascending: true }),
        supabase.from('pessoas').select('*'),
      ]);
      if (fErr) throw fErr;
      if (pErr) throw pErr;

      // Aplica filtros
      let faltasFiltradas = faltasData || [];
      if (filterCd !== 'todos') faltasFiltradas = faltasFiltradas.filter(f => f.cd === filterCd);
      if (filterOperacao !== 'todas') faltasFiltradas = faltasFiltradas.filter(f => f.operacao === filterOperacao);
      // Exclui SUPORTE do dashboard de absenteísmo
      faltasFiltradas = faltasFiltradas.filter(f => f.operacao !== 'SUPORTE');

      setFaltas(faltasFiltradas);
      setPessoas(pessoasData || []);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Timeline ──
  const dadosTimeline = () => {
    const [ano, mes] = mesAno.split('-');
    const ultimoDia  = new Date(ano, mes, 0).getDate();

    if (periodoTipo === 'diario') {
      const labels = [], valores = [];
      for (let d = 1; d <= ultimoDia; d++) {
        const dataStr = `${ano}-${mes}-${String(d).padStart(2, '0')}`;
        labels.push(`${String(d).padStart(2, '0')}/${mes}`);
        valores.push(faltas.filter(f => f.data === dataStr).length);
      }
      return { labels, valores };
    }

    if (periodoTipo === 'semanal') {
      const semanas = {};
      faltas.forEach(f => {
        const semana = `Sem ${Math.ceil(new Date(f.data + 'T00:00:00').getDate() / 7)}`;
        semanas[semana] = (semanas[semana] || 0) + 1;
      });
      const labels = Object.keys(semanas).sort();
      return { labels, valores: labels.map(l => semanas[l]) };
    }

    // Mensal: últimos 6 meses
    const labels = [], valores = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(parseInt(ano), parseInt(mes) - 1 - i, 1);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const a = d.getFullYear();
      labels.push(`${m}/${a}`);
      valores.push(faltas.filter(f => f.data.startsWith(`${a}-${m}`)).length);
    }
    return { labels, valores };
  };

  // ── Ranking colaboradores (exclui SUPORTE) ──
  const rankingColaboradores = () => {
    const contagem = {};
    faltas.forEach(f => {
      if (f.operacao === 'SUPORTE') return;
      if (!contagem[f.pessoa_id]) {
        contagem[f.pessoa_id] = { nome: f.pessoa_nome, cargo: f.cargo, operacao: f.operacao, total: 0 };
      }
      contagem[f.pessoa_id].total++;
    });
    return Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 10);
  };

  // ── Ranking por operação (exclui SUPORTE, recrutamento, férias e licença do denominador) ──
  const rankingOperacoes = () => {
    const totalPorOp = {};
    const faltasPorOp = {};

    // Total: apenas ativos sem SUPORTE e sem recrutamento
    pessoas.forEach(p => {
      if (!p.operacao || p.operacao === 'SUPORTE' || p.operacao === 'ANALISTA GERAL') return;
      if (p.em_recrutamento) return; // vagas não contam
      if (filterCd !== 'todos' && p.cd !== filterCd) return;
      totalPorOp[p.operacao] = (totalPorOp[p.operacao] || 0) + 1;
    });

    faltas.forEach(f => {
      if (f.operacao === 'SUPORTE') return;
      faltasPorOp[f.operacao] = (faltasPorOp[f.operacao] || 0) + 1;
    });

    return Object.keys(totalPorOp).map(op => ({
      operacao: op,
      faltas: faltasPorOp[op] || 0,
      total: totalPorOp[op],
      pct: totalPorOp[op] > 0 ? ((faltasPorOp[op] || 0) / totalPorOp[op] * 100).toFixed(1) : '0.0',
    })).sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));
  };

  // ── Status geral (exclui SUPORTE dos ativos para consistência) ──
  const dadosStatus = () => {
    const base = filterCd === 'todos' ? pessoas : pessoas.filter(p => p.cd === filterCd);
    const ativos      = base.filter(p => !p.de_ferias && !p.em_licenca && !p.em_recrutamento && p.operacao !== 'ANALISTA GERAL' && p.operacao !== 'SUPORTE').length;
    const suporte     = base.filter(p => !p.de_ferias && !p.em_licenca && !p.em_recrutamento && p.operacao === 'SUPORTE').length;
    const ferias      = base.filter(p => p.de_ferias).length;
    const licenca     = base.filter(p => p.em_licenca).length;
    const recrutamento= base.filter(p => p.em_recrutamento).length;
    return { ativos, suporte, ferias, licenca, recrutamento };
  };

  const timeline      = dadosTimeline();
  const rankingColab  = rankingColaboradores();
  const rankingOps    = rankingOperacoes();
  const status        = dadosStatus();
  const totalFaltas   = faltas.length;
  const maiorColab    = rankingColab[0]?.total || 1;
  const maiorOp       = rankingOps[0] ? parseFloat(rankingOps[0].pct) : 1;

  const lineData = {
    labels: timeline.labels,
    datasets: [{
      label: 'Faltas', data: timeline.valores,
      borderColor: 'rgba(239,68,68,1)', backgroundColor: 'rgba(239,68,68,0.08)',
      fill: true, tension: 0.4, pointBackgroundColor: 'rgba(239,68,68,1)', pointRadius: 4,
    }],
  };
  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
  };

  const doughnutData = {
    labels: ['Ativos', 'SUPORTE', 'Férias', 'Licença', 'Recrutamento'],
    datasets: [{ data: [status.ativos, status.suporte, status.ferias, status.licenca, status.recrutamento], backgroundColor: ['#10b981','#14b8a6','#f59e0b','#8b5cf6','#6366f1'], borderWidth: 0 }],
  };
  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 } } } },
    cutout: '65%',
  };

  const barOpData = {
    labels: rankingOps.map(o => o.operacao.length > 12 ? o.operacao.slice(0, 12) + '…' : o.operacao),
    datasets: [{ label: '% Absenteísmo', data: rankingOps.map(o => parseFloat(o.pct)), backgroundColor: rankingOps.map((_, i) => CORES[i % CORES.length]), borderRadius: 6 }],
  };
  const barOpOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">Dashboard de Absenteísmo</h2>
            <p className="text-xs text-slate-400 mt-0.5">SUPORTE não entra no cálculo de absenteísmo</p>
          </div>
        </div>
        <button onClick={fetchDados}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition text-sm">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
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
          {/* Só admin pode trocar CD */}
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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Faltas', value: totalFaltas, color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
          { label: 'Pessoas Afetadas', value: rankingColab.length, color: 'text-orange-600', bg: 'bg-orange-50', icon: '👤' },
          {
            label: 'Absenteísmo Geral',
            value: (() => {
              // Denominador: pessoas sem SUPORTE, sem recrutamento, filtradas por CD
              const base = (filterCd === 'todos' ? pessoas : pessoas.filter(p => p.cd === filterCd))
                .filter(p => p.operacao !== 'SUPORTE' && p.operacao !== 'ANALISTA GERAL' && !p.em_recrutamento);
              return base.length > 0 ? (totalFaltas / base.length * 100).toFixed(1) + '%' : '0%';
            })(),
            color: 'text-purple-600', bg: 'bg-purple-50', icon: '📊'
          },
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
            { id: 'timeline', label: 'Linha do Tempo', icon: <TrendingDown className="w-4 h-4" /> },
            { id: 'colaboradores', label: 'Por Colaborador', icon: <Users className="w-4 h-4" /> },
            { id: 'operacoes', label: 'Por Operação', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'status', label: 'Status Geral', icon: <BarChart3 className="w-4 h-4" /> },
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
          {timeline.valores.every(v => v === 0) ? (
            <div className="text-center py-16"><div className="text-4xl mb-3">🎉</div><p className="text-slate-500 font-medium">Nenhuma falta neste período</p></div>
          ) : (
            <Line data={lineData} options={lineOptions} />
          )}
        </div>
      )}

      {/* ABA: Por Colaborador */}
      {aba === 'colaboradores' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-5">Top 10 — Colaboradores com mais faltas</h3>
          {rankingColab.length === 0 ? (
            <div className="text-center py-16"><div className="text-4xl mb-3">🎉</div><p className="text-slate-500 font-medium">Nenhuma falta registrada</p></div>
          ) : (
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
            <h3 className="font-bold text-slate-700 mb-5">Absenteísmo por operação (%) — SUPORTE excluído</h3>
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
                          <span className="text-xs text-slate-400">{op.faltas} faltas / {op.total} pessoas</span>
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
                { label: 'Ativos (sem SUPORTE)', value: status.ativos, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
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
    </div>
  );
};

export default DashboardAbsenteismo;