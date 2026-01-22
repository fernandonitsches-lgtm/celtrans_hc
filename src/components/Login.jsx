import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2xyYm9xenZxcWh5a2xzeHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTI3MzUsImV4cCI6MjA4NDA2ODczNX0.rFmuEoiJoPnnbCBQ308FAfj1eBQo9Kc0iJSyFPX-xj0';
const supabase = createClient(supabaseUrl, supabaseKey);

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Registrar novo usuário
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          setMessage('Cadastro realizado! Faça login com suas credenciais.');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
        }
      } else {
        // Fazer login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          // Login bem-sucedido
          onLoginSuccess(data.user);
        }
      }
    } catch (err) {
      setError('Erro ao processar requisição');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-slate-800">
            {isSignUp ? 'Criar Conta' : 'Login'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength="6"
              />
            </div>
            {isSignUp && (
              <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            className="w-full text-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            {isSignUp
              ? 'Já tem conta? Faça login'
              : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
