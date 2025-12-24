
import React from 'react';
import { Play, Heart, Clock, Wind } from 'lucide-react';

const MindfulFlow: React.FC = () => {
  const sessions = [
    { id: 1, title: 'Respiração Profunda', duration: '5 min', category: 'Foco', color: 'bg-emerald-500/20 text-emerald-500' },
    { id: 2, title: 'Alívio de Ansiedade', duration: '10 min', category: 'Calma', color: 'bg-blue-500/20 text-blue-500' },
    { id: 3, title: 'Preparação para Reunião', duration: '3 min', category: 'Performance', color: 'bg-orange-500/20 text-orange-500' },
    { id: 4, title: 'Scan Corporal', duration: '15 min', category: 'Relaxamento', color: 'bg-purple-500/20 text-purple-500' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12 space-y-4">
        <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wind className="text-stone-300" size={32} />
        </div>
        <h1 className="text-4xl font-bold text-white">Mindful Flow</h1>
        <p className="text-stone-400 max-w-md mx-auto">
          Faça uma pausa. Reconecte-se com o momento presente para melhorar seu foco e bem-estar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-[#1c1917] border border-stone-800 p-6 rounded-xl hover:border-stone-600 transition-all group cursor-pointer relative overflow-hidden">
             <div className="flex justify-between items-start relative z-10">
               <div className="space-y-2">
                 <span className={`text-xs font-bold px-2 py-1 rounded ${session.color}`}>
                   {session.category}
                 </span>
                 <h3 className="text-xl font-semibold text-white mt-2 group-hover:text-orange-500 transition-colors">{session.title}</h3>
                 <div className="flex items-center gap-2 text-stone-500 text-sm">
                   <Clock size={14} />
                   <span>{session.duration}</span>
                 </div>
               </div>
               
               <button className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-stone-700 transition-colors">
                 <Heart size={18} />
               </button>
             </div>

             <button className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg z-10">
               <Play size={20} fill="black" />
             </button>
             
             {/* Decorative gradient */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-stone-800/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>
      
      {/* Featured Large Card */}
      <div className="mt-8 bg-gradient-to-r from-orange-900/40 to-[#1c1917] border border-stone-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Sessão do Dia</h2>
          <p className="text-stone-400">Um exercício guiado de 5 minutos para clareza mental antes de começar seu trabalho.</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/20 whitespace-nowrap">
          <Play size={18} fill="white" />
          Iniciar Agora
        </button>
      </div>
    </div>
  );
};

export default MindfulFlow;
