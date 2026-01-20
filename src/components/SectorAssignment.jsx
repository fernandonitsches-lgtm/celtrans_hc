import React, { useState, useEffect } from 'react';
import { Calendar, Download, RotateCcw, Users, ChevronDown, BarChart3, Search, Filter, History, AlertCircle, Wifi, WifiOff, Loader } from 'lucide-react';

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
  ];

  const operacoes = [...new Set(initialPeople.map(p => p.operacao))].sort();
  const [assignments, setAssignments] = useState({});
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [justificativas, setJustificativas] = useState({});
  const [expandedOps, setExpandedOps] = useState({});
  const [viewMode, setViewMode] = useState('atribuir');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [dbStatus, setDbStatus] = useState('checking');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    testDatabaseConnection();
    loadData();
  }, [today]);

  useEffect(() => {
    if (Object.keys(assignments).length === 0) {
      initializeAssignments();
    }
  }, []);

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setDbStatus(response.ok ? 'connected' : 'disconnected');
    } catch (error) {
      setDbStatus('disconnected');
    }
  };

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
          csv += `${today},"${person.operacao}","${setor}","${person.name}","${person.cargo}","${person.area}"\n`;
        });
      }
    });

    if (assignments['falta'] && assignments['falta'].length > 0) {
      csv += '\n\nFALTAS\nData,Nome,Cargo,Area,Operação,Justificativa\n';
      assignments['falta'].forEach(person => {
        const justificativa = justificativas[person.id] || '';
        csv += `${today},"${person.name}","${person.cargo}","${person.area}","${person.operacao}","${justificativa}"\n`;
      });
    }

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `atribuicao_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredPeople = (people) => {
    if (!people) return [];
    return people.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const totalAtribuido = Object.keys(assignments)
    .filter(k => k !== 'falta')
    .reduce((sum, k) => sum + (assignments[k]?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-full mx-auto">
        
        {/* Flag de Status do Banco de Dados */}
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-md ${
            dbStatus === 'connected' 
              ? 'bg-green-100 text-green-700'
              : dbStatus === 'checking'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {dbStatus === 'connected' && <Wifi className="w-4 h-4" />}
            {dbStatus === 'checking' && <Loader className="w-4 h-4 animate-spin" />}
            {dbStatus === 'disconnected' && <WifiOff className="w-4 h-4" />}
            <span className="text-xs font-semibold">
              {dbStatus === 'connected' ? '✓ BD' : dbStatus === 'checking' ? '⏳ BD' : '✗ BD'}
            </span>
          </div>
        </div>
        
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
          <input
            type="date"
            value={today}
            onChange={(e) => setToday(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
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
                  if (saved) alert('Atribuição salva!');
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-md border-4 border-dashed border-red-300 p-4">
          <h2 className="font-bold text-red-700 mb-3">❌ FALTA ({filteredPeople(assignments['falta'])?.length || 0})</h2>
          <div onDragOver={handleDragOver} onDrop={() => handleDrop('falta')} className="min-h-24">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {filteredPeople(assignments['falta'])?.map(person => (
                <div
                  key={person.id}
                  draggable
                  onDragStart={() => handleDragStart(person, 'falta')}
                  className="bg-red-100 p-2 rounded border-l-3 border-red-500 cursor-move text-xs"
                >
                  <div className="font-semibold text-red-900 line-clamp-2">{person.name}</div>
                  <div className="text-red-700">{person.cargo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorAssignment;
