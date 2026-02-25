import React, { useState, useEffect } from 'react';
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
  const [dashPeriodo, setDashPeriodo] = useState('dia');
  const [dashDados, setDashDados] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

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
          const opsArray = [...new Set(data.map(p => p.operacao))].sort();
          setOperacoes(opsArray);
          initializeAssignments(data, opsArray);
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

  const initializeAssignments = (people = initialPeople, ops = operacoes) => {
    const init = { 'falta': [] };
    // Filtrar pessoas que NÃO estão de férias
    const pessoasAtivas = people.filter(p => !p.de_ferias);
    pessoasAtivas.forEach(person => {
      if (!init[person.setor]) {
        init[person.setor] = [];
      }
      init[person.setor].push(person);
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

  const handleDragOver = (e) => {
    e.preventDefault();
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
      Object.keys(assignments).forEach(setor => {
        if (setor !== 'falta' && assignments[setor]) {
          assignments[setor].forEach(person => {
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
    
    Object.keys(assignments).forEach(setor => {
      if (setor !== 'falta' && assignments[setor]) {
        assignments[setor].forEach(person => {
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
    const pessoasOp = initialPeople.filter(p => p.operacao === operacao);
    const faltasOp = assignments['falta']?.filter(p => p.operacao === operacao) || [];
    const absenteismo = pessoasOp.length > 0 ? ((faltasOp.length / pessoasOp.length) * 100).toFixed(1) : 0;
    return {
      total: pessoasOp.length,
      faltas: faltasOp.length,
      presentes: pessoasOp.length - faltasOp.length,
      absenteismo: parseFloat(absenteismo)
    };
  };

  const totalAtribuido = Object.keys(assignments)
    .filter(k => k !== 'falta')
    .reduce((sum, k) => sum + (assignments[k]?.length || 0), 0);

  const setoresPorOperacao = (operacao) => {
    return [...new Set(initialPeople
      .filter(p => p.operacao === operacao && p.setor !== 'Analista geral operação')
      .map(p => p.setor))]
      .sort();
  };

  // Retorna as pessoas que estão atualmente no setor (via assignments).
  // Inclui TODOS, independente de operação de origem (visitantes incluídos).
  const pessoasNoSetor = (setor) => {
    return (assignments[setor] || []);
  };

  // Para a contagem do header da operação: conta só pessoas cuja operação ORIGINAL é essa
  // (evita contar visitantes que vieram de outra operação)
  const pessoasOriginaisDaOperacaoNoSetor = (setor, operacao) => {
    return (assignments[setor] || []).filter(p => p.operacao === operacao);
  };

  // Verifica se a pessoa está fora do seu setor de origem
  const estaForaDaOrigem = (person, setorAtual) => {
    const origem = initialPeople.find(p => p.id === person.id);
    return origem && origem.setor !== setorAtual;
  };

  // Retorna pessoas do setor de origem que foram movidas para qualquer outro lugar
  // (para exibir o ghost card esmaecido no setor de origem)
  // Inclui pessoas que foram para FALTA também
  const pessoasAusentesDaOrigem = (setor) => {
    return initialPeople.filter(p => {
      // Só interessa quem é originalmente deste setor
      if (p.setor !== setor) return false;
      // Ghost aparece se NÃO está mais no setor de origem (mesmo que esteja em falta)
      const estaNoOrigem = assignments[setor]?.some(a => a.id === p.id);
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

  const getDashDateRange = (periodo) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (periodo === 'dia') {
      const d = hoje.toISOString().split('T')[0];
      return { inicio: d, fim: d };
    }
    if (periodo === 'semana') {
      const ini = new Date(hoje); ini.setDate(hoje.getDate() - hoje.getDay());
      const fim = new Date(hoje); fim.setDate(hoje.getDate() + (6 - hoje.getDay()));
      return { inicio: ini.toISOString().split('T')[0], fim: fim.toISOString().split('T')[0] };
    }
    if (periodo === 'mes') {
      const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return { inicio: ini.toISOString().split('T')[0], fim: fim.toISOString().split('T')[0] };
    }
  };

  const fetchDashDados = async (periodo, pessoas, ops) => {
    setDashLoading(true);
    try {
      const { inicio, fim } = getDashDateRange(periodo);
      const { data: faltasData } = await supabase
        .from('faltas_diarias')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim);
      const { data: presData } = await supabase
        .from('atribuicoes_diarias')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim);

      // Dias únicos com registro
      const diasUnicos = [...new Set([
        ...(faltasData || []).map(f => f.data),
        ...(presData || []).map(p => p.data)
      ])];
      const totalDias = diasUnicos.length || 1;

      const metricasPorOp = {};
      ops.forEach(op => {
        const pessoasOp = pessoas.filter(p => p.operacao === op);
        const faltasOp = (faltasData || []).filter(f => f.operacao === op);
        // Pessoas únicas que faltaram
        const pessoasComFalta = [...new Set(faltasOp.map(f => f.pessoa_id))];
        const totalFaltasDias = faltasOp.length; // total ocorrências
        const mediaFaltas = (totalFaltasDias / totalDias).toFixed(1);
        const absenteismo = pessoasOp.length > 0
          ? ((pessoasComFalta.length / pessoasOp.length) * 100).toFixed(1)
          : 0;
        metricasPorOp[op] = {
          total: pessoasOp.length,
          faltas: pessoasComFalta.length,
          presentes: pessoasOp.length - pessoasComFalta.length,
          mediaFaltas,
          absenteismo: parseFloat(absenteismo),
        };
      });

      const totalPessoas = pessoas.length;
      const todasFaltas = [...new Set((faltasData || []).map(f => f.pessoa_id))];
      setDashDados({
        metricasPorOp,
        totalPessoas,
        totalFaltas: todasFaltas.length,
        totalPresentes: totalPessoas - todasFaltas.length,
        absenteismoGeral: totalPessoas > 0 ? ((todasFaltas.length / totalPessoas) * 100).toFixed(1) : 0,
        totalDias,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'dashboard' && initialPeople.length > 0 && operacoes.length > 0) {
      fetchDashDados(dashPeriodo, initialPeople, operacoes);
    }
  }, [viewMode, dashPeriodo, initialPeople, operacoes]);

  if (viewMode === 'dashboard') {
    const periodos = [
      { label: 'Hoje', value: 'dia' },
      { label: 'Esta Semana', value: 'semana' },
      { label: 'Este Mês', value: 'mes' },
    ];
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

          {/* Filtro de Período */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-3 items-center">
            <span className="text-sm font-semibold text-slate-600 mr-2">Período:</span>
            {periodos.map(op => (
              <button
                key={op.value}
                onClick={() => setDashPeriodo(op.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  dashPeriodo === op.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {op.label}
              </button>
            ))}
            {dashLoading && <span className="text-sm text-slate-400 ml-2">Carregando...</span>}
          </div>

          {dashDados && !dashLoading ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {operacoes.map(operacao => {
                  const metricas = dashDados.metricasPorOp[operacao] || {};
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
                        {dashPeriodo !== 'dia' && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">Média de faltas/dia:</span>
                            <span className="font-semibold text-orange-600">{metricas.mediaFaltas}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-slate-200">
                          <span className="text-slate-600 text-sm">Absenteísmo:</span>
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
                    <div className="text-3xl font-bold text-blue-600">{dashDados.totalPessoas}</div>
                    <div className="text-sm text-slate-600 mt-1">Total de Pessoas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{dashDados.totalPresentes}</div>
                    <div className="text-sm text-slate-600 mt-1">Presentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{dashDados.totalFaltas}</div>
                    <div className="text-sm text-slate-600 mt-1">Com Falta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{dashDados.absenteismoGeral}%</div>
                    <div className="text-sm text-slate-600 mt-1">Absenteísmo Geral</div>
                  </div>
                </div>
              </div>
            </>
          ) : !dashLoading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-slate-500">
              Nenhum dado encontrado para o período selecionado.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Main Assignment View
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
                <span><span className="font-semibold text-red-600">{assignments['falta']?.length || 0}</span> falta(s)</span>
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

        <div className="space-y-4 mb-6">
          {operacoes
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
                      const todas = pessoasNoSetor(setor);
                      const semFalta = todas.filter(p =>
                        !assignments['falta']?.some(f => f.id === p.id)
                      );
                      const filtered = filteredPeople(semFalta);
                      const ghosts = pessoasAusentesDaOrigem(setor);
                      // Só oculta o setor se não tiver ninguém real E não tiver ghost
                      if (searchTerm && filtered.length === 0 && ghosts.length === 0) return null;

                      return (
                        <div
                          key={setor}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(setor)}
                          className="bg-blue-50 rounded-lg border-2 border-dashed border-blue-200 p-3 min-h-64"
                        >
                          <h3 className="font-bold text-slate-700 mb-2 pb-2 border-b-2 border-blue-300 text-xs line-clamp-2">
                            {setor}
                          </h3>
                          <h4 className="text-xs font-semibold text-blue-600 mb-2">
                            ({filtered.length})
                          </h4>
                          <div className="space-y-2">
                            {filtered.map(person => {
                              const visitante = estaForaDaOrigem(person, setor);
                              return (
                                <div
                                  key={person.id}
                                  draggable
                                  onDragStart={() => handleDragStart(person, setor)}
                                  title={visitante ? `${person.name} — veio de: ${initialPeople.find(p=>p.id===person.id)?.setor}` : person.name}
                                  className={`p-2 rounded cursor-move hover:shadow-md transition text-xs ${
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-red-50 rounded-lg shadow-md border-4 border-dashed border-red-300 p-4 sticky bottom-0">
          <h2 className="font-bold text-red-700 mb-3 text-lg">✖ FALTA ({filteredPeople(assignments['falta'])?.length || 0})</h2>
          <div
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('falta')}
            className="min-h-24"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filteredPeople(assignments['falta'])?.map(person => (
                <div
                  key={person.id}
                  draggable
                  onDragStart={() => handleDragStart(person, 'falta')}
                  className="bg-red-100 p-2 rounded border-l-3 border-red-500 cursor-move hover:shadow-md transition text-xs"
                >
                  <div className="font-semibold text-red-900 line-clamp-2">{person.name}</div>
                  <div className="text-red-700 text-xs mt-0.5">{person.cargo}</div>
                </div>
              ))}
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
        />
      </div>
    </div>
  );
};

export default SectorAssignment;