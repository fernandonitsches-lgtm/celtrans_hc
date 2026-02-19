import React, { useState, useEffect } from 'react';
import { TrendingDown, Calendar, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

const RankingFaltas = () => {
  const [faltas, setFaltas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mesAno, setMesAno] = useState('');
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [expandido, setExpandido] = useState({});

  useEffect(() => {
    // Definir mês/ano atual como padrão
    const hoje = new Date();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const anoAtual = hoje.getFullYear();
    setMesAno(`${anoAtual}-${mesAtual}`);
  }, []);

  useEffect(() => {
    if (mesAno) {
      fetchFaltas();
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

      const { data, error } = await supabase
        .from('faltas_diarias')
        .select('*')
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: false });

      if (error) throw error;

      // Agrupar faltas por pessoa
      const faltasPorPessoa = {};
      
      data.forEach(falta => {
        if (!faltasPorPessoa[falta.pessoa_id]) {
          faltasPorPessoa[falta.pessoa_id] = {
            pessoa_id: falta.pessoa_id,
            pessoa_nome: falta.pessoa_nome,
            cargo: falta.cargo,
            operacao: falta.operacao,
            total_faltas: 0,
            detalhes: []
          };
        }
        
        faltasPorPessoa[falta.pessoa_id].total_faltas++;
        faltasPorPessoa[falta.pessoa_id].detalhes.push({
          data: falta.data,
          justificativa: falta.justificativa || 'Sem justificativa',
          plano_acao: falta.plano_acao
        });
      });

      // Converter para array e ordenar por número de faltas (decrescente)
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

  const handleVerDetalhes = (pessoa) => {
    setPessoaSelecionada(pessoa);
    setModalAberto(true);
  };

  const handleCloseModal = () => {
    setModalAberto(false);
    setPessoaSelecionada(null);
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const getMedalha = (posicao) => {
    if (posicao === 0) return '🥇';
    if (posicao === 1) return '🥈';
    if (posicao === 2) return '🥉';
    return `${posicao + 1}º`;
  };

  const getCorPorPosicao = (posicao) => {
    if (posicao === 0) return 'bg-yellow-50 border-yellow-300';
    if (posicao === 1) return 'bg-slate-50 border-slate-300';
    if (posicao === 2) return 'bg-orange-50 border-orange-300';
    return 'bg-white border-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <TrendingDown className="w-12 h-12 text-red-600 mx-auto" />
          </div>
          <p className="text-slate-600 text-lg">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingDown className="w-8 h-8 text-red-600" />
          <h2 className="text-2xl font-bold text-slate-800">Ranking de Faltas</h2>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {/* Filtro de Mês/Ano */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-600" />
          <label className="text-sm font-semibold text-slate-700">
            Selecione o mês:
          </label>
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">
            {faltas.length === 0 ? 'Nenhuma falta registrada' : `${faltas.length} pessoa(s) com falta`}
          </span>
        </div>
      </div>

      {/* Ranking */}
      {faltas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma falta registrada!</h3>
          <p className="text-slate-600">Neste mês não houve faltas ou o mês selecionado ainda não possui dados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faltas.map((pessoa, index) => (
            <div
              key={pessoa.pessoa_id}
              className={`rounded-lg shadow-md border-2 overflow-hidden transition-all ${getCorPorPosicao(index)}`}
            >
              {/* Card Principal */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Posição/Medalha */}
                    <div className="text-3xl font-bold">
                      {getMedalha(index)}
                    </div>

                    {/* Info da Pessoa */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">{pessoa.pessoa_nome}</h3>
                      <div className="flex gap-4 text-sm text-slate-600 mt-1">
                        <span>📋 {pessoa.cargo}</span>
                        <span>🏭 {pessoa.operacao}</span>
                      </div>
                    </div>

                    {/* Contador de Faltas */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-600">{pessoa.total_faltas}</div>
                      <div className="text-xs text-slate-600">
                        {pessoa.total_faltas === 1 ? 'falta' : 'faltas'}
                      </div>
                    </div>

                    {/* Botão Ver Detalhes */}
                    <button
                      onClick={() => setExpandido(prev => ({ ...prev, [pessoa.pessoa_id]: !prev[pessoa.pessoa_id] }))}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      {expandido[pessoa.pessoa_id] ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Ver Detalhes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalhes Expandidos */}
              {expandido[pessoa.pessoa_id] && (
                <div className="border-t border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">📅 Histórico de Faltas:</h4>
                  <div className="space-y-3">
                    {pessoa.detalhes.map((detalhe, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-slate-800">
                            {formatarData(detalhe.data)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <p className="text-slate-700">
                            <span className="font-semibold">Justificativa:</span> {detalhe.justificativa}
                          </p>
                          {detalhe.plano_acao && (
                            <p className="text-slate-600 mt-1">
                              <span className="font-semibold">Plano de Ação:</span> {detalhe.plano_acao}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estatísticas Gerais */}
      {faltas.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-slate-800 mb-4">📊 Estatísticas do Mês</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                {faltas.reduce((sum, p) => sum + p.total_faltas, 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">Total de Faltas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {faltas.length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Pessoas com Falta</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {(faltas.reduce((sum, p) => sum + p.total_faltas, 0) / faltas.length).toFixed(1)}
              </div>
              <div className="text-sm text-slate-600 mt-1">Média por Pessoa</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingFaltas;
