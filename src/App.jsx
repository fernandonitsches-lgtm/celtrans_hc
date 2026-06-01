import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import SectorAssignment from './components/SectorAssignment';
import Historico from './components/Historico';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import CadastroFuncionarios from './components/CadastroFuncionarios';
import RankingFaltas from './components/RankingFaltas';
import Sidebar from './components/Sidebar';
import SplashScreen from './components/SplashScreen';

function App() {
  const { user, isAdmin, userCd, loading, handleLogout } = useAuth();
  const [tela, setTela] = useState('atribuicao');
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogoutCompleto = async () => {
    await handleLogout();
    setTela('atribuicao');
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLoginSuccess={() => {}} />;

  // Aguarda userCd carregar antes de renderizar (evita flash de tudo → filtrado)
  if (userCd === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const renderTela = () => {
    switch (tela) {
      case 'admin':
        return isAdmin ? <AdminPanel /> : null;
      case 'historico':
        return <Historico userCd={userCd} />;
      case 'funcionarios':
        return <CadastroFuncionarios />;
      case 'dashboard':
        return <SectorAssignment forcarDashboard={true} userCd={userCd} />;
      case 'ranking':
        return (
          <div className="p-6">
            <RankingFaltas filterCdExterno={userCd} />
          </div>
        );
      default:
        return <SectorAssignment userCd={userCd} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        user={user}
        isAdmin={isAdmin}
        telaAtiva={tela}
        onNavigate={setTela}
        onLogout={handleLogoutCompleto}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {renderTela()}
      </div>
    </div>
  );
}

export default App;