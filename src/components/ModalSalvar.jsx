import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { MOTIVOS_AUSENCIA } from '../constants/motivos';

const LABEL_MOTIVO = (valor) => {
  if (!valor) return '';
  const found = MOTIVOS_AUSENCIA.find(m => m.value === valor);
  return found ? found.label : valor;
};

const ModalSalvar = ({
  isOpen,
  onClose,
  onConfirm,
  assignments,
  justificativas,
  onJustificativaChange,
  data,
  remanejados = [],
  emFerias = [],
  totalColaboradores = 0,
  motivosFalta = {},
}) => {
  const [planoAcao, setPlanoAcao] = useState('');
  const [localJustificativas, setLocalJustificativas] = useState({});
  const [ocorrenciasRemanejados, setOcorrenciasRemanejados] = useState({});
  const [erro, setErro] = useState('');

  const faltas = assignments['falta'] || [];

  // Sincroniza justificativas quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalJustificativas(justificativas || {});
      setErro('');
      setPlanoAcao('');
      setOcorrenciasRemanejados({});
    }
  }, [isOpen, justificativas]);

  const handleConfirm = () => {
    setErro('');

    // Valida: faltas com motivo "outros" precisam de observação
    const faltasSemObs = faltas.filter(f => {
      const motivo = motivosFalta[f.id];
      if (motivo === 'outros') {
        return !localJustificativas[f.id] || localJustificativas[f.id].trim() === '';
      }
      return false;
    });

    if (faltasSemObs.length > 0) {
      setErro(`${faltasSemObs.length} falta(s) com motivo "Outros" precisam de observação`);
      return;
    }

    onConfirm(localJustificativas, planoAcao);
    handleClose();
  };

  const handleClose = () => {
    setPlanoAcao('');
    setLocalJustificativas({});
    setOcorrenciasRemanejados({});
    setErro('');
    onClose();
  };

  if (!isOpen) return null;

  const totalPresentes = Object.keys(assignments)
    .filter(k => k !== 'falta')
    .reduce((sum, k) => sum + (assignments[k]?.length || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-blue-600 p-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Confirmar Atribuição</h2>
            <p className="text-blue-200 text-xs mt-0.5">{data}</p>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-blue-700 p-1.5 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Erro */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{erro}</p>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">📊 Resumo do Dia</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Presentes', value: totalPresentes, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Faltas', value: faltas.length, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Férias', value: emFerias.length, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Total', value: totalColaboradores, color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Faltas */}
          {faltas.length > 0 ? (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Faltas registradas ({faltas.length})
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {faltas.map(person => {
                  const motivo = motivosFalta[person.id];
                  const labelMotivo = LABEL_MOTIVO(motivo);
                  const precisaObs = motivo === 'outros';

                  return (
                    <div key={person.id} className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{person.name}</p>
                          <p className="text-xs text-slate-500">{person.cargo} · {person.operacao}</p>
                        </div>
                        {labelMotivo && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium whitespace-nowrap flex-shrink-0">
                            {labelMotivo}
                          </span>
                        )}
                      </div>

                      {/* Só mostra textarea se motivo for "outros" */}
                      {precisaObs && (
                        <div className="mt-2">
                          <label className="block text-xs font-semibold text-red-700 mb-1">
                            Observação obrigatória *
                          </label>
                          <textarea
                            value={localJustificativas[person.id] || ''}
                            onChange={(e) => setLocalJustificativas({
                              ...localJustificativas,
                              [person.id]: e.target.value
                            })}
                            placeholder="Descreva o motivo da ausência..."
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none bg-white"
                            rows="2"
                          />
                        </div>
                      )}

                      {/* Campo opcional de observação para outros motivos */}
                      {!precisaObs && (
                        <div className="mt-2">
                          <label className="block text-xs text-slate-400 mb-1">Observação adicional (opcional)</label>
                          <textarea
                            value={localJustificativas[person.id] || ''}
                            onChange={(e) => setLocalJustificativas({
                              ...localJustificativas,
                              [person.id]: e.target.value
                            })}
                            placeholder="Observação adicional..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm resize-none bg-white"
                            rows="1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm font-medium">Nenhuma falta registrada para este dia!</p>
            </div>
          )}

          {/* Remanejados */}
          {remanejados.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                📋 Remanejados ({remanejados.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {remanejados.map(person => (
                  <div key={person.id} className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <p className="font-semibold text-slate-800 text-sm">{person.name}</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      ↪ <span className="font-medium">{person.setorOrigem}</span> → <span className="font-medium">{person.setorAtual}</span>
                      {person.operacaoOrigem !== person.operacaoAtual && (
                        <span className="ml-1">({person.operacaoOrigem} → {person.operacaoAtual})</span>
                      )}
                    </p>
                    <textarea
                      value={ocorrenciasRemanejados[person.id] || ''}
                      onChange={(e) => setOcorrenciasRemanejados({ ...ocorrenciasRemanejados, [person.id]: e.target.value })}
                      placeholder="Motivo do remanejamento (opcional)..."
                      className="w-full mt-2 px-3 py-1.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs resize-none bg-white"
                      rows="1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plano de Ação */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2 text-sm">📋 Plano de Ação <span className="font-normal text-slate-400">(opcional)</span></h3>
            <textarea
              value={planoAcao}
              onChange={(e) => setPlanoAcao(e.target.value)}
              placeholder="Observações, metas ou ações planejadas para este dia..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm"
              rows="3"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={handleClose}
            className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition text-sm">
            Cancelar
          </button>
          <button onClick={handleConfirm}
            className="px-5 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Confirmar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSalvar;