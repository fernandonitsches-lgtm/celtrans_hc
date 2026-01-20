import React, { useState, useEffect } from 'react';
import { Calendar, Download, RotateCcw, Users, ChevronDown, BarChart3, Search, Filter, History, AlertCircle, Wifi, WifiOff, Loader } from 'lucide-react';

const SectorAssignment = () => {
  const [initialPeople, setInitialPeople] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [justificativas, setJustificativas] = useState({});
  const [expandedOps, setExpandedOps] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [dbStatus, setDbStatus] = useState('checking');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const operacoes = initialPeople.length > 0 ? [...new Set(initialPeople.map(p => p.operacao))].sort() : [];

  // Carrega dados ao montar o componente
  useEffect(() => {
    loadPeopleFromSupabase();
  }, []);

  // Carrega atribuições do dia
  useEffect(() => {
    loadData();
  }, [today]);

  // Inicializa atribuições
  useEffect(() => {
    if (Object.keys(assignments).length === 0 && initialPeople.length > 0) {
      initializeAssignments();
    }
  }, [initialPeople]);

  const testDatabaseConnection = async () => {
    try {
      setDbStatus('checking');
      // Simula dados locais para validação
      const testData = initialPeople && initialPeople.length > 0;
      setDbStatus(testData ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Erro ao validar dados:', error);
      setDbStatus('disconnected');
    }
  };

  const loadPeopleFromSupabase = async () => {
    try {
      // Dados de exemplo - substituir por dados reais depois
      const mockData = [
        { id: 1, name: 'João Silva', cargo: 'Operador', area: 'A', operacao: 'OP1', setor: 'Setor A' },
        { id: 2, name: 'Maria Santos', cargo: 'Técnico', area: 'B', operacao: 'OP2', setor: 'Setor B' },
        { id: 3, name: 'Pedro Costa', cargo: 'Supervisor', area: 'C', operacao: 'OP1', setor: 'Setor A' }
      ];
      
      setInitialPeople(mockData);
      setDbStatus('connected');
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
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
      console.error('Erro ao carregar dados:', error);
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
      const setor = person.setor || 'sem-setor';
      if (!init[setor]) {
        init[setor] = [];
      }
      init[setor].push(person);
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

  if (!initialPeople.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando dados do Supabase...</p>
          <p className="text-xs text-slate-500 mt-2">Status BD: {dbStatus}</p>
        </div>
      </div>
    );
  }

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
                  className="bg-red-100 p-2 rounded border-l-3 border-red-500 cursor-move text-xs hover:shadow-md transition"
                >
                  <div className="font-semibold text-red-900 line-clamp-2">{person.name}</div>
                  <div className="text-red-700">{person.cargo}</div>
                </div>
              ))}
            </div>
          </div>

          {assignments['falta']?.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto mt-4 pt-4 border-t-2 border-red-300">
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
