import React, { useState, useEffect } from 'react';
import { History, Search, Download, ChevronDown, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

const Historico = () => {
  const [atribuicoes, setAtribuicoes] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterData, setFilterData] = useState('');
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      setError('');

      // Buscar últimos 30 dias de atribuições
      const { data: atrib, error: atribError } = await supabase
        .from('atribuicoes_diarias')
        .select('*')
        .gte('data', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('data', { ascending: false });

      // Buscar últimos 30 dias de faltas
      const { data: faltasData, error: faltasError } = await supabase
        .from('faltas_diarias')
        .select('*')
        .gte('data', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('data', { ascending: false });

      if (atribError) throw atribError;
      if (faltasError) throw faltasError;

      setAtribuicoes(atrib || []);
      setFaltas(faltasData || []);
    } catch (err) {
      setError('Erro ao carregar histórico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAtribuicoes = atribuicoes.filter(a => {
    const matchSearch = a.pessoa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       a.setor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchData = !filterData || a.data === filterData;
    return matchSearch && matchData;
  });

  const filteredFaltas = faltas.filter(f => {
    const matchSearch = f.pessoa_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchData = !filterData || f.data === filterData;
    return matchSearch && matchData;
  });

  const groupedAtribuicoes = {};
  filteredAtribuicoes.forEach(a => {
    if (!groupedAtribuicoes[a.data]) {
      groupedAtribuicoes[a.data] = [];
    }
    groupedAtribuicoes[a.data].push(a);
  });

  const groupedFaltas = {};
  filteredFaltas.forEach(f => {
    if (!groupedFaltas[f.data]) {
      groupedFaltas[f.data] = [];
    }
    groupedFaltas[f.data].push(f);
  });

  const handleExportHistorico = () => {
    let csv = 'Data,Tipo,Pessoa,Setor,Cargo,Operação,Justificativa\n';

    Object.keys(groupedAtribuicoes).forEach(data => {
      groupedAtribuicoes[data].forEach(a => {
        const escapedNome = `"${a.pessoa_nome.replace(/"/g, '""')}"`;
        const escapedSetor = `"${a.setor.replace(/"/g, '""')}"`;
        const escapedCargo = `"${a.cargo.replace(/"/g, '""')}"`;
        const escapedOp = `"${a.operacao.replace(/"/g, '""')}"`;
        csv += `${data},PRESENTE,${escapedNome},${escapedSetor},${escapedCargo},${escapedOp},\n`;
      });
    });

    Object.keys(groupedFaltas).forEach(data => {
      groupedFaltas[data].forEach(f => {
        const escapedNome = `"${f.pessoa_nome.replace(/"/g, '""')}"`;
        const escapedCargo = `"${f.cargo.replace(/"/g, '""')}"`;
        const escapedOp = `"${f.operacao.replace(/"/g, '""')}"`;
        const escapedJust = `"${(f.justificativa || '').replace(/"/g, '""')}"`;
        csv += `${data},FALTA,${escapedNome},,${escapedCargo},${escapedOp},${escapedJust}\n`;
      });
    });

    const bom = '\uFEFF';
    const csvWithBom = bom + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `historico_atribuicoes.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <History className="w-12 h-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-slate-600 text-lg">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Histórico de Atribuições</h1>
          </div>
          <button
            onClick={handleExportHistorico}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por pessoa ou setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={filterData}
                onChange={(e) => setFilterData(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(searchTerm || filterData) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterData('');
                }}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {Object.keys(groupedAtribuicoes).length === 0 && Object.keys(groupedFaltas).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-slate-500 text-lg">Nenhum registro encontrado</p>
            </div>
          ) : (
            Object.keys({ ...groupedAtribuicoes, ...groupedFaltas })
              .sort()
              .reverse()
              .map(data => (
                <div key={data} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <button
                    onClick={() => setExpandedDates(prev => ({ ...prev, [data]: !prev[data] }))}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-l-4 border-blue-500"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown 
                        className={`w-5 h-5 transition-transform ${expandedDates[data] ? '' : '-rotate-90'}`}
                      />
                      <span className="font-bold text-slate-800">{new Date(data).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {(groupedAtribuicoes[data]?.length || 0) + (groupedFaltas[data]?.length || 0)} registros
                      </span>
                    </div>
                  </button>

                  {expandedDates[data] && (
                    <div className="border-t border-slate-200 p-4 space-y-4">
                      {groupedAtribuicoes[data] && groupedAtribuicoes[data].length > 0 && (
                        <div>
                          <h3 className="font-semibold text-green-700 mb-3">✓ Presentes ({groupedAtribuicoes[data].length})</h3>
                          <div className="space-y-2">
                            {groupedAtribuicoes[data].map(a => (
                              <div key={a.id} className="bg-green-50 p-3 rounded-lg border-l-3 border-green-500">
                                <div className="font-semibold text-slate-800">{a.pessoa_nome}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                  <span className="block">Setor: {a.setor}</span>
                                  <span className="block">Cargo: {a.cargo}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedFaltas[data] && groupedFaltas[data].length > 0 && (
                        <div>
                          <h3 className="font-semibold text-red-700 mb-3">❌ Faltas ({groupedFaltas[data].length})</h3>
                          <div className="space-y-2">
                            {groupedFaltas[data].map(f => (
                              <div key={f.id} className="bg-red-50 p-3 rounded-lg border-l-3 border-red-500">
                                <div className="font-semibold text-slate-800">{f.pessoa_nome}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                  <span className="block">Cargo: {f.cargo}</span>
                                  {f.justificativa && (
                                    <span className="block">Justificativa: {f.justificativa}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Historico;
