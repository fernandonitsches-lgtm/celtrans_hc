import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { History, Search, Download, ChevronDown, AlertCircle, Building2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { MOTIVOS_AUSENCIA } from '../constants/motivos';

const LABEL_MOTIVO = (valor) => {
  if (!valor) return '';
  const found = MOTIVOS_AUSENCIA.find(m => m.value === valor);
  return found ? found.label : valor;
};

const Historico = ({ userCd = 'todos' }) => {
  const cdBloqueado = userCd !== 'todos';
  const [atribuicoes, setAtribuicoes] = useState([]);
  const [faltas, setFaltas]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterData, setFilterData]   = useState('');
  const [filterCd, setFilterCd]       = useState(userCd);
  const [filterOperacao, setFilterOperacao] = useState('todas');
  const [periodoFiltro, setPeriodoFiltro]   = useState('semana');
  const [expandedDates, setExpandedDates]   = useState({});

  // Mantém o filtro de CD sincronizado com o CD do usuário
  useEffect(() => { setFilterCd(userCd); }, [userCd]);

  const formatarData = (dataString) => {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => { fetchHistorico(); }, []);

  useEffect(() => {
    if (filterData) fetchHistoricoByDate(filterData);
  }, [filterData]);

  useEffect(() => {
    if (!filterData) fetchHistorico();
  }, [periodoFiltro]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      setError('');
      const dias = periodoFiltro === 'dia' ? 1 : periodoFiltro === 'semana' ? 7 : 30;
      const dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [{ data: atrib, error: atribErr }, { data: faltasData, error: faltasErr }] = await Promise.all([
        supabase.from('atribuicoes_diarias').select('*').gte('data', dataInicio).order('data', { ascending: false }),
        supabase.from('faltas_diarias').select('*').gte('data', dataInicio).order('data', { ascending: false }),
      ]);

      if (atribErr) throw atribErr;
      if (faltasErr) throw faltasErr;
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
      const [{ data: atrib, error: atribErr }, { data: faltasData, error: faltasErr }] = await Promise.all([
        supabase.from('atribuicoes_diarias').select('*').eq('data', data).order('pessoa_nome', { ascending: true }),
        supabase.from('faltas_diarias').select('*').eq('data', data).order('pessoa_nome', { ascending: true }),
      ]);
      if (atribErr) throw atribErr;
      if (faltasErr) throw faltasErr;
      setAtribuicoes(atrib || []);
      setFaltas(faltasData || []);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // CDs e operações disponíveis nos dados
  const cdsDisponiveis = [...new Set([
    ...atribuicoes.map(a => a.cd),
    ...faltas.map(f => f.cd),
  ].filter(Boolean))].sort();

  const operacoesDisponiveis = [...new Set([
    ...atribuicoes.map(a => a.operacao),
    ...faltas.map(f => f.operacao),
  ].filter(Boolean))].sort();

  const matchFiltros = (item) => {
    const matchSearch = !searchTerm ||
      item.pessoa_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.setor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operacao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCd = filterCd === 'todos' || item.cd === filterCd;
    const matchOp = filterOperacao === 'todas' || item.operacao === filterOperacao;
    return matchSearch && matchCd && matchOp;
  };

  const filteredAtribuicoes = atribuicoes.filter(matchFiltros);
  const filteredFaltas      = faltas.filter(matchFiltros);

  const groupBy = (items) => {
    const groups = {};
    items.forEach(item => {
      if (!groups[item.data]) groups[item.data] = [];
      groups[item.data].push(item);
    });
    return groups;
  };

  const groupedAtribuicoes = groupBy(filteredAtribuicoes);
  const groupedFaltas      = groupBy(filteredFaltas);
  const todasDatas = [...new Set([...Object.keys(groupedAtribuicoes), ...Object.keys(groupedFaltas)])].sort().reverse();

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Histórico');
    ws.columns = [
      { header: 'Data',         key: 'Data',         width: 12 },
      { header: 'Tipo',         key: 'Tipo',         width: 12 },
      { header: 'CD',           key: 'CD',           width: 15 },
      { header: 'Pessoa',       key: 'Pessoa',       width: 30 },
      { header: 'Cargo',        key: 'Cargo',        width: 20 },
      { header: 'Operação',     key: 'Operacao',     width: 20 },
      { header: 'Setor',        key: 'Setor',        width: 20 },
      { header: 'Motivo',       key: 'Motivo',       width: 30 },
      { header: 'Justificativa',key: 'Justificativa',width: 40 },
    ];
    filteredAtribuicoes.forEach(a => {
      ws.addRow({ Data: a.data, Tipo: 'PRESENTE', CD: a.cd || '', Pessoa: a.pessoa_nome, Cargo: a.cargo, Operacao: a.operacao, Setor: a.setor, Motivo: '', Justificativa: '' });
    });
    filteredFaltas.forEach(f => {
      ws.addRow({ Data: f.data, Tipo: 'FALTA', CD: f.cd || '', Pessoa: f.pessoa_nome, Cargo: f.cargo, Operacao: f.operacao, Setor: '', Motivo: LABEL_MOTIVO(f.motivo), Justificativa: f.justificativa || '' });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_${new Date().toISOString().split('T')[0]}${filterCd !== 'todos' ? `_${filterCd}` : ''}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Histórico de Atribuições</h1>
              <p className="text-xs text-slate-400 mt-0.5">Consulte e exporte registros de presença e faltas</p>
            </div>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition text-sm font-semibold">
            <Download className="w-4 h-4" /> Exportar XLSX
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
          {/* Período rápido */}
          <div className="flex gap-2 flex-wrap items-center">
            {[
              { label: 'Hoje', value: 'dia' },
              { label: 'Últimos 7 dias', value: 'semana' },
              { label: 'Últimos 30 dias', value: 'mes' },
            ].map(op => (
              <button key={op.value}
                onClick={() => { setPeriodoFiltro(op.value); setFilterData(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  periodoFiltro === op.value && !filterData
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {op.label}
              </button>
            ))}
            {/* Badge do CD para usuário restrito */}
            {cdBloqueado && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
                <Building2 className="w-3.5 h-3.5" /> {userCd}
              </span>
            )}
          </div>

          {/* Busca + filtros */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 relative min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Buscar por nome, setor ou operação..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50" />
            </div>

            <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50" />

            {/* Select de CD — só aparece para admin */}
            {!cdBloqueado && cdsDisponiveis.length > 0 && (
              <select value={filterCd} onChange={(e) => setFilterCd(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50">
                <option value="todos">Todos os CDs</option>
                {cdsDisponiveis.map(cd => <option key={cd} value={cd}>{cd}</option>)}
              </select>
            )}

            <select value={filterOperacao} onChange={(e) => setFilterOperacao(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50">
              <option value="todas">Todas as operações</option>
              {operacoesDisponiveis.map(op => <option key={op} value={op}>{op}</option>)}
            </select>

            {(searchTerm || filterData || (!cdBloqueado && filterCd !== 'todos') || filterOperacao !== 'todas') && (
              <button onClick={() => { setSearchTerm(''); setFilterData(''); setFilterOperacao('todas'); if (!cdBloqueado) setFilterCd('todos'); setFilterOperacao('todas'); }}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm font-medium">
                Limpar
              </button>
            )}
          </div>

          {/* Resumo do período */}
          <div className="flex gap-4 pt-1">
            <span className="text-xs text-slate-400">
              <span className="font-semibold text-green-600">{filteredAtribuicoes.length}</span> presenças ·{' '}
              <span className="font-semibold text-red-600">{filteredFaltas.length}</span> faltas ·{' '}
              <span className="font-semibold text-slate-600">{todasDatas.length}</span> dias
            </span>
          </div>
        </div>

        {/* Lista por data */}
        {todasDatas.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhum registro encontrado</p>
            <p className="text-slate-300 text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todasDatas.map(data => {
              const atribDia  = groupedAtribuicoes[data] || [];
              const faltasDia = groupedFaltas[data] || [];
              const total     = atribDia.length + faltasDia.length;
              const isOpen    = expandedDates[data];

              return (
                <div key={data} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedDates(prev => ({ ...prev, [data]: !prev[data] }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      <span className="font-bold text-slate-700">{formatarData(data)}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{total} registros</span>
                      {atribDia.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{atribDia.length} presentes</span>
                      )}
                      {faltasDia.length > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{faltasDia.length} faltas</span>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      {/* Presentes */}
                      {atribDia.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-green-700 mb-2 text-sm">✓ Presentes ({atribDia.length})</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {atribDia.map(a => (
                              <div key={a.id} className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs">
                                <div className="font-semibold text-slate-800">{a.pessoa_nome}</div>
                                <div className="text-slate-500 mt-0.5">{a.cargo}</div>
                                <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                                  <span className="text-slate-400">{a.setor} · {a.operacao}</span>
                                  {a.cd && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                      <Building2 className="w-2.5 h-2.5" />{a.cd}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Faltas */}
                      {faltasDia.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-red-700 mb-2 text-sm">❌ Faltas ({faltasDia.length})</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {faltasDia.map(f => (
                              <div key={f.id} className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-800">{f.pessoa_nome}</div>
                                    <div className="text-slate-500 mt-0.5">{f.cargo} · {f.operacao}</div>
                                  </div>
                                  {f.cd && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
                                      <Building2 className="w-2.5 h-2.5" />{f.cd}
                                    </span>
                                  )}
                                </div>
                                {f.motivo && (
                                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                    {LABEL_MOTIVO(f.motivo)}
                                  </span>
                                )}
                                {f.justificativa && (
                                  <p className="text-slate-500 mt-1 italic">"{f.justificativa}"</p>
                                )}
                                {f.plano_acao && (
                                  <p className="text-slate-400 mt-1">Plano: {f.plano_acao}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historico;