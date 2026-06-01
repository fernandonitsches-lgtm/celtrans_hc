import { OP_SUPORTE } from '../constants/operacoes';
import { usePessoas } from '../hooks/usePessoas';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { supabase } from '../lib/supabase';
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, RotateCcw, ChevronDown, BarChart3, Search, AlertCircle, TrendingDown, Bell, UserX, Layers, Building2, X } from 'lucide-react';
import ExcelJS from 'exceljs';
import ModalSalvar from './ModalSalvar';
import RankingFaltas from './RankingFaltas';
import ModalColaborador from './ModalColaborador';
import DashboardAbsenteismo from './DashboardAbsenteismo';

const OP_NET = 'NET';

const NET_AREA_CORES = {
  'MISCELÂNEA': { border: 'border-blue-400',   bg: 'bg-blue-50/60',   label: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'    },
  'REVERSA':    { border: 'border-violet-400', bg: 'bg-violet-50/60', label: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  'TERMINAL':   { border: 'border-cyan-400',   bg: 'bg-cyan-50/60',   label: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700'    },
};
const NET_AREA_COR_DEFAULT = { border: 'border-slate-400', bg: 'bg-slate-50/60', label: 'text-slate-700', badge: 'bg-slate-100 text-slate-600' };

const SectorAssignment = ({ forcarDashboard = false, userCd = 'todos' }) => {
  const [assignments, setAssignments]           = useState(null);
  const [draggedPerson, setDraggedPerson]       = useState(null);
  const [today, setToday]                       = useState(new Date().toISOString().split('T')[0]);
  const [justificativas, setJustificativas]     = useState({});
  const [motivosFalta, setMotivosFalta]         = useState({});
  const [expandedOps, setExpandedOps]           = useState({});
  const [expandedNetGroup, setExpandedNetGroup] = useState(true);
  const [expandedNetAreas, setExpandedNetAreas] = useState({});
  const [viewMode, setViewMode]                 = useState(forcarDashboard ? 'dashboard' : 'atribuir');
  const [searchTerm, setSearchTerm]             = useState('');
  const [filterOperacao, setFilterOperacao]     = useState('todas');
  const [filterCd, setFilterCd]                 = useState(userCd);
  const cdBloqueado                             = userCd !== 'todos';
  const [modalAberto, setModalAberto]           = useState(false);
  const [salvando, setSalvando]                 = useState(false);
  const [dragOver, setDragOver]                 = useState(null);
  const [confirmarReset, setConfirmarReset]     = useState(false);
  const [dashboardAba, setDashboardAba]         = useState('metricas');
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
  const [abrirEmFalta, setAbrirEmFalta]                     = useState(false);
  const [loadingData, setLoadingData]           = useState(false);
  const [dataTemRegistro, setDataTemRegistro]   = useState(false);

  const { stopAutoScroll } = useAutoScroll();
  const { initialPeople, operacoes, cds, loading, error } = usePessoas();

  useEffect(() => { setViewMode(forcarDashboard ? 'dashboard' : 'atribuir'); }, [forcarDashboard]);
  useEffect(() => { setFilterCd(userCd); }, [userCd]);
  useEffect(() => { setFilterOperacao('todas'); }, [filterCd]);

  const makeKey = (op, st) => `${op}||${st}`;

  // Operações filtradas pelo CD ativo
  const operacoesFiltradas = filterCd === 'todos'
    ? operacoes
    : [...new Set(initialPeople.filter(p => p.cd === filterCd).map(p => p.operacao))]
        .filter(op => op !== 'ANALISTA GERAL' && op !== OP_SUPORTE)
        .sort();

  const opsNorm = operacoesFiltradas.filter(op => op !== OP_NET && op !== 'ANALISTA GERAL');
  const temNet  = operacoesFiltradas.includes(OP_NET);

  const areasNet = [...new Set(
    initialPeople
      .filter(p => p.operacao === OP_NET && !p.em_recrutamento && !p.de_ferias && !p.em_licenca && (filterCd === 'todos' || p.cd === filterCd))
      .map(p => p.area).filter(Boolean)
  )].sort();

  const initializeAssignments = useCallback((people) => {
    const init = { falta: [] };
    people
      .filter(p => !p.de_ferias && !p.em_licenca && p.operacao !== 'ANALISTA GERAL' && !p.em_recrutamento)
      .forEach(person => {
        const key = makeKey(person.operacao, person.setor);
        if (!init[key]) init[key] = [];
        init[key].push(person);
      });
    setAssignments(init);
    setJustificativas({});
    setMotivosFalta({});
    setDataTemRegistro(false);
  }, []);

  const carregarAtribuicaoPorData = useCallback(async (data, people) => {
    if (!people || !people.length) return;
    setLoadingData(true);
    try {
      const [{ data: atrib }, { data: faltasData }] = await Promise.all([
        supabase.from('atribuicoes_diarias').select('*').eq('data', data),
        supabase.from('faltas_diarias').select('*').eq('data', data),
      ]);
      const temRegistro = (atrib?.length || 0) + (faltasData?.length || 0) > 0;
      setDataTemRegistro(temRegistro);
      if (!temRegistro) { initializeAssignments(people); return; }
      const pessoasMap = {};
      people.forEach(p => { pessoasMap[p.id] = p; });
      const newAssignments = { falta: [] };
      atrib?.forEach(a => {
        const person = pessoasMap[a.pessoa_id];
        if (!person) return;
        const key = makeKey(a.operacao, a.setor);
        if (!newAssignments[key]) newAssignments[key] = [];
        if (!newAssignments[key].some(p => p.id === person.id)) newAssignments[key].push(person);
      });
      const novasJust = {};
      const novosMotivos = {};
      faltasData?.forEach(f => {
        const person = pessoasMap[f.pessoa_id];
        if (!person) return;
        if (!newAssignments.falta.some(p => p.id === person.id)) newAssignments.falta.push(person);
        novasJust[f.pessoa_id]    = f.justificativa || '';
        novosMotivos[f.pessoa_id] = f.motivo || '';
      });
      setAssignments(newAssignments);
      setJustificativas(novasJust);
      setMotivosFalta(novosMotivos);
    } catch (err) {
      console.error(err);
      initializeAssignments(people);
    } finally {
      setLoadingData(false);
    }
  }, [initializeAssignments]);

  useEffect(() => {
    if (initialPeople.length > 0 && operacoes.length > 0) {
      const expandAll = {};
      operacoes.forEach(op => { expandAll[op] = true; });
      expandAll[OP_SUPORTE] = true;
      setExpandedOps(expandAll);
      const netAreas = {};
      [...new Set(initialPeople.filter(p => p.operacao === OP_NET).map(p => p.area).filter(Boolean))].forEach(a => { netAreas[a] = true; });
      setExpandedNetAreas(netAreas);
      carregarAtribuicaoPorData(today, initialPeople);
    }
  }, [initialPeople, operacoes]);

  useEffect(() => {
    if (initialPeople.length > 0) carregarAtribuicaoPorData(today, initialPeople);
  }, [today]);

  const vagas     = initialPeople.filter(p => p.em_recrutamento);
  const isSuporte = (p) => p.operacao === OP_SUPORTE;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Carregando dados...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center bg-red-50 p-6 rounded-xl border border-red-200">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold">Erro ao conectar</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  if (assignments === null || loadingData) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">{loadingData ? `Carregando ${today}...` : 'Inicializando...'}</p>
      </div>
    </div>
  );

  // ── Handlers ──
  const handleDragStart = (e, person, source) => {
    e.stopPropagation();
    setDraggedPerson({ person, source });
  };
  const handleDragOver  = (e, key) => { e.preventDefault(); setDragOver(key); };
  const handleDragLeave = () => setDragOver(null);

  const handleDrop = (target) => {
    if (!draggedPerson) return;
    const { person, source } = draggedPerson;
    setDraggedPerson(null); setDragOver(null); stopAutoScroll();

    // Arrastar para falta → remove do setor atual e abre modal igual ao clique
    if (target === 'falta') {
      setAssignments(prev => {
        const next = { ...prev };
        next[source] = (next[source] || []).filter(p => p.id !== person.id);
        return next;
      });
      setAbrirEmFalta(true);
      setColaboradorSelecionado(person);
      return;
    }

    // Drop normal em setor
    setAssignments(prev => {
      const next = { ...prev };
      next[source] = (next[source] || []).filter(p => p.id !== person.id);
      if (!next[target]) next[target] = [];
      next[target] = [...next[target], person];
      return next;
    });
  };

  const handleClickColaborador = (person) => setColaboradorSelecionado(person);

  // Devolve pessoa ao setor de origem (remove da falta)
  const handleRemoverFalta = (person) => {
    const origem = initialPeople.find(p => p.id === person.id);
    if (!origem) return;
    setAssignments(prev => {
      const next = { ...prev };
      next.falta = (next.falta || []).filter(p => p.id !== person.id);
      const key = makeKey(origem.operacao, origem.setor);
      if (!next[key]) next[key] = [];
      if (!next[key].some(p => p.id === person.id)) next[key] = [...next[key], person];
      return next;
    });
    setMotivosFalta(prev => { const n = { ...prev }; delete n[person.id]; return n; });
    setJustificativas(prev => { const n = { ...prev }; delete n[person.id]; return n; });
  };

  const handleMarcarFalta = (person, motivo, observacao) => {
    setAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = next[k].filter(p => p.id !== person.id); });
      next.falta = [...(next.falta || []), person];
      return next;
    });
    setMotivosFalta(prev  => ({ ...prev, [person.id]: motivo }));
    setJustificativas(prev => ({ ...prev, [person.id]: motivo === 'outros' ? observacao : '' }));
  };

  const handleMoverColaborador = (person, destinoKey) => {
    setAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = next[k].filter(p => p.id !== person.id); });
      if (!next[destinoKey]) next[destinoKey] = [];
      next[destinoKey] = [...next[destinoKey], person];
      return next;
    });
  };

  const handleLicenca = async (person) => {
    try {
      const { error } = await supabase.from('pessoas').update({ em_licenca: true }).eq('id', person.id);
      if (error) throw error;
      setAssignments(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k] = next[k].filter(p => p.id !== person.id); });
        return next;
      });
    } catch (err) { alert('Erro ao marcar licença: ' + err.message); }
  };

  const handleReset          = () => setConfirmarReset(true);
  const handleConfirmarReset = () => { carregarAtribuicaoPorData(today, initialPeople); setConfirmarReset(false); };
  const handleJustificativa  = (personId, texto) => setJustificativas(prev => ({ ...prev, [personId]: texto }));
  const handleSalvar         = () => setModalAberto(true);

  const handleConfirmarSalvar = async (justificativasFinais, planoAcao) => {
    setSalvando(true);
    try {
      const atribuicoes = [];
      Object.keys(assignments).forEach(key => {
        if (key !== 'falta' && assignments[key]) {
          const setor = key.includes('||') ? key.split('||')[1] : key;
          assignments[key].forEach(person => {
            atribuicoes.push({ data: today, pessoa_id: person.id, pessoa_nome: person.name, setor, operacao: person.operacao, cargo: person.cargo, area: person.area, cd: person.cd });
          });
        }
      });
      const faltasArr = (assignments.falta || []).map(person => ({
        data: today, pessoa_id: person.id, pessoa_nome: person.name, cargo: person.cargo,
        operacao: person.operacao, justificativa: justificativasFinais[person.id] || '',
        motivo: motivosFalta[person.id] || '', plano_acao: planoAcao, cd: person.cd,
      }));
      await supabase.from('atribuicoes_diarias').delete().eq('data', today);
      await supabase.from('faltas_diarias').delete().eq('data', today);
      if (atribuicoes.length > 0) { const { error: e1 } = await supabase.from('atribuicoes_diarias').insert(atribuicoes); if (e1) throw e1; }
      if (faltasArr.length > 0)   { const { error: e2 } = await supabase.from('faltas_diarias').insert(faltasArr);       if (e2) throw e2; }
      setJustificativas(justificativasFinais);
      setDataTemRegistro(true);
      alert('✓ Dados salvos com sucesso para ' + today);
    } catch (err) { alert('Erro ao salvar: ' + err.message); }
    finally { setSalvando(false); setModalAberto(false); }
  };

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const wsA = workbook.addWorksheet('Atribuições');
    wsA.columns = [
      { header: 'Data', key: 'Data', width: 12 }, { header: 'CD', key: 'Cd', width: 15 },
      { header: 'Operação', key: 'Operacao', width: 20 }, { header: 'Área', key: 'Area', width: 20 },
      { header: 'Setor', key: 'Setor', width: 20 }, { header: 'Nome', key: 'Nome', width: 35 },
      { header: 'Cargo', key: 'Cargo', width: 25 },
    ];
    Object.keys(assignments).forEach(key => {
      if (key !== 'falta' && assignments[key]) {
        const setor = key.includes('||') ? key.split('||')[1] : key;
        assignments[key].filter(p => filterCd === 'todos' || p.cd === filterCd)
          .forEach(p => wsA.addRow({ Data: today, Cd: p.cd || '', Operacao: p.operacao, Area: p.area || '', Setor: setor, Nome: p.name, Cargo: p.cargo }));
      }
    });
    if (assignments.falta?.length > 0) {
      const wsF = workbook.addWorksheet('Faltas');
      wsF.columns = [
        { header: 'Data', key: 'Data', width: 12 }, { header: 'CD', key: 'Cd', width: 15 },
        { header: 'Nome', key: 'Nome', width: 35 }, { header: 'Cargo', key: 'Cargo', width: 25 },
        { header: 'Operação', key: 'Operacao', width: 20 }, { header: 'Área', key: 'Area', width: 20 },
        { header: 'Motivo', key: 'Motivo', width: 30 }, { header: 'Justificativa', key: 'Justificativa', width: 40 },
      ];
      assignments.falta.filter(p => filterCd === 'todos' || p.cd === filterCd)
        .forEach(p => wsF.addRow({ Data: today, Cd: p.cd || '', Nome: p.name, Cargo: p.cargo, Operacao: p.operacao, Area: p.area || '', Motivo: motivosFalta[p.id] || '', Justificativa: justificativas[p.id] || '' }));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `atribuicao_${today}${filterCd !== 'todos' ? `_${filterCd}` : ''}.xlsx`; link.click();
    URL.revokeObjectURL(url);
  };

  // ── Totais — sempre respeitam filterCd ──
  const initialPeopleCd   = filterCd === 'todos' ? initialPeople : initialPeople.filter(p => p.cd === filterCd);
  const totalAtribuido    = Object.keys(assignments).filter(k => k !== 'falta')
    .reduce((sum, k) => sum + (assignments[k] || []).filter(p => filterCd === 'todos' || p.cd === filterCd).length, 0);
  const pessoasSuporte    = initialPeopleCd.filter(p => p.operacao === OP_SUPORTE && !p.de_ferias && !p.em_licenca && !p.em_recrutamento);
  const setoresSuporte    = [...new Set(pessoasSuporte.map(p => p.setor))].sort();
  const pessoasEmFerias   = initialPeopleCd.filter(p => p.de_ferias);
  const pessoasEmLicenca  = initialPeopleCd.filter(p => p.em_licenca);
  const vagasFiltradas    = vagas.filter(v => filterCd === 'todos' || v.cd === filterCd);
  const faltasFiltradas   = (assignments.falta || []).filter(p => !isSuporte(p) && (filterCd === 'todos' || p.cd === filterCd));
  const faltasSemObs      = faltasFiltradas.filter(p =>
    motivosFalta[p.id] === 'outros' && (!justificativas[p.id] || justificativas[p.id].trim() === '')
  );
  const totalGeral        = initialPeopleCd.filter(p => !p.em_recrutamento).length;
  const totalSuporte      = pessoasSuporte.length;
  const totalRecrutamento = vagasFiltradas.length;
  const totalOperacional  = initialPeopleCd.filter(p => !p.em_recrutamento && !isSuporte(p) && !p.de_ferias && !p.em_licenca).length;
  const absenteismoPct    = totalOperacional > 0 ? ((faltasFiltradas.length / totalOperacional) * 100).toFixed(1) : '0.0';

  // ── Helpers ──
  const setoresPorOperacao = (operacao) => {
    const base = filterCd === 'todos' ? initialPeople : initialPeople.filter(p => p.cd === filterCd);
    const setores = [...new Set(base.filter(p => p.operacao === operacao && p.setor !== 'Analista geral operação').map(p => p.setor))].sort();
    const idx = setores.indexOf('COMPARTILHADO');
    if (idx > -1) { setores.splice(idx, 1); setores.push('COMPARTILHADO'); }
    return setores;
  };

  const setoresPorNetArea = (area) => {
    const base = filterCd === 'todos' ? initialPeople : initialPeople.filter(p => p.cd === filterCd);
    return [...new Set(base.filter(p => p.operacao === OP_NET && p.area === area && p.setor !== 'Analista geral operação').map(p => p.setor))].sort();
  };

  const pessoasNoSetor = (operacao, setor) => {
    const all = assignments[makeKey(operacao, setor)] || [];
    return filterCd === 'todos' ? all : all.filter(p => p.cd === filterCd);
  };

  const pessoasNetNoSetor = (area, setor) => {
    const all = (assignments[makeKey(OP_NET, setor)] || []).filter(p => p.area === area);
    return filterCd === 'todos' ? all : all.filter(p => p.cd === filterCd);
  };

  const estaForaDaOrigem = (person, operacaoAtual, setorAtual) => {
    const origem = initialPeople.find(p => p.id === person.id);
    return origem && (origem.setor !== setorAtual || origem.operacao !== operacaoAtual);
  };

  const pessoasAusentesDaOrigem = (operacao, setor, area = null) => {
    const key = makeKey(operacao, setor);
    return initialPeople.filter(p => {
      if (p.setor !== setor || p.operacao !== operacao || p.em_recrutamento) return false;
      if (area && p.area !== area) return false;
      if (filterCd !== 'todos' && p.cd !== filterCd) return false;
      return !assignments[key]?.some(a => a.id === p.id) && !(assignments.falta || []).some(f => f.id === p.id);
    });
  };

  const filteredPeople = (people) => {
    if (!people) return [];
    let result = filterCd === 'todos' ? people : people.filter(p => p.cd === filterCd);
    if (searchTerm) result = result.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return result;
  };

  const contaPessoasOp = (operacao) =>
    setoresPorOperacao(operacao).reduce((sum, setor) => {
      const people = pessoasNoSetor(operacao, setor).filter(p => !(assignments.falta || []).some(f => f.id === p.id));
      return sum + filteredPeople(people).length;
    }, 0);

  const contaPessoasNetArea = (area) =>
    setoresPorNetArea(area).reduce((sum, setor) => {
      const people = pessoasNetNoSetor(area, setor).filter(p => !(assignments.falta || []).some(f => f.id === p.id));
      return sum + filteredPeople(people).length;
    }, 0);

  const totalNetPessoas = areasNet.reduce((sum, area) => sum + contaPessoasNetArea(area), 0);

  // ── Renderiza grade de setores (inline, sem componente filho) ──
  const renderSetores = (operacao, pessoas_fn, setores_fn, area = null) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {setores_fn(area || operacao).map(setor => {
        const semFalta   = pessoas_fn(area || operacao, setor).filter(p => !(assignments.falta || []).some(f => f.id === p.id));
        const filtered   = filteredPeople(semFalta);
        const ghosts     = pessoasAusentesDaOrigem(operacao, setor, area);
        const vagasSetor = vagasFiltradas.filter(v => v.setor === setor && v.operacao === operacao);
        if (searchTerm && filtered.length === 0 && ghosts.length === 0) return null;
        return (
          <div key={setor}
            onDragOver={(e) => handleDragOver(e, makeKey(operacao, setor))}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(makeKey(operacao, setor))}
            className={`rounded-lg border-2 border-dashed p-3 min-h-40 transition-all ${dragOver === makeKey(operacao, setor) ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            <h3 className="font-bold text-slate-500 mb-1 pb-1.5 border-b border-slate-200 text-xs line-clamp-2">{setor}</h3>
            <span className="text-xs text-blue-500 font-semibold">({filtered.length})</span>
            <div className="space-y-1.5 mt-2">
              {filtered.map(person => {
                const visitante = estaForaDaOrigem(person, operacao, setor);
                const iniciais  = person.name.split(' ').slice(0, 2).map(n => n[0]).join('');
                return (
                  <div key={person.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, person, makeKey(operacao, setor))}
                    onDragEnd={() => setDraggedPerson(null)}
                    onClick={() => handleClickColaborador(person)}
                    className={`p-2 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all text-xs flex items-center gap-2 select-none ${visitante ? 'bg-amber-50 border border-amber-200 hover:border-amber-400' : 'bg-white border border-slate-200 hover:border-blue-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${visitante ? 'bg-amber-400' : 'bg-blue-500'}`}>
                      {iniciais}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{person.name}</div>
                      <div className="text-slate-400 truncate">{person.cargo}</div>
                      {person.cd && filterCd === 'todos' && <div className="text-slate-300 truncate text-xs">{person.cd}</div>}
                      {visitante && <div className="text-amber-500 font-medium">↪ remanejado</div>}
                    </div>
                  </div>
                );
              })}
              {ghosts.map(person => (
                <div key={`ghost-${person.id}`} className="bg-white p-2 rounded-lg border border-dashed border-slate-200 text-xs opacity-40 select-none flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {person.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-500 truncate">{person.name}</div>
                    <div className="text-slate-400 italic">deslocado</div>
                  </div>
                </div>
              ))}
              {vagasSetor.map(vaga => (
                <div key={`vaga-${vaga.id}`} className="bg-purple-50 p-2 rounded-lg border border-dashed border-purple-200 text-xs">
                  <div className="font-semibold text-purple-600">🔍 Em Recrutamento</div>
                  <div className="text-purple-400 truncate">{vaga.cargo}</div>
                  {vaga.nome_anterior && <div className="text-purple-300">Ant: {vaga.nome_anterior}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Bloco de operação normal (inline, sem componente filho) ──
  const renderOperacaoBlock = (operacao) => (
    <div key={operacao} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={() => setExpandedOps(prev => ({ ...prev, [operacao]: !prev[operacao] }))}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition border-l-4 border-blue-500">
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedOps[operacao] ? '' : '-rotate-90'}`} />
          <span className="font-bold text-slate-700 text-sm">{operacao}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{contaPessoasOp(operacao)} pessoas</span>
        </div>
      </button>
      {expandedOps[operacao] && (
        <div className="border-t border-slate-100 p-4">
          {renderSetores(operacao, pessoasNoSetor, setoresPorOperacao)}
        </div>
      )}
    </div>
  );

  // ── Resumo Geral (reutilizado no dashboard e na view principal) ──
  const ResumoGeral = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-700 text-sm">
          Resumo Geral {filterCd !== 'todos' && <span className="text-blue-600 ml-1">— {filterCd}</span>}
        </h2>
        {/* Filtro por CD no dashboard — abas compactas */}
        {cds.length > 1 && !cdBloqueado && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button onClick={() => setFilterCd('todos')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${filterCd === 'todos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              Todos
            </button>
            {cds.map(cd => (
              <button key={cd} onClick={() => setFilterCd(cd)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${filterCd === cd ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {cd}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalGeral}</div><div className="text-xs text-slate-500 mt-1">Total</div></div>
        <div className="bg-green-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-green-600">{totalAtribuido}</div><div className="text-xs text-slate-500 mt-1">Presentes</div></div>
        <div className="bg-red-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-red-600">{faltasFiltradas.length}</div><div className="text-xs text-slate-500 mt-1">Faltas</div></div>
        <div className="bg-orange-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-orange-500">{pessoasEmFerias.length}</div><div className="text-xs text-slate-500 mt-1">Férias</div></div>
        <div className="bg-purple-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-purple-500">{pessoasEmLicenca.length}</div><div className="text-xs text-slate-500 mt-1">Licença</div></div>
        <div className="bg-rose-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-rose-600">{absenteismoPct}%</div><div className="text-xs text-slate-500 mt-1">Absenteísmo</div></div>
      </div>

      <div className="border-t border-dashed border-slate-200 pt-3">
        <p className="text-xs text-slate-400 mb-2 italic">Não contam no absenteísmo:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-teal-50 border border-dashed border-teal-200 rounded-xl p-4 text-center relative">
            <div className="text-2xl font-bold text-teal-600">{totalSuporte}</div>
            <div className="text-xs text-slate-500 mt-1">Suporte</div>
            <span className="absolute top-2 right-2 text-xs bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-full">🛠</span>
          </div>
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center relative">
            <div className="text-2xl font-bold text-slate-500">{totalRecrutamento}</div>
            <div className="text-xs text-slate-500 mt-1">Recrutamento</div>
            <span className="absolute top-2 right-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">🔍</span>
          </div>
        </div>
      </div>

      {/* Lista de faltas com botão remover */}
      {faltasFiltradas.length > 0 && (
        <div className="border-t border-slate-100 mt-4 pt-4">
          <h3 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Faltas do dia — clique × para desfazer
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {faltasFiltradas.map(person => (
              <div key={person.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100 text-xs">
                <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {person.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-red-800 truncate">{person.name}</div>
                  <div className="text-red-400 truncate">{person.operacao}</div>
                </div>
                <button onClick={() => handleRemoverFalta(person)}
                  title="Desfazer falta — devolver ao setor de origem"
                  className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-400 hover:text-white flex items-center justify-center text-red-700 flex-shrink-0 transition font-bold text-xs">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Dashboard ──
  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard de Operações</h1>
                <p className="text-slate-400 text-sm mt-0.5">Acompanhe em tempo real o desempenho das operações.</p>
              </div>
            </div>
            <button onClick={() => setViewMode('atribuir')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium shadow-sm">← Voltar</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {[
                { id: 'metricas',    label: 'Métricas do Dia',   icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'absenteismo', label: 'Absenteísmo',       icon: <TrendingDown className="w-4 h-4" /> },
                { id: 'ranking',     label: 'Ranking de Faltas', icon: <TrendingDown className="w-4 h-4" /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setDashboardAba(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3.5 font-semibold transition text-sm whitespace-nowrap ${dashboardAba === tab.id ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-700'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {dashboardAba === 'metricas' && <ResumoGeral />}
          {dashboardAba === 'absenteismo' && <DashboardAbsenteismo initialPeople={initialPeople} operacoes={operacoes} cds={cds} filterCdExterno={filterCd} />}
          {dashboardAba === 'ranking'     && <RankingFaltas filterCdExterno={filterCd} />}
        </div>
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Atribuição Diária</h1>
            <p className="text-slate-400 text-xs mt-0.5">Gerencie e acompanhe as equipes e operações do dia.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input type="date" value={today} onChange={(e) => setToday(e.target.value)} className="bg-transparent text-sm text-slate-700 focus:outline-none" />
            </div>
            {dataTemRegistro && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">📁 Salvo</span>}
            <button onClick={handleSalvar} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">
              <Download className="w-4 h-4" /> Salvar
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition font-medium">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-semibold shadow-sm">
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Abas de CD — só para admin */}
      {cds.length > 1 && !cdBloqueado && (
        <div className="bg-white border-b border-slate-200 px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button onClick={() => setFilterCd('todos')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${filterCd === 'todos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              <Building2 className="w-4 h-4" />
              Todos os CDs
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filterCd === 'todos' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {initialPeople.filter(p => !p.em_recrutamento).length}
              </span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            {cds.map(cd => {
              const totalCd  = initialPeople.filter(p => p.cd === cd && !p.em_recrutamento).length;
              const faltasCd = (assignments.falta || []).filter(p => p.cd === cd && !isSuporte(p)).length;
              const isActive = filterCd === cd;
              return (
                <button key={cd} onClick={() => setFilterCd(cd)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                  <Building2 className="w-4 h-4" />
                  {cd}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{totalCd}</span>
                  {faltasCd > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">{faltasCd} falta{faltasCd > 1 ? 's' : ''}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Badge CD para usuário restrito */}
      {cdBloqueado && (
        <div className="bg-white border-b border-slate-200 px-6 py-2">
          <span className="inline-flex items-center gap-2 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
            <Building2 className="w-3.5 h-3.5" /> {filterCd}
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Presentes',    value: totalAtribuido,         sub: 'colaboradores', icon: '👥', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100'  },
            { label: 'Faltas',       value: faltasFiltradas.length, sub: 'colaboradores', icon: '❌', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'    },
            { label: 'Férias',       value: pessoasEmFerias.length, sub: 'colaboradores', icon: '🏖️', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
            { label: 'Recrutamento', value: totalRecrutamento,      sub: 'vagas abertas', icon: '🔍', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          ].map(card => (
            <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm">{card.label}</span>
                <span className="text-lg">{card.icon}</span>
              </div>
              <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-slate-400 text-xs mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-sm">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 relative min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Buscar por nome ou cargo..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterOperacao} onChange={(e) => setFilterOperacao(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="todas">Todas as operações</option>
              {operacoes.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition">
              <RotateCcw className="w-4 h-4" /> Restaurar
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Operações normais */}
            {opsNorm.filter(op => filterOperacao === 'todas' || op === filterOperacao).map(op => renderOperacaoBlock(op))}

            {/* Bloco NET */}
            {temNet && (filterOperacao === 'todas' || filterOperacao === OP_NET) && (
              <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedNetGroup(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 transition border-l-4 border-blue-600">
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform ${expandedNetGroup ? '' : '-rotate-90'}`} />
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-700 text-sm">NET</span>
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">{totalNetPessoas} pessoas</span>
                    <span className="text-xs text-blue-400">{areasNet.length} áreas</span>
                  </div>
                </button>
                {expandedNetGroup && (
                  <div className="divide-y divide-blue-100">
                    {areasNet.map((area) => {
                      const cor      = NET_AREA_CORES[area] || NET_AREA_COR_DEFAULT;
                      const nPessoas = contaPessoasNetArea(area);
                      return (
                        <div key={area}>
                          <button onClick={() => setExpandedNetAreas(prev => ({ ...prev, [area]: !prev[area] }))}
                            className={`w-full flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition border-l-4 ${cor.border}`}>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${expandedNetAreas[area] ? '' : '-rotate-90'}`} />
                            <span className={`font-bold text-sm ${cor.label}`}>{area}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cor.badge}`}>{nPessoas} pessoas</span>
                          </button>
                          {expandedNetAreas[area] && (
                            <div className={`px-4 pb-4 pt-3 ${cor.bg}`}>
                              {renderSetores(OP_NET, pessoasNetNoSetor, setoresPorNetArea, area)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUPORTE */}
            {filterOperacao === 'todas' && (
              <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedOps(prev => ({ ...prev, [OP_SUPORTE]: !prev[OP_SUPORTE] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition border-l-4 border-teal-500">
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedOps[OP_SUPORTE] ? '' : '-rotate-90'}`} />
                    <span className="font-bold text-teal-700 text-sm">SUPORTE</span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">{pessoasSuporte.length} pessoas</span>
                    <span className="text-xs text-slate-400 italic">não conta no absenteísmo</span>
                  </div>
                </button>
                {expandedOps[OP_SUPORTE] && (
                  <div className="border-t border-slate-100 p-4">
                    {pessoasSuporte.length === 0
                      ? <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma pessoa no SUPORTE.</p>
                      : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {setoresSuporte.map(setor => {
                            const pessoas    = pessoasSuporte.filter(p => p.setor === setor);
                            const vagasSetor = vagasFiltradas.filter(v => v.setor === setor && v.operacao === OP_SUPORTE);
                            return (
                              <div key={setor} className="bg-teal-50 rounded-lg border border-dashed border-teal-200 p-3 min-h-16">
                                <h3 className="font-bold text-slate-500 mb-2 pb-1 border-b border-teal-200 text-xs">{setor}</h3>
                                <div className="space-y-1.5">
                                  {pessoas.map(person => (
                                    <div key={person.id} onClick={() => handleClickColaborador(person)}
                                      className="bg-white border-l-4 border-teal-500 p-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer hover:shadow-sm transition">
                                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {person.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-slate-700 truncate">{person.name}</div>
                                        <div className="text-slate-400 truncate">{person.cargo}</div>
                                      </div>
                                    </div>
                                  ))}
                                  {vagasSetor.map(vaga => (
                                    <div key={`vaga-${vaga.id}`} className="bg-purple-50 p-2 rounded-lg border border-dashed border-purple-200 text-xs">
                                      <div className="font-semibold text-purple-600">🔍 Em Recrutamento</div>
                                      <div className="text-purple-400 truncate">{vaga.cargo}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Painel direito */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-3 sticky top-6">
            {/* Alertas */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-700 text-sm">Alertas do dia</span>
                </div>
                {faltasFiltradas.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{faltasFiltradas.length}</span>
                )}
              </div>
              <div onDragOver={(e) => handleDragOver(e, 'falta')} onDragLeave={handleDragLeave} onDrop={() => handleDrop('falta')}
                className={`p-3 min-h-20 transition-colors ${dragOver === 'falta' ? 'bg-red-50' : ''}`}>
                {faltasFiltradas.length === 0 ? (
                  <div className="text-center py-4">
                    <UserX className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Nenhuma falta registrada</p>
                    <p className="text-xs text-slate-300 mt-0.5">Arraste aqui para marcar falta</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {faltasSemObs.length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100 mb-2">
                        <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600 font-semibold">{faltasSemObs.length} sem observação</p>
                      </div>
                    )}
                    {filteredPeople(assignments.falta || []).map(person => (
                      <div key={person.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, person, 'falta')}
                        onDragEnd={() => setDraggedPerson(null)}
                        onClick={() => handleClickColaborador(person)}
                        className="bg-red-50 border border-red-100 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-sm transition text-xs flex items-center gap-2 select-none">
                        <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {person.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-red-800 truncate">{person.name}</div>
                          <div className="text-red-400 truncate">{person.cargo}</div>
                        </div>
                        {/* Botão remover falta */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoverFalta(person); }}
                          title="Desfazer falta"
                          className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-600 flex-shrink-0 transition font-bold text-xs">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Férias */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><span>🏖️</span><span className="font-bold text-slate-700 text-sm">Férias</span></div>
                <span className="bg-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pessoasEmFerias.length}</span>
              </div>
              <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto">
                {pessoasEmFerias.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-3">Nenhum em férias</p>
                  : pessoasEmFerias.map(person => (
                    <div key={person.id} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {person.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-orange-800 text-xs truncate">{person.name}</div>
                        <div className="text-orange-400 text-xs truncate">{person.operacao}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Licença */}
            {pessoasEmLicenca.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><span>👶</span><span className="font-bold text-slate-700 text-sm">Licença</span></div>
                  <span className="bg-purple-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pessoasEmLicenca.length}</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto">
                  {pessoasEmLicenca.map(person => (
                    <div key={person.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {person.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-purple-800 text-xs truncate">{person.name}</div>
                        <div className="text-purple-400 text-xs truncate">{person.operacao}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recrutamento */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><span>🔍</span><span className="font-bold text-slate-700 text-sm">Recrutamento</span></div>
                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalRecrutamento}</span>
              </div>
              <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto">
                {totalRecrutamento === 0
                  ? <p className="text-xs text-slate-400 italic text-center py-3">Nenhuma vaga aberta</p>
                  : vagasFiltradas.map(vaga => (
                    <div key={vaga.id} className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-xs">
                      <div className="font-semibold text-purple-700 truncate">{vaga.cargo}</div>
                      <div className="text-purple-400 truncate">{vaga.setor} · {vaga.operacao}</div>
                      {vaga.nome_anterior && <div className="text-purple-300 mt-0.5">Ant: {vaga.nome_anterior}</div>}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmarReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Restaurar atribuições?</h3>
            <p className="text-slate-500 text-sm mb-6">Recarrega os dados salvos para esta data.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmarReset(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-semibold text-sm">Cancelar</button>
              <button onClick={handleConfirmarReset} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm">Restaurar</button>
            </div>
          </div>
        </div>
      )}

      <ModalColaborador
        person={colaboradorSelecionado}
        isOpen={!!colaboradorSelecionado}
        onClose={() => {
          // Se veio do drag e fechou sem confirmar → devolve ao setor de origem
          if (abrirEmFalta && colaboradorSelecionado) {
            handleRemoverFalta(colaboradorSelecionado);
          }
          setColaboradorSelecionado(null);
          setAbrirEmFalta(false);
        }}
        onMarcarFalta={handleMarcarFalta}
        onMover={handleMoverColaborador}
        onLicenca={handleLicenca}
        setoresPorOperacao={setoresPorOperacao}
        operacoes={operacoes}
        abrirEmFalta={abrirEmFalta}
      />

      <ModalSalvar
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={handleConfirmarSalvar}
        assignments={assignments}
        justificativas={justificativas}
        onJustificativaChange={handleJustificativa}
        data={today}
        totalColaboradores={initialPeopleCd.filter(p => !p.em_recrutamento && !isSuporte(p)).length}
        emFerias={pessoasEmFerias}
        motivosFalta={motivosFalta}
        remanejados={
          Object.keys(assignments).filter(key => key !== 'falta').flatMap(key => {
            const [operacao, setor] = key.split('||');
            return (assignments[key] || [])
              .filter(p => (filterCd === 'todos' || p.cd === filterCd) && estaForaDaOrigem(p, operacao, setor))
              .map(p => ({
                ...p, setorAtual: setor, operacaoAtual: operacao,
                setorOrigem:    initialPeople.find(o => o.id === p.id)?.setor,
                operacaoOrigem: initialPeople.find(o => o.id === p.id)?.operacao,
              }));
          })
        }
      />
    </div>
  );
};

export default SectorAssignment;""