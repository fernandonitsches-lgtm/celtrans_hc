import React, { useState, useEffect } from 'react';
import { Calendar, Download, RotateCcw, Users, ChevronDown, BarChart3, Search, Filter, History, AlertCircle, TrendingUp } from 'lucide-react';

const SectorAssignment = () => {
  const initialPeople = [
    { id: 1, name: 'VITOR RAFAEL MENDES DE OLIVEIRA', cargo: 'ANALISTA OPERACIONAL JUNIOR', area: 'CLARO MÓVEL (MARIANA)', setor: 'Analista geral operação', operacao: 'ANALISTA GERAL' },
    { id: 2, name: 'LUCIANO FERREIRA DA SILVA', cargo: 'ANALISTA OPERACIONAL SENIOR', area: 'CLARO MÓVEL (MARIANA)', setor: 'Analista geral operação', operacao: 'ANALISTA GERAL' },
    { id: 3, name: 'ANTONIA JAQUELINE LOPES DOS SANTOS', cargo: 'OPERADOR I', area: 'CLARO MÓVEL (MARIANA)', setor: 'Separação/atendimento', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 4, name: 'CAROLINA SIMAO DA COSTA', cargo: 'OPERADOR I', area: 'CLARO MÓVEL (MARIANA)', setor: 'Faturamento Ovs/ faturamento MKT', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 5, name: 'FABIANO JUNIOR DOS SANTOS', cargo: 'ASSISTENTE OPERACIONAL', area: 'CLARO MÓVEL (MARIANA)', setor: 'Reversa', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 6, name: 'IARA PEREIRA DOS SANTOS', cargo: 'OPERADOR I', area: 'CLARO MÓVEL (MARIANA)', setor: 'Separação/atendimento', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 7, name: 'JENYFER LORRAINE DA SILVA BARBOSA', cargo: 'OPERADOR I', area: 'CLARO MÓVEL (MARIANA)', setor: 'Conferência/Transporte/expedição', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 8, name: 'MARIANA CRISTINA GERALDA DA SILVA ROSA', cargo: 'LIDER', area: 'CLARO MÓVEL (MARIANA)', setor: 'Liderança', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 9, name: 'THIAGO CONCESSO DE SOUZA', cargo: 'OPERADOR I', area: 'CLARO MÓVEL (MARIANA)', setor: 'Recebimento/Separação', operacao: 'CLARO MÓVEL (MARIANA)' },
    { id: 10, name: 'GILVAM APARECIDO CARDOSO', cargo: 'OPERADOR ESPECIALIZADO', area: 'EBT (DOUGLAS)', setor: 'Recebimento/Reversa', operacao: 'EBT (DOUGLAS)' },
    { id: 11, name: 'MATHEUS PAULA DE SOUZA', cargo: 'OPERADOR II', area: 'EBT (DOUGLAS)', setor: 'Separação/atendimento', operacao: 'EBT (DOUGLAS)' },
    { id: 12, name: 'DOUGLAS ALVES DIAS', cargo: 'LIDER', area: 'EBT/OMR (DOUGLAS)', setor: 'Liderança', operacao: 'EBT (DOUGLAS)' },
    { id: 13, name: 'ITALO GABRIEL DOS SANTOS MACHADO', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Expedição', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 14, name: 'YASMIN LAISSE ROSA DOS SANTOS', cargo: 'ASSISTENTE OPERACIONAL', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Faturamento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 15, name: 'GERLAN DOS SANTOS LIMA', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Inventário rotativo', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 16, name: 'WALISON LUCAS EZEQUIEL ALVES DA SILVA', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Inventário rotativo', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 17, name: 'THIAGO GOMES REZENDE', cargo: 'LIDER II', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Liderança', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 18, name: 'MARIANA CAEIRO FERNANDES', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Recebimento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 19, name: 'WELLINGTON FABRICIO DOS SANTOS', cargo: 'OPERADOR II', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Recebimento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 20, name: 'JUVANIA GONÇALVES DOS SANTOS GOMES', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 21, name: 'PABLO DE LIMA MATOS', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 22, name: 'PATRICK JORDAN DE SOUZA', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 23, name: 'JOSMANN ROBERTO COSTA', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 24, name: 'FERNANDO MARTINS RODRIGUES DA SILVA', cargo: 'OPERADOR I', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Separação/atendimento (Udef)', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 25, name: 'ANA ELOIZA ALVES SILVA', cargo: 'ASSISTENTE OPERACIONAL', area: 'NET MISCELÂNEA (THIAGO G.)', setor: 'Transporte', operacao: 'NET MISCELÂNEA (THIAGO G.)' },
    { id: 26, name: 'ANA PAULA RODRIGUES SILVA', cargo: 'OPERADOR I', area: 'NET REVERSA (STEPHANY)', setor: 'Recebimento/Consolidação acessório', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 27, name: 'DECIA LARA MALVEIRA', cargo: 'OPERADOR II', area: 'NET REVERSA (STEPHANY)', setor: 'listagem', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 28, name: 'FLAVIA DE MARILAC SOUSA DE LELIS', cargo: 'OPERADOR I', area: 'NET REVERSA (STEPHANY)', setor: 'listagem', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 29, name: 'JACKSON JULIANO GUIMARÃES ARAÚJO', cargo: 'OPERADOR I', area: 'NET REVERSA (STEPHANY)', setor: 'Tratativa', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 30, name: 'JOAO GABRIEL DOS SANTOS RIBEIRO', cargo: 'ASSISTENTE OPERACIONAL', area: 'NET REVERSA (STEPHANY)', setor: 'Tratativa', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 31, name: 'SHAYENE DOS SANTOS JARDIM', cargo: 'ASSISTENTE OPERACIONAL', area: 'NET REVERSA (STEPHANY)', setor: 'listagem', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 32, name: 'STEPHANY RAYANNE RODRIGUES DA CUNHA', cargo: 'LIDER', area: 'NET REVERSA (STEPHANY)', setor: 'Liderança', operacao: 'NET REVERSA (STEPHANY)' },
    { id: 33, name: 'RENATO SOUZA DE JESUS', cargo: 'OPERADOR II', area: 'NET TERMINAL (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET TERMINAL (THIAGO G.)' },
    { id: 34, name: 'GUSTAVO SILVA', cargo: 'OPERADOR I', area: 'NET TERMINAL (THIAGO G.)', setor: 'Separação acessório/atendimento', operacao: 'NET TERMINAL (THIAGO G.)' },
    { id: 35, name: 'LILIA CRISTINA PATRICIO DOS SANTOS', cargo: 'OPERADOR I', area: 'NET TERMINAL (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET TERMINAL (THIAGO G.)' },
    { id: 36, name: 'MARYLLEN TALITA ELEOTERIO TEIXEIRA', cargo: 'OPERADOR I', area: 'NET TERMINAL (THIAGO G.)', setor: 'Listagem/recebimento', operacao: 'NET TERMINAL (THIAGO G.)' },
    { id: 37, name: 'PAULA RIBEIRO DIAS', cargo: 'OPERADOR I', area: 'NET TERMINAL (THIAGO G.)', setor: 'Separação/atendimento', operacao: 'NET TERMINAL (THIAGO G.)' },
    { id: 38, name: 'THAMIRES VALDEMIRO ALVES', cargo: 'OPERADOR I', area: 'NET TERMINAL (THIAGO G.)', setor: 'Listagem/recebimento', operacao: 'NET TERMINAL (THIAGO G.)' },
    { id: 39, name: 'ANDERSON JOSÉ RIBEIRO SOUZA', cargo: 'OPERADOR I', area: 'OMR (DOUGLAS)', setor: 'Separação/atendimento/faturamento', operacao: 'OMR (DOUGLAS)' },
    { id: 40, name: 'MATHEUS MORAIS DE PAULA', cargo: 'ASSISTENTE OPERACIONAL', area: 'OMR (DOUGLAS)', setor: 'Recebimento/Reversa', operacao: 'OMR (DOUGLAS)' },
    { id: 41, name: 'WILLIAM FERNANDO DE OLIVEIRA', cargo: 'ASSISTENTE OPERACIONAL', area: 'OMR (DOUGLAS)', setor: 'Envio para reparo', operacao: 'OMR (DOUGLAS)' },
    { id: 42, name: 'ENIL DE PINHO COSTA', cargo: 'OPERADOR DE EMPILHADEIRA', area: 'OPERADOR DE EMPILHADEIRA', setor: 'Operar Empilhadeira', operacao: 'COMPARTILHADO' },
  ];

  const operacoes = [...new Set(initialPeople.map(p => p.operacao))].sort();
  const analistasGerais = initialPeople.filter(p => p.setor === 'Analista geral operação');
  const [assignments, setAssignments] = useState({});
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [justificativas, setJustificativas] = useState({});
  const [expandedOps, setExpandedOps] = useState({});
  const [viewMode, setViewMode] = useState('atribuir');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [historyData, setHistoryData] = useState([]);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Carrega dados salvos
  useEffect(() => {
    loadData();
  }, [today]);

  // Inicializa atribuições
  useEffect(() => {
    if (Object.keys(assignments).length === 0) {
      initializeAssignments();
    }
  }, []);

  const loadData = async () => {
    try {
      const saved = await window.storage.get(`assignment-${today}`);
      if (saved && saved.value) {
        const data = JSON.parse(saved.value);
        setAssignments(data.assignments);
        setJustificativas(data.justificativas || {});
        setHasUnsavedChanges(false);
      } else {
        initializeAssignments();
      }
    } catch (error) {
      initializeAssignments();
    }
    
    loadHistory();
  };

  const loadHistory = async () => {
    try {
      const historyResult = await window.storage.list('assignment-');
      if (historyResult && historyResult.keys) {
        const dates = historyResult.keys
          .map(key => key.replace('assignment-', ''))
          .sort()
          .reverse();
        setHistoryData(dates);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const saveData = async () => {
    try {
      const data = {
        assignments,
        justificativas,
        timestamp: new Date().toISOString()
      };
      await window.storage.set(`assignment-${today}`, JSON.stringify(data));
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return false;
    }
  };

  const initializeAssignments = () => {
    const init = { 'falta': [] };
    initialPeople.forEach(person => {
      if (!init[person.setor]) {
        init[person.setor] = [];
      }
      init[person.setor].push(person);
    });
    setAssignments(init);
    const expandAll = {};
    operacoes.forEach(op => expandAll[op] = true);
    setExpandedOps(expandAll);
  };

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
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar todas as atribuições?')) {
      initializeAssignments();
      setJustificativas({});
      setHasUnsavedChanges(true);
    }
  };

  const handleJustificativa = (personId, texto) => {
    setJustificativas(prev => ({
      ...prev,
      [personId]: texto
    }));
    setHasUnsavedChanges(true);
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
    const csvWithBom = bom + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
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

  const loadHistoryDate = async (date) => {
    try {
      const saved = await window.storage.get(`assignment-${date}`);
      if (saved && saved.value) {
        const data = JSON.parse(saved.value);
        setSelectedHistoryDate(date);
        return data;
      }
    } catch (error) {
      console.error('Erro ao carregar data:', error);
    }
    return null;
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

  const pessoasDoSetorNaOperacao = (setor, operacao) => {
    return assignments[setor]?.filter(p => p.operacao === operacao) || [];
  };

  const filteredPeople = (people) => {
    if (!people) return [];
    let filtered = people;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cargo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
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
            {operacoes.map(operacao => {
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
                <div className="text-3xl font-bold text-blue-600">{initialPeople.length}</div>
                <div className="text-sm text-slate-600 mt-1">Total de Pessoas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalAtribuido}</div>
                <div className="text-sm text-slate-600 mt-1">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{assignments['falta']?.length || 0}</div>
                <div className="text-sm text-slate-600 mt-1">Faltas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {((assignments['falta']?.length || 0) / initialPeople.length * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600 mt-1">Absenteismo Geral</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // History View
  if (showHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-800">Histórico de Atribuições</h1>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ← Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyData.map(date => (
              <button
                key={date}
                onClick={async () => {
                  const data = await loadHistoryDate(date);
                  if (data) {
                    if (confirm(`Carregar atribuições de ${new Date(date).toLocaleDateString('pt-BR')}?`)) {
                      setToday(date);
                      setAssignments(data.assignments);
                      setJustificativas(data.justificativas || {});
                      setShowHistory(false);
                      setHasUnsavedChanges(false);
                    }
                  }
                }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-500 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-slate-800">
                    {new Date(date).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  Clique para carregar esta atribuição
                </div>
              </button>
            ))}
          </div>

          {historyData.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum histórico encontrado</p>
            </div>
          )}
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
            {hasUnsavedChanges && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Não salvo
              </span>
            )}
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
                onClick={async () => {
                  const saved = await saveData();
                  if (saved) alert('Atribuição salva com sucesso!');
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
              >
                <History className="w-4 h-4" />
                Histórico
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

        {/* Seção de Analistas Gerais */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md overflow-hidden mb-4 border-2 border-emerald-300">
          <div className="p-4 bg-white border-b-2 border-emerald-300">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-slate-800 text-lg">👔 ANALISTAS GERAIS DE OPERAÇÃO</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                {filteredPeople(assignments['Analista geral operação'])?.length || 0} analistas
              </span>
            </div>
          </div>
          <div className="p-4">
            <div
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('Analista geral operação')}
              className="bg-emerald-50 rounded-lg border-2 border-dashed border-emerald-300 p-4 min-h-32"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredPeople(assignments['Analista geral operação'])?.map(person => (
                  <div
                    key={person.id}
                    draggable
                    onDragStart={() => handleDragStart(person, 'Analista geral operação')}
                    className={`bg-white p-3 rounded-lg border-l-4 border-emerald-500 cursor-move hover:shadow-lg transition-all hover:scale-105 ${
                      searchTerm && person.name.toLowerCase().includes(searchTerm.toLowerCase()) 
                        ? 'ring-2 ring-yellow-400' 
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-800 text-sm line-clamp-2">{person.name}</div>
                    <div className="text-emerald-700 text-xs mt-1 font-medium">{person.cargo}</div>
                    <div className="text-slate-500 text-xs mt-1">{person.operacao}</div>
                  </div>
                ))}
              </div>
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
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {setoresPorOperacao(operacao).reduce((sum, setor) => {
                      const pessoasSetor = pessoasDoSetorNaOperacao(setor, operacao);
                      return sum + filteredPeople(pessoasSetor).length;
                    }, 0)} pessoas
                  </span>
                </div>
              </button>

              {expandedOps[operacao] && (
                <div className="border-t border-slate-200 p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {setoresPorOperacao(operacao).map(setor => {
                      const pessoasSetor = pessoasDoSetorNaOperacao(setor, operacao);
                      const filtered = filteredPeople(pessoasSetor);
                      if (searchTerm && filtered.length === 0) return null;
                      
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
                            {filtered.map(person => (
                              <div
                                key={person.id}
                                draggable
                                onDragStart={() => handleDragStart(person, setor)}
                                className={`bg-white p-2 rounded border-l-3 border-blue-500 cursor-move hover:shadow-md transition text-xs ${
                                  searchTerm && person.name.toLowerCase().includes(searchTerm.toLowerCase()) 
                                    ? 'ring-2 ring-yellow-400' 
                                    : ''
                                }`}
                              >
                                <div className="font-semibold text-slate-800 line-clamp-2">{person.name}</div>
                                <div className="text-slate-600 text-xs mt-0.5 line-clamp-1">{person.cargo}</div>
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
          <h2 className="font-bold text-red-700 mb-3 text-lg">❌ FALTA ({filteredPeople(assignments['falta'])?.length || 0})</h2>
          <div
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('falta')}
            className="mb-4 pb-4 border-b-2 border-red-300 min-h-24"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filteredPeople(assignments['falta'])?.map(person => (
                <div
                  key={person.id}
                  draggable
                  onDragStart={() => handleDragStart(person, 'falta')}
                  className={`bg-red-100 p-2 rounded border-l-3 border-red-500 cursor-move hover:shadow-md transition text-xs ${
                    searchTerm && person.name.toLowerCase().includes(searchTerm.toLowerCase()) 
                      ? 'ring-2 ring-yellow-400' 
                      : ''
                  }`}
                >
                  <div className="font-semibold text-red-900 line-clamp-2">{person.name}</div>
                  <div className="text-red-700 text-xs mt-0.5">{person.cargo}</div>
                </div>
              ))}
            </div>
          </div>

          {assignments['falta']?.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-red-700 text-sm">Justificativas:</h3>
              {assignments['falta'].map(person => (
                <div key={person.id} className="bg-white p-2 rounded">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 line-clamp-1">
                    {person.name}
                  </label>
                  <textarea
                    value={justificativas[person.id] || ''}
                    onChange={(e) => handleJustificativa(person.id, e.target.value)}
                    placeholder="Justificativa..."
                    className="w-full text-xs p-1.5 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectorAssignment;
