import { supabase } from '../lib/supabase';
import React, { useState } from 'react';
import { X, UserX, ArrowRight, AlertCircle } from 'lucide-react';
import { MOTIVOS_AUSENCIA } from '../constants/motivos';

const ModalColaborador = ({
  person,
  isOpen,
  onClose,
  onMarcarFalta,
  onMover,
  onLicenca,
  setoresPorOperacao,
  operacoes,
}) => {
  const [acao, setAcao] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [operacaoDestino, setOperacaoDestino] = useState('');
  const [setorDestino, setSetorDestino] = useState('');
  const [erro, setErro] = useState('');

  if (!isOpen || !person) return null;

  const handleClose = () => {
    setAcao(null);
    setMotivo('');
    setObservacao('');
    setOperacaoDestino('');
    setSetorDestino('');
    setErro('');
    onClose();
  };

  const handleConfirmarFalta = () => {
    if (!motivo) { setErro('Selecione o motivo da ausência'); return; }
    if (motivo === 'outros' && !observacao.trim()) { setErro('Descreva o motivo em "Outros"'); return; }
    if (motivo === 'licenca_maternidade_paternidade') {
      onLicenca(person);
      handleClose();
      return;
    }
    onMarcarFalta(person, motivo, motivo === 'outros' ? observacao : '');
    handleClose();
  };

  const handleConfirmarMover = () => {
    if (!operacaoDestino || !setorDestino) { setErro('Selecione operação e setor de destino'); return; }
    onMover(person, `${operacaoDestino}||${setorDestino}`);
    handleClose();
  };

  const iniciais = person.name.split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {iniciais}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{person.name}</h3>
              <p className="text-sm text-slate-500">{person.cargo} · {person.operacao}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-500">Setor atual: <span className="font-semibold text-slate-700">{person.setor}</span></p>
          {person.area && <p className="text-xs text-slate-500 mt-0.5">Área: <span className="font-semibold text-slate-700">{person.area}</span></p>}
        </div>

        {/* Ações */}
        {!acao && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">O que deseja fazer?</p>
            <button onClick={() => setAcao('falta')}
              className="w-full flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition text-left">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserX className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-700 text-sm">Marcar ausência</p>
                <p className="text-xs text-red-400">Registrar falta com motivo</p>
              </div>
            </button>
            <button onClick={() => setAcao('mover')}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-700 text-sm">Mover colaborador</p>
                <p className="text-xs text-blue-400">Transferir para outro setor</p>
              </div>
            </button>
          </div>
        )}

        {/* Fluxo: Falta */}
        {acao === 'falta' && (
          <div className="p-5 space-y-4">
            <button onClick={() => { setAcao(null); setErro(''); }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              ← Voltar
            </button>
            <h4 className="font-bold text-slate-800">Motivo da ausência</h4>
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs">{erro}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Selecione o motivo *</label>
              <select value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(''); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50">
                <option value="">Selecione...</option>
                {MOTIVOS_AUSENCIA.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            {motivo === 'licenca_maternidade_paternidade' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-700">
                <p className="font-semibold mb-1">⚠️ Licença especial</p>
                <p>O colaborador será marcado como "Em Licença" e não aparecerá na atribuição diária.</p>
              </div>
            )}
            {motivo === 'outros' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descreva o motivo *</label>
                <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Descreva o motivo da ausência..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-slate-50" />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setAcao(null); setErro(''); }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">
                Cancelar
              </button>
              <button onClick={handleConfirmarFalta}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition">
                Confirmar ausência
              </button>
            </div>
          </div>
        )}

        {/* Fluxo: Mover */}
        {acao === 'mover' && (
          <div className="p-5 space-y-4">
            <button onClick={() => { setAcao(null); setErro(''); }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              ← Voltar
            </button>
            <h4 className="font-bold text-slate-800">Mover para outro setor</h4>
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs">{erro}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Operação destino</label>
              <select value={operacaoDestino}
                onChange={(e) => { setOperacaoDestino(e.target.value); setSetorDestino(''); setErro(''); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50">
                <option value="">Selecione a operação...</option>
                {operacoes.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            {operacaoDestino && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Setor destino</label>
                <select value={setorDestino} onChange={(e) => { setSetorDestino(e.target.value); setErro(''); }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50">
                  <option value="">Selecione o setor...</option>
                  {setoresPorOperacao(operacaoDestino).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {operacaoDestino && setorDestino && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                <p><span className="font-semibold">{person.name}</span> será movido para:</p>
                <p className="mt-1 font-bold">{operacaoDestino} → {setorDestino}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setAcao(null); setErro(''); }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">
                Cancelar
              </button>
              <button onClick={handleConfirmarMover}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
                Confirmar mudança
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalColaborador;