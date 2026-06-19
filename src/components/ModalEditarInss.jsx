import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const ModalEditarInss = ({ person, isOpen, onClose, onAlterar, onEncerrar }) => {
  const [inicio, setInicio] = useState('');
  const [fim, setFim]       = useState('');
  const [erro, setErro]     = useState('');
  const [confirmarEncerrar, setConfirmarEncerrar] = useState(false);

  useEffect(() => {
    if (isOpen && person) {
      setInicio(person.inss_inicio || '');
      setFim(person.inss_fim || '');
      setErro('');
      setConfirmarEncerrar(false);
    }
  }, [isOpen, person]);

  if (!isOpen || !person) return null;

  const handleSalvar = () => {
    if (!inicio || !fim) { setErro('Informe a data de início e fim'); return; }
    if (fim < inicio) { setErro('A data fim deve ser posterior à data início'); return; }
    onAlterar(person, inicio, fim);
  };

  const iniciais = person.name.split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-400 flex items-center justify-center text-white font-bold text-sm">
              {iniciais}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{person.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1">🏥 Afastamento por INSS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-xs">{erro}</p>
            </div>
          )}

          {/* Editar período */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
            <p className="text-xs text-rose-700 font-semibold">Alterar período do afastamento</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Início *</label>
                <input type="date" value={inicio}
                  onChange={(e) => { setInicio(e.target.value); setErro(''); }}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fim *</label>
                <input type="date" value={fim}
                  onChange={(e) => { setFim(e.target.value); setErro(''); }}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white" />
              </div>
            </div>
            <button onClick={handleSalvar}
              className="w-full py-2 bg-rose-600 text-white rounded-lg font-semibold text-sm hover:bg-rose-700 transition">
              Salvar alterações
            </button>
          </div>

          {/* Encerrar afastamento */}
          <div className="border-t border-slate-100 pt-4">
            {!confirmarEncerrar ? (
              <button onClick={() => setConfirmarEncerrar(true)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">
                Encerrar afastamento agora
              </button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <p className="text-xs text-amber-700 font-semibold">
                  Encerrar o afastamento? A pessoa volta imediatamente ao fluxo normal de atribuição.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmarEncerrar(false)}
                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition">
                    Cancelar
                  </button>
                  <button onClick={() => onEncerrar(person)}
                    className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition">
                    Sim, encerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarInss;
