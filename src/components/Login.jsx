import { supabase } from '../lib/supabase';
import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader, Eye, EyeOff, Shield } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError('Email ou senha incorretos'); return; }
      onLoginSuccess(data.user);
    } catch (err) {
      setError('Erro ao processar requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f4ff 50%, #e8f0fe 100%)' }}>

      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute opacity-5"
            style={{
              left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`,
              width: 0, height: 0,
              borderTop: '40px solid transparent', borderBottom: '40px solid transparent',
              borderLeft: '65px solid #1e40af',
              transform: `rotate(${i * 15}deg)`
            }} />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex gap-1">
              {[0.4, 0.7, 1].map((op, i) => (
                <div key={i} className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-green-500" style={{ opacity: op }} />
              ))}
            </div>
            <span className="text-slate-800 text-xl font-bold">CelTrans</span>
          </div>
          <p className="text-slate-400 text-xs tracking-widest uppercase mb-4">Supply Chain Integrated</p>

          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Head<span className="text-green-500">Count</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm">Acesse a plataforma de gestão operacional</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha" required
                className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 mt-2">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
            Entrar →
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px flex-1 bg-slate-200"></div>
            <Shield className="w-4 h-4 text-slate-300" />
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          <button className="text-blue-600 text-sm hover:underline">Solicite acesso ao administrador</button>
        </div>

        <p className="text-center text-slate-400 text-xs mt-4 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          Acesso seguro e monitorado. Seus dados estão protegidos.
        </p>
      </div>
    </div>
  );
};

export default Login;