import React, { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createOrUpdateUser } from '../lib/db';
import AnimatedInput from './ui/AnimatedInput';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, {
            displayName: name
          });
        }
        
        // Create user in Firestore
        await createOrUpdateUser(userCredential.user.uid, {
          displayName: name || userCredential.user.displayName,
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL,
        });
      }
      onLogin();
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Ocorreu um erro. Tente novamente.";
      if (err.code === 'auth/invalid-email') message = "Email inválido.";
      if (err.code === 'auth/user-disabled') message = "Usuário desativado.";
      if (err.code === 'auth/user-not-found') message = "Usuário não encontrado.";
      if (err.code === 'auth/wrong-password') message = "Senha incorreta.";
      if (err.code === 'auth/email-already-in-use') message = "Email já está em uso.";
      if (err.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user in Firestore, merging with existing student if email matches
      await createOrUpdateUser(result.user.uid, {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      });
      
      onLogin();
    } catch (err: any) {
      console.error("Google auth error:", err);
      let message = "Erro ao fazer login com Google.";
      if (err.code === 'auth/popup-closed-by-user') message = "Login cancelado.";
      if (err.code === 'auth/popup-blocked') message = "Popup bloqueado. Permita popups para este site.";
      if (err.code === 'auth/cancelled-popup-request') message = "Login cancelado.";
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent mb-2">Fluentoria</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Bem-vindo de volta à sua jornada.' : 'Comece sua evolução hoje.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F3F4F6]">Nome Completo</label>
              <AnimatedInput
                type="text"
                value={name}
                onChange={setName}
                placeholder="Seu nome"
                icon="user"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#F3F4F6]">Email</label>
            <AnimatedInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              icon="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#F3F4F6]">Senha</label>
            <AnimatedInput
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon="password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 flex items-center justify-center gap-2 mt-6 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-card text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 text-foreground font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm">Google</span>
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-stone-400 hover:text-primary transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <a href="#" className="text-xs text-stone-500 hover:text-stone-300 transition-colors">Esqueceu sua senha?</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
