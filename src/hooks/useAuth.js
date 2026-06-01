import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../constants/auth';

export const useAuth = () => {
  const [user, setUser]       = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCd, setUserCd]   = useState(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef            = useRef(null);

  const iniciarTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setUserCd(prev => (prev === null ? 'todos' : prev));
      setLoading(false);
    }, 6000);
  };

  const fetchUserCd = async (currentUser) => {
    if (!currentUser) { setUserCd('todos'); return; }

    if (ADMIN_EMAILS.includes(currentUser.email)) {
      setUserCd('todos');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_cds')
        .select('cd')
        .eq('user_id', currentUser.id)
        .limit(1);

      console.log('[useAuth] fetchUserCd:', { id: currentUser.id, email: currentUser.email, data, error });

      if (error) {
        console.error('[useAuth] Erro ao buscar CD:', error.message);
        setUserCd('todos');
      } else {
        setUserCd(data?.[0]?.cd ?? 'todos');
      }
    } catch (err) {
      console.error('[useAuth] Erro inesperado:', err);
      setUserCd('todos');
    }
  };

  useEffect(() => {
    iniciarTimeout();

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[useAuth] getUser:', user?.email);
        setUser(user);
        setIsAdmin(ADMIN_EMAILS.includes(user?.email));
        await fetchUserCd(user);
      } catch (error) {
        console.error('[useAuth] Erro ao verificar usuário:', error);
        setUserCd('todos');
      } finally {
        setLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange:', event, session?.user?.email);
      const currentUser = session?.user || null;
      setUser(currentUser);
      setIsAdmin(ADMIN_EMAILS.includes(currentUser?.email));
      iniciarTimeout();
      await fetchUserCd(currentUser);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    });

    return () => {
      subscription?.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setUserCd('todos');
    } catch (error) {
      console.error('[useAuth] Erro ao fazer logout:', error);
    }
  };

  return { user, isAdmin, userCd, loading, handleLogout };
  
};