import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../constants/auth';

export const useAuth = () => {
  const [user, setUser]       = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCd, setUserCd]   = useState(null);
  const [loading, setLoading] = useState(true);

  const resolverCd = (currentUser) => {
    if (!currentUser) return 'todos';
    if (ADMIN_EMAILS.includes(currentUser.email)) return 'todos';
    // Lê o CD direto dos metadados do usuário — sem query extra
    return currentUser.user_metadata?.cd ?? 'todos';
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuth] onAuthStateChange:', event, session?.user?.email);

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAdmin(false);
        setUserCd('todos');
        setLoading(false);
        return;
      }

      const currentUser = session.user;
      const cd = resolverCd(currentUser);
      console.log('[useAuth] CD resolvido:', cd);

      setUser(currentUser);
      setIsAdmin(ADMIN_EMAILS.includes(currentUser.email));
      setUserCd(cd);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
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