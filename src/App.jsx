import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import SectorAssignment from './components/SectorAssignment';
import Historico from './components/Historico';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import CadastroFuncionarios from './components/CadastroFuncionarios';
import Header from './components/Header';

function App() {
  const { user, isAdmin, loading, handleLogout } = useAuth();
  const [tela, setTela] = useState('atribuicao');

  const handleLogoutCompleto = async () => {
    await handleLogout();
    setTela('atribuicao');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="text-slate-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const renderTela = () => {
    switch (tela) {
      case 'admin':
        return isAdmin ? <AdminPanel /> : null;
      case 'historico':
        return <Historico />;
      case 'funcionarios':
        return <CadastroFuncionarios />;
      default:
        return <SectorAssignment />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogoutCompleto}
        onNavigate={setTela}
        telaAtiva={tela}
      />
      {renderTela()}
    </div>
  );
}

export default App;