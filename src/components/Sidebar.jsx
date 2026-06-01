import React from 'react';
import {
  LayoutDashboard, Calendar, Users,
  TrendingDown, Settings, LogOut, ChevronLeft, ChevronRight,
  History
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'atribuicao', label: 'Atribuição Diária', icon: Calendar },
  { id: 'funcionarios', label: 'Funcionários', icon: Users },
  { id: 'historico', label: 'Histórico', icon: History },
  { id: 'ranking', label: 'Ranking de Faltas', icon: TrendingDown },
];

const adminItems = [
  { id: 'admin', label: 'Configurações', icon: Settings },
];

const Sidebar = ({ user, isAdmin, telaAtiva, onNavigate, onLogout, collapsed, onToggle }) => {
  const primeiroNome = user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-900 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="flex gap-0.5">
              {[0.4, 0.7, 1].map((op, i) => (
                <div key={i} className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[13px] border-l-green-400" style={{ opacity: op }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0.4, 0.7, 1].map((op, i) => (
                <div key={i} className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[13px] border-l-green-400" style={{ opacity: op }} />
              ))}
            </div>
            <div>
              <span className="text-white font-bold text-sm">CelTrans</span>
              <p className="text-slate-500 text-xs">HeadCount</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const ativo = telaAtiva === item.id;
          const isRanking = item.id === 'ranking';
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                ativo
                  ? isRanking
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2">
                <p className="text-xs text-slate-600 uppercase tracking-wider px-3">Administração</p>
              </div>
            )}
            {adminItems.map(item => {
              const Icon = item.icon;
              const ativo = telaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    ativo
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">{primeiroNome}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">Admin</span>
            )}
          </div>
        )}

        <button
          onClick={onLogout}
          title={collapsed ? 'Sair' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
};

export default Sidebar;