
import React from 'react';
import { Camera, Mail, User, Shield, Bell, LogOut, Award, Clock, Zap } from 'lucide-react';
import { UserStats } from '../types';

const Profile: React.FC = () => {
  const stats: UserStats = {
    completedCourses: 12,
    hoursStudied: 48,
    streakDays: 5
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Avatar & Stats */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-6 text-center space-y-4">
            <div className="relative w-28 h-28 mx-auto">
              <img 
                src="https://ui-avatars.com/api/?name=Maria+Silva&background=random&color=fff&size=128" 
                alt="Profile" 
                className="w-full h-full rounded-full border-4 border-stone-800"
              />
              <button className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full text-white hover:bg-orange-600 transition-colors border border-[#1c1917]">
                <Camera size={16} />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Maria Silva</h2>
              <p className="text-sm text-stone-500">UX Designer Senior</p>
            </div>
          </div>

          <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Estatísticas</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-blue-900/30 text-blue-400 flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.completedCourses}</p>
                <p className="text-xs text-stone-500">Cursos Completos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-purple-900/30 text-purple-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.hoursStudied}h</p>
                <p className="text-xs text-stone-500">Tempo de Estudo</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-orange-900/30 text-orange-400 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.streakDays} dias</p>
                <p className="text-xs text-stone-500">Ofensiva Atual</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="flex-1 bg-[#1c1917] border border-stone-800 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-white mb-6">Informações Pessoais</h3>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-stone-400">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={16} />
                  <input type="text" defaultValue="Maria Silva" className="w-full bg-[#292524] border border-stone-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-stone-400">Cargo</label>
                <input type="text" defaultValue="UX Designer" className="w-full bg-[#292524] border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-stone-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={16} />
                <input type="email" defaultValue="maria.silva@email.com" className="w-full bg-[#292524] border border-stone-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div className="pt-6 border-t border-stone-800 space-y-4">
              <h3 className="text-lg font-semibold text-white">Preferências</h3>
              
              <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-stone-400" />
                  <span className="text-stone-300 text-sm">Notificações por Email</span>
                </div>
                <div className="w-10 h-5 bg-orange-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-stone-400" />
                  <span className="text-stone-300 text-sm">Perfil Público</span>
                </div>
                 <div className="w-10 h-5 bg-stone-600 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow"></div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button type="button" className="text-red-500 hover:text-red-400 text-sm flex items-center gap-2 font-medium">
                <LogOut size={16} />
                Sair da Conta
              </button>
              <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
