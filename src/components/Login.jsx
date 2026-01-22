import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import SectorAssignment from './components/SectorAssignment';
import Login from './components/Login';
import { LogOut } from 'lucide-react';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se usuário já está logado ao carregar
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
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
        setUser(session?.user || null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
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

  // Se está logado, mostrar sistema de atribuição
  return (
    <div>
      <div className="absolute top-4 right-4 flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-md">
        <span className="text-sm text-slate-600">
          Logado como: <span className="font-semibold">{user.email}</span>
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
      <SectorAssignment />
    </div>
  );
}

export default App;
