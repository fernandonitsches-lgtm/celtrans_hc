import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const ModalSalvar = ({ isOpen, onClose, onConfirm, assignments, justificativas, onJustificativaChange, data }) => {
  const [planoAcao, setPlanoAcao] = useState('');
  const [localJustificativas, setLocalJustificativas] = useState(justificativas);
  const [impedimentos, setImpedimentos] = useState({});
  const [erro, setErro] = useState('');

  const faltas = assignments['falta'] || [];

  const handleConfirm = () => {
    setErro('');

    // Validar se todas as faltas têm justificativa
    const faltasSemJustificativa = faltas.filter(f => !localJustificativas[f.id] || localJustificativas[f.id].trim() === '');
    
    if (faltasSemJustificativa.length > 0) {
      setErro(`${faltasSemJustificativa.length} falta(s) sem justificativa`);
      return;
    }

    // Chamar função de salvar com os dados
    onConfirm(localJustificativas, planoAcao, impedimentos);
    handleClose();
  };

  const handleClose = () => {
    setPlanoAcao('');
    setLocalJustificativas(justificativas);
    setImpedimentos({});
    setErro('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Confirmar Atribuição - {data}</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-blue-800 p-1 rounded transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {erro && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{erro}</p>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">📊 Resumo do Dia</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(assignments)
                    .filter(k => k !== 'falta')
                    .reduce((sum, k) => sum + (assignments[k]?.length || 0), 0)}
                </div>
                <div className="text-sm text-blue-700">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{faltas.length}</div>
                <div className="text-sm text-blue-700">Faltas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">
                  {Object.keys(assignments).reduce((sum, k) => sum + (assignments[k]?.length || 0), 0)}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>
          </div>

          {/* Justificativas de Faltas */}
          {faltas.length > 0 ? (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Justificar Faltas ({faltas.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {faltas.map(person => (
                  <div key={person.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <label className="block font-semibold text-slate-800 mb-2 text-sm">
                      {person.name}
                      <span className="font-normal text-slate-600 ml-2">({person.cargo})</span>
                    </label>
                    <textarea
                      value={localJustificativas[person.id] || ''}
                      onChange={(e) => setLocalJustificativas({
                        ...localJustificativas,
                        [person.id]: e.target.value
                      })}
                      placeholder="Ex: Doença, Atraso no transporte, Problema familiar..."
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                      rows="2"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">
                <span className="font-semibold">Excelente!</span> Nenhuma falta para este dia.
              </p>
            </div>
          )}

          {/* O que atrapalhou - por pessoa */}
          {faltas.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                📋 Relato de Ocorrências
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {faltas.map(person => (
                  <div key={person.id} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <label className="block font-semibold text-slate-800 mb-2 text-sm">
                      {person.name}
                      <span className="font-normal text-slate-600 ml-2">({person.cargo})</span>
                    </label>
                    <textarea
                      value={impedimentos[person.id] || ''}
                      onChange={(e) => setImpedimentos({
                        ...impedimentos,
                        [person.id]: e.target.value
                      })}
                      placeholder="Ex: Problema no transporte, questão pessoal, sem comunicação..."
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                      rows="2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plano de Ação */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              📋 Plano de Ação (Opcional)
            </h3>
            <textarea
              value={planoAcao}
              onChange={(e) => setPlanoAcao(e.target.value)}
              placeholder="Descreva qualquer ação planejada para este dia (observações, metas, etc)..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Nota:</span> Todos os dados serão salvos no banco de dados quando você clicar em "Confirmar e Salvar".
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-slate-300 text-slate-800 rounded-lg font-semibold hover:bg-slate-400 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirmar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSalvar;