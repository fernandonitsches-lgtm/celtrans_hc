import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { History, Search, Download, ChevronDown, AlertCircle } from 'lucide-react';
import ExcelJS from 'exceljs';

const Historico = () => {
  const [atribuicoes, setAtribuicoes] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterData, setFilterData] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('dia'); // 'dia' | 'semana' | 'mes'
  const [expandedDates, setExpandedDates] = useState({});

  // ✅ CORREÇÃO: Função para formatar data corretamente
  const formatarData = (dataString) => {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  // Recarrega dados quando a data do filtro muda
  useEffect(() => {
    if (filterData) {
      fetchHistoricoByDate(filterData);
    }
  }, [filterData]);

  // Recarrega dados quando o período é alterado
  useEffect(() => {
    if (!filterData) {
      fetchHistorico();
    }
  }, [periodoFiltro]);

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

  const fetchHistoricoByDate = async (data) => {
    try {
      setLoading(true);
      setError('');

      // Buscar atribuições para a data específica
      const { data: atrib, error: atribError } = await supabase
        .from('atribuicoes_diarias')
        .select('*')
        .eq('data', data)
        .order('pessoa_nome', { ascending: true });

      // Buscar faltas para a data específica
      const { data: faltasData, error: faltasError } = await supabase
        .from('faltas_diarias')
        .select('*')
        .eq('data', data)
        .order('pessoa_nome', { ascending: true });

      if (atribError) throw atribError;
      if (faltasError) throw faltasError;

      setAtribuicoes(atrib || []);
      setFaltas(faltasData || []);
    } catch (err) {
      setError('Erro ao carregar dados da data selecionada: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (periodoFiltro === 'dia') {
      const dataHoje = hoje.toISOString().split('T')[0];
      return { inicio: dataHoje, fim: dataHoje };
    }
    if (periodoFiltro === 'semana') {
      const diaSemana = hoje.getDay();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - diaSemana);
      const fimSemana = new Date(hoje);
      fimSemana.setDate(hoje.getDate() + (6 - diaSemana));
      return {
        inicio: inicioSemana.toISOString().split('T')[0],
        fim: fimSemana.toISOString().split('T')[0],
      };
    }
    if (periodoFiltro === 'mes') {
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return {
        inicio: inicioMes.toISOString().split('T')[0],
        fim: fimMes.toISOString().split('T')[0],
      };
    }
    return { inicio: null, fim: null };
  };

  const { inicio, fim } = getDateRange();

  const filteredAtribuicoes = atribuicoes.filter(a => {
    const matchSearch = a.pessoa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       a.setor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchData = !filterData ? (a.data >= inicio && a.data <= fim) : a.data === filterData;
    return matchSearch && matchData;
  });

  const filteredFaltas = faltas.filter(f => {
    const matchSearch = f.pessoa_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchData = !filterData ? (f.data >= inicio && f.data <= fim) : f.data === filterData;
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

  const handleExportHistorico = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Histórico');
    ws.columns = [
      { header: 'Data', key: 'Data', width: 12 },
      { header: 'Tipo', key: 'Tipo', width: 12 },
      { header: 'Pessoa', key: 'Pessoa', width: 20 },
      { header: 'Setor', key: 'Setor', width: 15 },
      { header: 'Cargo', key: 'Cargo', width: 15 },
      { header: 'Operação', key: 'Operação', width: 15 },
      { header: 'Justificativa', key: 'Justificativa', width: 30 }
    ];

    // Adicionar dados de atribuições
    Object.keys(groupedAtribuicoes).forEach(data => {
      groupedAtribuicoes[data].forEach(a => {
        ws.addRow({
          'Data': data,
          'Tipo': 'PRESENTE',
          'Pessoa': a.pessoa_nome,
          'Setor': a.setor,
          'Cargo': a.cargo,
          'Operação': a.operacao,
          'Justificativa': ''
        });
      });
    });

    // Adicionar dados de faltas
    Object.keys(groupedFaltas).forEach(data => {
      groupedFaltas[data].forEach(f => {
        ws.addRow({
          'Data': data,
          'Tipo': 'FALTA',
          'Pessoa': f.pessoa_nome,
          'Setor': '',
          'Cargo': f.cargo,
          'Operação': f.operacao,
          'Justificativa': f.justificativa || ''
        });
      });
    });
    
    // Gerar e baixar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_atribuicoes.xlsx`;
    link.click();
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
            Exportar XLSX
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          {/* Filtro de Período */}
          <div className="flex gap-2 mb-4">
            {[
              { label: 'Hoje', value: 'dia' },
              { label: 'Esta Semana', value: 'semana' },
              { label: 'Este Mês', value: 'mes' },
            ].map(op => (
              <button
                key={op.value}
                onClick={() => { setPeriodoFiltro(op.value); setFilterData(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  periodoFiltro === op.value && !filterData
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
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
                      <span className="font-bold text-slate-800">{formatarData(data)}</span>
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