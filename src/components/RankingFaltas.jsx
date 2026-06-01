import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { TrendingDown, Calendar, AlertCircle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { MOTIVOS_AUSENCIA } from '../constants/motivos';

const LABEL_MOTIVO = (valor) => {
  const found = MOTIVOS_AUSENCIA.find(m => m.value === valor);
  return found ? found.label : valor || 'Sem motivo';
};

const CORES_MOTIVO = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
  'bg-green-500', 'bg-slate-500',
];

const RankingFaltas = () => {
  const [faltas, setFaltas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mesAno, setMesAno] = useState('');
  const [expandido, setExpandido] = useState({});
  const [aba, setAba] = useState('colaboradores'); // 'colaboradores' | 'motivos'

  useEffect(() => {
    const hoje = new Date();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const anoAtual = hoje.getFullYear();
    setMesAno(`${anoAtual}-${mesAtual}`);
  }, []);

  useEffect(() => {
    if (mesAno) {
      fetchFaltas();

      const subscription = supabase
        .channel(`faltas_${mesAno}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'faltas_diarias' }, () => {
          fetchFaltas();
        })
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [mesAno]);

  const fetchFaltas = async () => {
    try {
      setLoading(true);
      setError('');

      const [ano, mes] = mesAno.split('-');
      const dataInicio = `${ano}-${mes}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFim = `${ano}-${mes}-${ultimoDia}`;

      const [{ data, error }, { data: pessoas, error: pessoasError }] = await Promise.all([
        supabase
          .from('faltas_diarias')
          .select('*')
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .order('data', { ascending: false }),
        supabase
          .from('pessoas')
          .select('id, cargo, operacao')
      ]);

      if (error) throw error;
      if (pessoasError) throw pessoasError;

      const pessoasMap = {};
      pessoas.forEach(p => { pessoasMap[p.id] = p; });

      const faltasPorPessoa = {};
      data.forEach(falta => {
        if (!faltasPorPessoa[falta.pessoa_id]) {
          const pessoaAtual = pessoasMap[falta.pessoa_id];
          faltasPorPessoa[falta.pessoa_id] = {
            pessoa_id: falta.pessoa_id,
            pessoa_nome: falta.pessoa_nome,
            cargo: pessoaAtual?.cargo || falta.cargo,
            operacao: pessoaAtual?.operacao || falta.operacao,
            total_faltas: 0,
            detalhes: []
          };
        }
        faltasPorPessoa[falta.pessoa_id].total_faltas++;
        faltasPorPessoa[falta.pessoa_id].detalhes.push({
          data: falta.data,
          justificativa: falta.justificativa || 'Sem justificativa',
          motivo: falta.motivo || '',
          plano_acao: falta.plano_acao
        });
      });

      const ranking = Object.values(faltasPorPessoa)
        .sort((a, b) => b.total_faltas - a.total_faltas);

      setFaltas(ranking);
    } catch (err) {
      console.error('Erro ao buscar faltas:', err);
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Monta ranking por motivo
  const rankingMotivos = () => {
    const contagem = {};
    faltas.forEach(pessoa => {
      pessoa.detalhes.forEach(d => {
        const motivo = d.motivo || 'sem_motivo';
        if (!contagem[motivo]) contagem[motivo] = { motivo, total: 0, pessoas: new Set() };
        contagem[motivo].total++;
        contagem[motivo].pessoas.add(pessoa.pessoa_nome);
      });
    });
    return Object.values(contagem)
      .sort((a, b) => b.total - a.total)
      .map(item => ({ ...item, pessoas: item.pessoas.size }));
  };

  const totalFaltas = faltas.reduce((sum, p) => sum + p.total_faltas, 0);

  const formatarData = (dataStr) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  const motivosRanking = rankingMotivos();
  const maiorMotivo = motivosRanking[0]?.total || 1;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingDown className="w-7 h-7 text-red-600" />
        <h2 className="text-2xl font-bold text-slate-800">Ranking de Faltas</h2>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 flex-1">{error}</p>
        </div>
      )}

      {/* Filtro de Mês */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="w-5 h-5 text-slate-500" />
          <label className="text-sm font-semibold text-slate-700">Selecione o mês:</label>
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
          />
          <span className="text-sm text-slate-500">
            {faltas.length === 0 ? 'Nenhuma falta registrada' : `${faltas.length} pessoa(s) com falta`}
          </span>
        </div>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setAba('colaboradores')}
            className={`flex items-center gap-2 px-6 py-3.5 font-semibold transition text-sm ${
              aba === 'colaboradores'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}>
            <TrendingDown className="w-4 h-4" /> Por Colaborador
          </button>
          <button
            onClick={() => setAba('motivos')}
            className={`flex items-center gap-2 px-6 py-3.5 font-semibold transition text-sm ${
              aba === 'motivos'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}>
            <BarChart3 className="w-4 h-4" /> Por Motivo
          </button>
        </div>
      </div>

      {/* ABA: Por Colaborador */}
      {aba === 'colaboradores' && (
        <>
          {faltas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma falta registrada!</h3>
              <p className="text-slate-500 text-sm">Neste mês não houve faltas ou o mês selecionado ainda não possui dados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faltas.map((pessoa, index) => (
                <div key={pessoa.pessoa_id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl font-bold text-slate-400 w-10 text-center">
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{pessoa.pessoa_nome}</h3>
                          <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                            <span>📋 {pessoa.cargo}</span>
                            <span>🏭 {pessoa.operacao}</span>
                          </div>
                        </div>
                        <div className="text-center mx-4">
                          <div className="text-4xl font-bold text-red-600">{pessoa.total_faltas}</div>
                          <div className="text-xs text-slate-500">{pessoa.total_faltas === 1 ? 'falta' : 'faltas'}</div>
                        </div>
                        <button
                          onClick={() => setExpandido(prev => ({ ...prev, [pessoa.pessoa_id]: !prev[pessoa.pessoa_id] }))}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2 flex-shrink-0"
                        >
                          {expandido[pessoa.pessoa_id]
                            ? <><ChevronUp className="w-4 h-4" />Ocultar</>
                            : <><ChevronDown className="w-4 h-4" />Ver Detalhes</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandido[pessoa.pessoa_id] && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <h4 className="font-semibold text-slate-700 mb-3 text-sm">📅 Histórico de Faltas</h4>
                      <div className="space-y-2">
                        {pessoa.detalhes.map((detalhe, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-slate-800 text-sm">{formatarData(detalhe.data)}</span>
                              {detalhe.motivo && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium flex-shrink-0">
                                  {LABEL_MOTIVO(detalhe.motivo)}
                                </span>
                              )}
                            </div>
                            {detalhe.justificativa && detalhe.justificativa !== 'Sem justificativa' && (
                              <p className="text-xs text-slate-500 mt-1">
                                <span className="font-semibold">Obs:</span> {detalhe.justificativa}
                              </p>
                            )}
                            {detalhe.plano_acao && (
                              <p className="text-xs text-slate-500 mt-1">
                                <span className="font-semibold">Plano de Ação:</span> {detalhe.plano_acao}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ABA: Por Motivo */}
      {aba === 'motivos' && (
        <>
          {motivosRanking.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum dado disponível</h3>
              <p className="text-slate-500 text-sm">Não há faltas com motivos registrados neste período.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {motivosRanking.map((item, index) => {
                const cor = CORES_MOTIVO[index % CORES_MOTIVO.length];
                const pct = Math.round((item.total / maiorMotivo) * 100);
                return (
                  <div key={item.motivo} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-slate-400 w-8 text-center flex-shrink-0">
                        {index + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-sm">{LABEL_MOTIVO(item.motivo)}</span>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <span className="text-xs text-slate-400">{item.pessoas} pessoa(s)</span>
                            <span className="text-2xl font-bold text-red-600">{item.total}</span>
                            <span className="text-xs text-slate-400">{item.total === 1 ? 'ocorrência' : 'ocorrências'}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cor} rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Estatísticas Gerais */}
      {faltas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-700 mb-4 text-sm">📊 Estatísticas do Mês</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-3xl font-bold text-red-600">{totalFaltas}</div>
              <div className="text-xs text-slate-500 mt-1">Total de Faltas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600">{faltas.length}</div>
              <div className="text-xs text-slate-500 mt-1">Pessoas com Falta</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {(totalFaltas / faltas.length).toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Média por Pessoa</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingFaltas;