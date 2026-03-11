import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Download, RotateCcw, Users, ChevronDown, BarChart3, Search, Filter, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ModalSalvar from './ModalSalvar';

// Inicializar Supabase
const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';

const supabase = createClient(supabaseUrl, supabaseKey);

const SectorAssignment = () => {
  const [initialPeople, setInitialPeople] = useState([]);
  const [assignments, setAssignments] = useState(null);
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [justificativas, setJustificativas] = useState({});
  const [expandedOps, setExpandedOps] = useState({});
  const [viewMode, setViewMode] = useState('atribuir');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operacoes, setOperacoes] = useState([]);
  const [dragOver, setDragOver] = useState(null); // chave do setor com hover

  // ── Auto-scroll durante drag ──
  const scrollIntervalRef = useRef(null);
  const SCROLL_ZONE = 100;  // px da borda que ativa o scroll
  const SCROLL_SPEED = 12;  // px por tick

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const handleDragOverWindow = useCallback((e) => {
    const y = e.clientY;
    const h = window.innerHeight;
    stopAutoScroll();
    if (y < SCROLL_ZONE) {
      // Perto do topo → rola pra cima
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: -SCROLL_SPEED, behavior: 'instant' });
      }, 16);
    } else if (y > h - SCROLL_ZONE) {
      // Perto do fundo → rola pra baixo
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: SCROLL_SPEED, behavior: 'instant' });
      }, 16);
    }
  }, [stopAutoScroll]);

  useEffect(() => {
    window.addEventListener('dragover', handleDragOverWindow);
    window.addEventListener('dragend', stopAutoScroll);
    window.addEventListener('drop', stopAutoScroll);
    return () => {
      window.removeEventListener('dragover', handleDragOverWindow);
      window.removeEventListener('dragend', stopAutoScroll);
      window.removeEventListener('drop', stopAutoScroll);
      stopAutoScroll();
    };
  }, [handleDragOverWindow, stopAutoScroll]);

  // Buscar dados do Supabase
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pessoas')
          .select('*')
          .order('operacao', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setInitialPeople(data);
          // Exclui ANALISTA GERAL e SUPORTE da lista de operações normais
          const sorted = [...new Set(data.map(p => p.operacao))]
            .filter(op => op !== 'ANALISTA GERAL' && op !== 'SUPORTE')
            .sort();
          const idx = sorted.indexOf('COMPARTILHADO');
          if (idx > -1) { sorted.splice(idx, 1); sorted.push('COMPARTILHADO'); }
          setOperacoes(sorted);
          initializeAssignments(data, sorted);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, []);

  const makeKey = (op, st) => `${op}||${st}`;
  const vagas = initialPeople.filter(p => p.em_recrutamento);

  // Constante para operação de suporte (não conta no absenteísmo)
  const OP_SUPORTE = 'SUPORTE';

  const isSuporte = (p) => p.operacao === OP_SUPORTE;

  const initializeAssignments = (people = initialPeople, ops = operacoes) => {
    const init = { 'falta': [] };
    // SUPORTE entra no mapa de assignments mas NÃO pode ir para a zona de falta
    const pessoasAtivas = people.filter(p => !p.de_ferias && p.operacao !== 'ANALISTA GERAL' && !p.em_recrutamento);
    pessoasAtivas.forEach(person => {
      const key = makeKey(person.operacao, person.setor);
      if (!init[key]) init[key] = [];
      init[key].push(person);
    });
    setAssignments(init);
    const expandAll = {};
    ops.forEach(op => expandAll[op] = true);
    setExpandedOps(expandAll);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-slate-600 text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-lg border-2 border-red-300">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700 font-semibold mb-2">Erro ao conectar</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (assignments === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-slate-600 text-lg">Inicializando...</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (person, source) => {
    setDraggedPerson({ person, source });
  };

  const handleDragOver = (e, key) => {
    e.preventDefault();
    setDragOver(key);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (target) => {
    if (!draggedPerson) return;
    const { person, source } = draggedPerson;
    setAssignments(prev => {
      const newAssignments = { ...prev };
      newAssignments[source] = newAssignments[source].filter(p => p.id !== person.id);
      if (!newAssignments[target]) {
        newAssignments[target] = [];
      }
      newAssignments[target] = [...newAssignments[target], person];
      return newAssignments;
    });
    setDraggedPerson(null);
    setDragOver(null);
    stopAutoScroll();
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar todas as atribuições?')) {
      initializeAssignments();
      setJustificativas({});
    }
  };

  const handleJustificativa = (personId, texto) => {
    setJustificativas(prev => ({
      ...prev,
      [personId]: texto
    }));
  };

  const handleSalvar = async () => {
    setModalAberto(true);
  };

  const handleConfirmarSalvar = async (justificativasFinais, planoAcao) => {
    setSalvando(true);
    try {
      const atribuicoes = [];
      Object.keys(assignments).forEach(key => {
        if (key !== 'falta' && assignments[key]) {
          const setor = key.includes('||') ? key.split('||')[1] : key;
          assignments[key].forEach(person => {
            atribuicoes.push({
              data: today,
              pessoa_id: person.id,
              pessoa_nome: person.name,
              setor: setor,
              operacao: person.operacao,
              cargo: person.cargo,
              area: person.area
            });
          });
        }
      });

      const faltas = [];
      if (assignments['falta'] && assignments['falta'].length > 0) {
        assignments['falta'].forEach(person => {
          faltas.push({
            data: today,
            pessoa_id: person.id,
            pessoa_nome: person.name,
            cargo: person.cargo,
            operacao: person.operacao,
            justificativa: justificativasFinais[person.id] || '',
            plano_acao: planoAcao
          });
        });
      }

      await supabase.from('atribuicoes_diarias').delete().eq('data', today);
      await supabase.from('faltas_diarias').delete().eq('data', today);

      if (atribuicoes.length > 0) {
        const { error: atribError } = await supabase
          .from('atribuicoes_diarias')
          .insert(atribuicoes);
        if (atribError) throw atribError;
      }

      if (faltas.length > 0) {
        const { error: faltaError } = await supabase
          .from('faltas_diarias')
          .insert(faltas);
        if (faltaError) throw faltaError;
      }

      setJustificativas(justificativasFinais);
      alert('✓ Dados salvos com sucesso para ' + today);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSalvando(false);
      setModalAberto(false);
    }
  };

  const handleExport = () => {
    let csv = 'Data,Operação,Setor,Nome,Cargo,Area\n';
    
    Object.keys(assignments).forEach(key => {
      if (key !== 'falta' && assignments[key]) {
        const setor = key.includes('||') ? key.split('||')[1] : key;
        assignments[key].forEach(person => {
          const escapedName = `"${person.name.replace(/"/g, '""')}"`;
          const escapedSetor = `"${setor.replace(/"/g, '""')}"`;
          const escapedCargo = `"${person.cargo.replace(/"/g, '""')}"`;
          const escapedArea = `"${person.area.replace(/"/g, '""')}"`;
          const escapedOp = `"${person.operacao.replace(/"/g, '""')}"`;
          csv += `${today},${escapedOp},${escapedSetor},${escapedName},${escapedCargo},${escapedArea}\n`;
        });
      }
    });

    if (assignments['falta'] && assignments['falta'].length > 0) {
      csv += '\n\nFALTAS\nData,Nome,Cargo,Area,Operação,Justificativa\n';
      assignments['falta'].forEach(person => {
        const justificativa = justificativas[person.id] || '';
        const escapedName = `"${person.name.replace(/"/g, '""')}"`;
        const escapedCargo = `"${person.cargo.replace(/"/g, '""')}"`;
        const escapedArea = `"${person.area.replace(/"/g, '""')}"`;
        const escapedOp = `"${person.operacao.replace(/"/g, '""')}"`;
        const escapedJustificativa = `"${justificativa.replace(/"/g, '""')}"`;
        csv += `${today},${escapedName},${escapedCargo},${escapedArea},${escapedOp},${escapedJustificativa}\n`;
      });
    }

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `atribuicao_${today.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMetricasOperacao = (operacao) => {
    // SUPORTE não entra em métricas de absenteísmo
    const pessoasOp = initialPeople.filter(p => p.operacao === operacao && !isSuporte(p));
    const faltasOp = assignments['falta']?.filter(p => p.operacao === operacao && !isSuporte(p)) || [];
    const absenteismo = pessoasOp.length > 0 ? ((faltasOp.length / pessoasOp.length) * 100).toFixed(1) : 0;
    return {
      total: pessoasOp.length,
      faltas: faltasOp.length,
      presentes: pessoasOp.length - faltasOp.length,
      absenteismo: parseFloat(absenteismo)
    };
  };

  // totalAtribuido exclui pessoas de SUPORTE
  const totalAtribuido = Object.keys(assignments)
    .filter(k => k !== 'falta')
    .reduce((sum, k) => sum + (assignments[k]?.filter(p => !isSuporte(p)).length || 0), 0);

  // pessoas de suporte separadas
  const pessoasSuporte = initialPeople.filter(p => p.operacao === OP_SUPORTE && !p.de_ferias && !p.em_recrutamento);
  const setoresSuporte = [...new Set(pessoasSuporte.map(p => p.setor))].sort();

  const setoresPorOperacao = (operacao) => {
    const setores = [...new Set(initialPeople
      .filter(p => p.operacao === operacao && p.setor !== 'Analista geral operação')
      .map(p => p.setor))]
      .sort();
    const idx = setores.indexOf('COMPARTILHADO');
    if (idx > -1) { setores.splice(idx, 1); setores.push('COMPARTILHADO'); }
    return setores;
  };

  const pessoasNoSetor = (operacao, setor) => {
    return (assignments[makeKey(operacao, setor)] || []);
  };

  const pessoasOriginaisDaOperacaoNoSetor = (setor, operacao) => {
    return (assignments[makeKey(operacao, setor)] || []);
  };

  const estaForaDaOrigem = (person, operacaoAtual, setorAtual) => {
    const origem = initialPeople.find(p => p.id === person.id);
    return origem && (origem.setor !== setorAtual || origem.operacao !== operacaoAtual);
  };

  const pessoasAusentesDaOrigem = (operacao, setor) => {
    const key = makeKey(operacao, setor);
    return initialPeople.filter(p => {
      if (p.setor !== setor || p.operacao !== operacao) return false;
      const estaNoOrigem = assignments[key]?.some(a => a.id === p.id);
      return !estaNoOrigem;
    });
  };

  const filteredPeople = (people) => {
    if (!people) return [];
    if (!searchTerm) return people;
    return people.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Dashboard View
  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-slate-800">Dashboard de Operações</h1>
            </div>
            <button
              onClick={() => setViewMode('atribuir')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ← Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {operacoes.filter(op => op !== OP_SUPORTE).map(operacao => {
              const metricas = getMetricasOperacao(operacao);
              return (
                <div key={operacao} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                  <h3 className="font-bold text-slate-800 mb-4">{operacao}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Total:</span>
                      <span className="font-semibold text-slate-800">{metricas.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Presentes:</span>
                      <span className="font-semibold text-green-600">{metricas.presentes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Faltas:</span>
                      <span className="font-semibold text-red-600">{metricas.faltas}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <span className="text-slate-600 text-sm">Absenteismo:</span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-red-500"
                            style={{ width: `${metricas.absenteismo}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800">{metricas.absenteismo}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-bold text-slate-800 mb-4">Resumo Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{initialPeople.filter(p => !isSuporte(p)).length}</div>
                <div className="text-sm text-slate-600 mt-1">Total (sem Suporte)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalAtribuido}</div>
                <div className="text-sm text-slate-600 mt-1">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{assignments['falta']?.filter(p => !isSuporte(p)).length || 0}</div>
                <div className="text-sm text-slate-600 mt-1">Faltas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {(() => {
                    const totalSemSuporte = initialPeople.filter(p => !isSuporte(p)).length;
                    const faltasSemSuporte = assignments['falta']?.filter(p => !isSuporte(p)).length || 0;
                    return totalSemSuporte > 0 ? ((faltasSemSuporte / totalSemSuporte) * 100).toFixed(1) : '0.0';
                  })()}%
                </div>
                <div className="text-sm text-slate-600 mt-1">Absenteismo Geral</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Assignment View
  const pessoasEmFerias = initialPeople.filter(p => p.de_ferias);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Atribuição Diária</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={today}
              onChange={(e) => setToday(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span><span className="font-semibold text-blue-600">{totalAtribuido}</span> presentes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                <span><span className="font-semibold text-red-600">{assignments['falta']?.filter(p => !isSuporte(p)).length || 0}</span> falta(s)</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSalvar}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <select
                value={filterOperacao}
                onChange={(e) => setFilterOperacao(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas Operações</option>
                {operacoes.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>
        </div>


        {/* Layout principal: operações (esq) + painel lateral (dir) */}
        <div className="flex gap-4 items-start">

          {/* Coluna esquerda: operações */}
          <div className="flex-1 min-w-0 space-y-4">
            {operacoes
              .filter(op => op !== 'ANALISTA GERAL')
              .filter(op => filterOperacao === 'todas' || op === filterOperacao)
              .map(operacao => (
              <div key={operacao} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedOps(prev => ({ ...prev, [operacao]: !prev[operacao] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-l-4 border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${expandedOps[operacao] ? '' : '-rotate-90'}`}
                    />
                    <span className="font-bold text-slate-700">{operacao}</span>
                    {/* Conta apenas pessoas cuja operação original é essa (exclui visitantes e faltas) */}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {setoresPorOperacao(operacao).reduce((sum, setor) => {
                        const daqui = pessoasOriginaisDaOperacaoNoSetor(setor, operacao);
                        const semFalta = daqui.filter(p =>
                          !assignments['falta']?.some(f => f.id === p.id)
                        );
                        return sum + filteredPeople(semFalta).length;
                      }, 0)} pessoas
                    </span>
                  </div>
                </button>

                {expandedOps[operacao] && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {setoresPorOperacao(operacao).map(setor => {
                        // Todos que estão no setor agora (incluindo visitantes de outras ops)
                        const todas = pessoasNoSetor(operacao, setor);
                        const semFalta = todas.filter(p =>
                          !assignments['falta']?.some(f => f.id === p.id)
                        );
                        const filtered = filteredPeople(semFalta);
                        const ghosts = pessoasAusentesDaOrigem(operacao, setor);
                        // Só oculta o setor se não tiver ninguém real E não tiver ghost
                        if (searchTerm && filtered.length === 0 && ghosts.length === 0) return null;

                        return (
                          <div
                            key={setor}
                            onDragOver={(e) => handleDragOver(e, makeKey(operacao, setor))}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(makeKey(operacao, setor))}
                            className={`rounded-lg border-2 border-dashed p-3 min-h-64 transition-colors ${
                              dragOver === makeKey(operacao, setor)
                                ? 'bg-blue-100 border-blue-500 shadow-inner'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <h3 className="font-bold text-slate-700 mb-2 pb-2 border-b-2 border-blue-300 text-xs line-clamp-2">
                              {setor}
                            </h3>
                            <h4 className="text-xs font-semibold text-blue-600 mb-2">
                              ({filtered.length})
                            </h4>
                            <div className="space-y-2">
                              {filtered.map(person => {
                                const visitante = estaForaDaOrigem(person, operacao, setor);
                                return (
                                  <div
                                    key={person.id}
                                    draggable
                                    onDragStart={() => handleDragStart(person, makeKey(operacao, setor))}
                                    title={visitante ? `${person.name} — veio de: ${initialPeople.find(p=>p.id===person.id)?.setor}` : person.name}
                                    className={`p-2 rounded cursor-grab active:cursor-grabbing hover:shadow-md active:opacity-50 active:scale-95 transition-all text-xs ${
                                      visitante
                                        ? 'bg-amber-50 border-l-4 border-amber-400 border border-amber-200'
                                        : 'bg-white border-l-4 border-blue-500'
                                    }`}
                                  >
                                    <div className="font-semibold text-slate-800 line-clamp-2">{person.name}</div>
                                    <div className="text-slate-600 text-xs mt-0.5 line-clamp-1">{person.cargo}</div>
                                    {visitante && (
                                      <div className="text-amber-600 text-xs mt-0.5 font-medium">↪ remanejado</div>
                                    )}
                                  </div>
                                );
                              })}
                              {/* Ghost cards: pessoas que saíram do setor de origem */}
                              {ghosts.map(person => (
                                <div
                                  key={`ghost-${person.id}`}
                                  title={`${person.name} está em outro setor`}
                                  className="bg-white p-2 rounded border-l-4 border-blue-300 text-xs opacity-50 select-none"
                                  style={{ borderStyle: 'dashed' }}
                                >
                                  <div className="font-semibold text-slate-600 line-clamp-2">{person.name}</div>
                                  <div className="text-slate-500 text-xs mt-0.5 line-clamp-1 italic">deslocado</div>
                                </div>
                              ))}
                              {/* Vagas em Recrutamento */}
                              {vagas
                                .filter(v => v.setor === setor && v.operacao === operacao)
                                .map(vaga => (
                                  <div
                                    key={`vaga-${vaga.id}`}
                                    className="bg-purple-50 p-2 rounded border-2 border-dashed border-purple-400 text-xs"
                                  >
                                    <div className="font-semibold text-purple-700 line-clamp-2">🔍 Em Recrutamento</div>
                                    <div className="text-purple-600 text-xs mt-0.5 line-clamp-1">{vaga.cargo}</div>
                                    {vaga.nome_anterior && <div className="text-purple-500 text-xs mt-0.5">Ant: {vaga.nome_anterior}</div>}
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ── Bloco SUPORTE — sempre visível, não conta no absenteísmo ── */}
            {filterOperacao === 'todas' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedOps(prev => ({ ...prev, [OP_SUPORTE]: !prev[OP_SUPORTE] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-l-4 border-teal-500"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${expandedOps[OP_SUPORTE] ? '' : '-rotate-90'}`}
                    />
                    <span className="font-bold text-teal-700">SUPORTE</span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                      {pessoasSuporte.length} pessoas
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full italic">
                      não conta no absenteísmo
                    </span>
                  </div>
                </button>
                {expandedOps[OP_SUPORTE] && (
                  <div className="border-t border-slate-200 p-4">
                    {pessoasSuporte.length === 0 ? (
                      <p className="text-sm text-slate-400 italic text-center py-4">
                        Nenhuma pessoa cadastrada com operação "SUPORTE" ainda.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {setoresSuporte.map(setor => {
                          const pessoas = pessoasSuporte.filter(p => p.setor === setor);
                          return (
                            <div key={setor} className="bg-teal-50 rounded-lg border-2 border-dashed border-teal-200 p-3 min-h-24">
                              <h3 className="font-bold text-slate-700 mb-2 pb-2 border-b-2 border-teal-300 text-xs line-clamp-2">{setor}</h3>
                              <h4 className="text-xs font-semibold text-teal-600 mb-2">({pessoas.length})</h4>
                              <div className="space-y-2">
                                {pessoas.map(person => (
                                  <div key={person.id} className="bg-white border-l-4 border-teal-500 p-2 rounded text-xs select-none" title={`${person.name} — Suporte`}>
                                    <div className="font-semibold text-slate-800 line-clamp-2">{person.name}</div>
                                    <div className="text-slate-600 text-xs mt-0.5 line-clamp-1">{person.cargo}</div>
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

          {/* Painel lateral direito: Faltas / Férias / Em Recrutamento */}
          <div className="w-56 flex-shrink-0 flex flex-col gap-4 sticky top-20">

            {/* FALTAS */}
            <div className="bg-red-50 rounded-lg shadow-md border-2 border-dashed border-red-300 overflow-hidden">
              <div className="bg-red-500 px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-white text-sm">✖ FALTAS</span>
                <span className="bg-red-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {filteredPeople(assignments['falta'])?.length || 0}
                </span>
              </div>
              <div
                onDragOver={(e) => handleDragOver(e, 'falta')}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop('falta')}
                className={`p-2 min-h-24 space-y-1 transition-colors rounded-b-lg ${
                  dragOver === 'falta' ? 'bg-red-100' : ''
                }`}
              >
                {(filteredPeople(assignments['falta'])?.length === 0) && (
                  <p className="text-xs text-red-300 italic text-center mt-4">Arraste aqui</p>
                )}
                {filteredPeople(assignments['falta'])?.map(person => (
                  <div
                    key={person.id}
                    draggable
                    onDragStart={() => handleDragStart(person, 'falta')}
                    className="bg-white border-l-4 border-red-500 p-2 rounded cursor-grab active:cursor-grabbing active:opacity-50 active:scale-95 hover:shadow-md transition-all text-xs"
                  >
                    <div className="font-semibold text-red-900 line-clamp-2">{person.name}</div>
                    <div className="text-red-600 text-xs mt-0.5 line-clamp-1">{person.cargo}</div>
                    <div className="text-red-400 text-xs mt-0.5 line-clamp-1 italic">{person.operacao}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FÉRIAS */}
            <div className="bg-orange-50 rounded-lg shadow-md border-2 border-orange-200 overflow-hidden">
              <div className="bg-orange-400 px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-white text-sm">🏖️ FÉRIAS</span>
                <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pessoasEmFerias.length}
                </span>
              </div>
              <div className="p-2 min-h-16 space-y-1">
                {pessoasEmFerias.length === 0 && (
                  <p className="text-xs text-orange-300 italic text-center mt-4">Nenhum em férias</p>
                )}
                {pessoasEmFerias.map(person => (
                  <div
                    key={person.id}
                    className="bg-white border-l-4 border-orange-400 p-2 rounded text-xs select-none"
                  >
                    <div className="font-semibold text-orange-900 line-clamp-2">{person.name}</div>
                    <div className="text-orange-600 text-xs mt-0.5 line-clamp-1">{person.cargo}</div>
                    <div className="text-orange-400 text-xs mt-0.5 line-clamp-1 italic">{person.operacao}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* EM RECRUTAMENTO */}
            <div className="bg-purple-50 rounded-lg shadow-md border-2 border-purple-200 overflow-hidden">
              <div className="bg-purple-500 px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-white text-sm">🔍 RECRUTAMENTO</span>
                <span className="bg-purple-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {vagas.length}
                </span>
              </div>
              <div className="p-2 min-h-16 space-y-1">
                {vagas.length === 0 && (
                  <p className="text-xs text-purple-300 italic text-center mt-4">Nenhuma vaga aberta</p>
                )}
                {vagas.map(vaga => (
                  <div
                    key={vaga.id}
                    className="bg-white border-l-4 border-purple-400 p-2 rounded text-xs select-none"
                  >
                    <div className="font-semibold text-purple-900 line-clamp-2">{vaga.cargo}</div>
                    <div className="text-purple-600 text-xs mt-0.5 line-clamp-1">{vaga.setor}</div>
                    <div className="text-purple-400 text-xs mt-0.5 line-clamp-1 italic">{vaga.operacao}</div>
                    {vaga.nome_anterior && (
                      <div className="text-purple-400 text-xs mt-0.5">Ant: {vaga.nome_anterior}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* MODAL SALVAR */}
        <ModalSalvar
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          onConfirm={handleConfirmarSalvar}
          assignments={assignments}
          justificativas={justificativas}
          onJustificativaChange={handleJustificativa}
          data={today}
          totalColaboradores={initialPeople.length}
          emFerias={initialPeople.filter(p => p.de_ferias)}
          remanejados={
            Object.keys(assignments)
              .filter(key => key !== 'falta')
              .flatMap(key => {
                const [operacao, setor] = key.split('||');
                return (assignments[key] || []).filter(p => estaForaDaOrigem(p, operacao, setor)).map(p => ({
                  ...p,
                  setorAtual: setor,
                  operacaoAtual: operacao,
                  setorOrigem: initialPeople.find(o => o.id === p.id)?.setor,
                  operacaoOrigem: initialPeople.find(o => o.id === p.id)?.operacao,
                }));
              })
          }
        />
      </div>
    </div>
  );
};

export default SectorAssignment;