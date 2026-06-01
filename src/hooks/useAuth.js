import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../constants/auth';

export const useAuth = () => {
  const [user, setUser]       = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCd, setUserCd]   = useState(null);  // null = ainda carregando
  const [loading, setLoading] = useState(true);

  const fetchUserCd = async (currentUser) => {
    if (!currentUser) { setUserCd('todos'); return; }

    // Admin sempre vê tudo
    if (ADMIN_EMAILS.includes(currentUser.email)) {
      setUserCd('todos');
      return;
    }

    // Busca CD restrito na tabela user_cds
    const { data, error } = await supabase
      .from('user_cds')
      .select('cd')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar CD do usuário:', error.message);
      setUserCd('todos'); // fallback seguro
    } else {
      // Se não tiver linha → sem restrição → vê tudo
      setUserCd(data?.cd ?? 'todos');
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsAdmin(ADMIN_EMAILS.includes(user?.email));
        await fetchUserCd(user);
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        setUserCd('todos');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      setIsAdmin(ADMIN_EMAILS.includes(currentUser?.email));
      await fetchUserCd(currentUser);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setUserCd('todos');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return { user, isAdmin, userCd, loading, handleLogout };
};