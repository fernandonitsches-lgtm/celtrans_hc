import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OPERACOES_EXCLUIDAS, OP_COMPARTILHADO } from '../constants/operacoes';

export const usePessoas = () => {
  const [initialPeople, setInitialPeople] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pessoas')
          .select('*')
          .order('operacao', { ascending: true });

        if (error) throw error;

        if (data) {
          setInitialPeople(data);
          const sorted = [...new Set(data.map(p => p.operacao))]
            .filter(op => !OPERACOES_EXCLUIDAS.includes(op))
            .sort();
          const idx = sorted.indexOf(OP_COMPARTILHADO);
          if (idx > -1) { sorted.splice(idx, 1); sorted.push(OP_COMPARTILHADO); }
          setOperacoes(sorted);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, []);

  return { initialPeople, operacoes, loading, error };
};