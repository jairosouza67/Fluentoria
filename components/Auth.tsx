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
    <div className="min-h-screen flex items-center justify-start bg-[#0B0B0B] p-4 md:p-8 lg:p-12 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Instructor Photo Background - accepts both .jpg and .png */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{
            backgroundImage: 'url("/instructor-photo.png"), url("/instructor-photo.jpg")',
            backgroundPosition: '80% 10%',
            backgroundSize: '55%',
          }}
        />
        
        {/* Multi-layer Dark Overlay - lighter to show photo better */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/80 via-[#0B0B0B]/50 to-[#0B0B0B]/30" />
        <div className="absolute inset-0 bg-[#0B0B0B]/20" />
        
        {/* Orange Accent Gradients - more visible */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6A00]/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-[#E15B00]/12" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#FF6A00]/25 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-[#E15B00]/25 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-[10%] w-[25%] h-[25%] bg-orange-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Login Card - Aligned to Left */}
      <div className="w-full max-w-md relative z-10 animate-fade-in ml-0 lg:ml-12">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="inline-block">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#FF6A00] via-[#FFB800] to-[#FF6A00] bg-clip-text text-transparent mb-3 drop-shadow-2xl animate-gradient bg-[length:200%_auto]">
              Fluentoria
            </h1>
            <div className="h-1 bg-gradient-to-r from-[#FF6A00] via-[#FFB800] to-transparent rounded-full" />
          </div>
          <p className="text-[#F3F4F6] text-base font-medium mt-4">
            {isLogin ? 'Welcome back to your learning journey' : 'Start your English fluency journey'}
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-[#0B0B0B]/70 backdrop-blur-3xl rounded-3xl p-9 border border-white/[0.2] shadow-2xl shadow-black/40 hover:shadow-[#FF6A00]/20 transition-all duration-500">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-[#9CA3AF] text-sm">
              {isLogin ? 'Continue your path to fluency' : 'Begin your transformation today'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm backdrop-blur-sm">
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
              className="w-full bg-gradient-to-r from-[#FF6A00] to-[#E15B00] hover:from-[#E15B00] hover:to-[#FF6A00] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF6A00]/30 hover:shadow-[#FF6A00]/50 hover:scale-[1.02] flex items-center justify-center gap-2 mt-6 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#111111]/40 text-[#9CA3AF] backdrop-blur-sm">or continue with</span>
            </div>
          </div>

          {/* Google Login Button - More Discrete */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-[#9CA3AF] hover:text-[#F3F4F6] font-normal py-2.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border border-white/[0.08] hover:border-white/[0.12]"
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
                <span className="text-sm">Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-[#9CA3AF] hover:text-[#FF6A00] transition-colors font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <a href="#" className="text-xs text-[#9CA3AF] hover:text-[#FF6A00] transition-colors">Forgot your password?</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
