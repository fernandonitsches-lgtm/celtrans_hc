import React from 'react';
import { LogOut, Settings, History, Users } from 'lucide-react';

const Header = ({ user, isAdmin, onLogout, onNavigate, telaAtiva }) => {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          Logado como:{' '}
          <span className={`font-semibold ${isAdmin ? 'text-purple-600' : ''}`}>
            {isAdmin ? '🔐 ' : ''}{user.email}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {telaAtiva !== 'atribuicao' && (
            <button
              onClick={() => onNavigate('atribuicao')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              ← Voltar
            </button>
          )}
          {telaAtiva === 'atribuicao' && (
            <button
              onClick={() => onNavigate('historico')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
          )}
          {telaAtiva === 'atribuicao' && (
            <button
              onClick={() => onNavigate('funcionarios')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
            >
              <Users className="w-4 h-4" />
              Funcionários
            </button>
          )}
          {isAdmin && telaAtiva !== 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;