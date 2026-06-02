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
      console.log('[useAuth] timeout disparou — forçando userCd=todos');
      setUserCd(prev => (prev === null ? 'todos' : prev));
      setLoading(false);
    }, 6000);
  };

  const fetchUserCd = async (currentUser) => {
    if (!currentUser) { setUserCd('todos'); return; }
    if (ADMIN_EMAILS.includes(currentUser.email)) { setUserCd('todos'); return; }

    try {
      console.log('[useAuth] buscando CD para:', currentUser.email);
      const { data, error } = await supabase
        .from('user_cds')
        .select('cd')
        .eq('user_id', currentUser.id)
        .limit(1);

      console.log('[useAuth] resultado user_cds:', { data, error });

      if (error) {
        console.error('[useAuth] erro RLS user_cds:', error.message);
        setUserCd('todos');
      } else {
        setUserCd(data?.[0]?.cd ?? 'todos');
      }
    } catch (err) {
      console.error('[useAuth] erro inesperado:', err);
      setUserCd('todos');
    }
  };

  useEffect(() => {
    // Não inicia loading até o onAuthStateChange confirmar sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange:', event, session?.user?.email);

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAdmin(false);
        setUserCd('todos');
        setLoading(false);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      setIsAdmin(ADMIN_EMAILS.includes(currentUser.email));

      iniciarTimeout();
      await fetchUserCd(currentUser);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[useAuth] erro ao fazer logout:', error);
    }
  };

  return { user, isAdmin, userCd, loading, handleLogout };
};