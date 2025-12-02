
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular autenticação
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#12100e] p-4">
      <div className="w-full max-w-md bg-[#1c1917] border border-stone-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dark LMS</h1>
          <p className="text-stone-400">
            {isLogin ? 'Bem-vindo de volta à sua jornada.' : 'Comece sua evolução hoje.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-300">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-[#292524] border border-stone-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-stone-600"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
              <input 
                type="email" 
                className="w-full bg-[#292524] border border-stone-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-stone-600"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-300">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
              <input 
                type="password" 
                className="w-full bg-[#292524] border border-stone-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-stone-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-stone-400 hover:text-orange-500 transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
        
        {isLogin && (
           <div className="mt-4 text-center">
            <a href="#" className="text-xs text-stone-500 hover:text-stone-300">Esqueceu sua senha?</a>
           </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
