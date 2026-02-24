import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import SectorAssignment from './components/SectorAssignment';
import Historico from './components/Historico';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { LogOut, Settings, History } from 'lucide-react';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

// CONFIGURAR SEU EMAIL DE ADMIN AQUI
const ADMIN_EMAILS = [
  'tiagoabdalla2013@gmail.com',
  'rtorres@celtrans.com.br',
  'outroadmin@email.com',
];  // MUDE PARA SEU EMAIL

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  // Verificar se usuário já está logado ao carregar
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsAdmin(ADMIN_EMAILS.includes(user?.email));
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setShowAdmin(false);
      setShowHistorico(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
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

  // Se não está logado, mostrar página de login
  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Se está logado e é admin, mostrar painel admin
  if (isAdmin && showAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header fixo */}
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Logado como: <span className="font-semibold text-purple-600">🔐 {user.email}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdmin(false)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                ← Voltar
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
        <AdminPanel />
      </div>
    );
  }

  // Se está logado (user normal), mostrar sistema de atribuição
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {showHistorico ? (
        <>
          {/* Header fixo - Histórico */}
          <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Logado como: <span className="font-semibold">{user.email}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistorico(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                  ← Voltar
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setShowHistorico(false); setShowAdmin(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
          <Historico />
        </>
      ) : (
        <>
          {/* Header fixo - Atribuição */}
          <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Logado como: <span className="font-semibold">{user.email}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistorico(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                  <History className="w-4 h-4" />
                  Histórico
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
          <SectorAssignment />
        </>
      )}
    </div>
  );
}

export default App;
