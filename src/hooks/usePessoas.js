import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const usePessoas = () => {
  const [initialPeople, setInitialPeople] = useState([]);
  const [operacoes, setOperacoes]         = useState([]);
  const [cds, setCds]                     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .order('operacao', { ascending: true });
      if (error) throw error;
      if (data) {
        setInitialPeople(data);
        // Operações — exclui ANALISTA GERAL e SUPORTE, COMPARTILHADO vai pro final
        const sorted = [...new Set(data.map(p => p.operacao))]
          .filter(op => op !== 'ANALISTA GERAL' && op !== 'SUPORTE')
          .sort();
        const idx = sorted.indexOf('COMPARTILHADO');
        if (idx > -1) { sorted.splice(idx, 1); sorted.push('COMPARTILHADO'); }
        setOperacoes(sorted);
        // CDs — valores únicos não-nulos, ordenados
        const cdsSorted = [...new Set(data.map(p => p.cd).filter(Boolean))].sort();
        setCds(cdsSorted);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  return { initialPeople, operacoes, cds, loading, error, refetch: fetchPeople };
};