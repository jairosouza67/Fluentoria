import React from 'react';
import { Search, Plus, Calendar, Clock, Edit2, ChevronDown } from 'lucide-react';
import { ClassItem } from '../types';

const AdminCatalog: React.FC = () => {
  const classes: ClassItem[] = [
    { id: '1', title: 'Introdução ao Design de UI', duration: '3h 30m', launchDate: '25/10/24', gradient: 'from-stone-700 via-stone-600 to-orange-900' },
    { id: '2', title: 'Princípios de UX Research', duration: '4h 15m', launchDate: '18/10/24', gradient: 'from-stone-600 via-stone-500 to-yellow-900/50' },
    { id: '3', title: 'Design Systems Avançado', duration: '6h 00m', launchDate: '15/11/24', gradient: 'from-stone-700 via-neutral-600 to-stone-500' },
    { id: '4', title: 'Prototipagem Interativa', duration: '2h 45m', launchDate: '01/12/24', gradient: 'from-teal-800/80 via-emerald-600/50 to-stone-800' },
    { id: '5', title: 'Gestão de Projetos de Design', duration: '5h 30m', launchDate: '10/01/25', gradient: 'from-emerald-900 via-teal-800 to-stone-900' },
    { id: '6', title: 'Acessibilidade Digital na Prática', duration: '3h 00m', launchDate: '22/01/25', gradient: 'from-cyan-900 via-sky-800 to-stone-900' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Catálogo de Aulas</h1>
            <p className="text-stone-400">Gerencie, adicione e edite as aulas disponíveis.</p>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-orange-900/20">
            <Plus size={18} />
            <span>Nova Aula</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome da aula..." 
              className="w-full bg-[#292524] border border-transparent focus:border-orange-500/50 text-stone-200 pl-10 pr-4 py-3 rounded-lg focus:outline-none placeholder-stone-500 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-3 bg-[#292524] text-stone-300 px-4 py-3 rounded-lg hover:bg-[#35302e] transition-colors min-w-[180px] justify-between">
              <span>Data de Lançamento</span>
              <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-3 bg-[#292524] text-stone-300 px-4 py-3 rounded-lg hover:bg-[#35302e] transition-colors min-w-[140px] justify-between">
              <span>Duração</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {classes.map((item) => (
          <div key={item.id} className="bg-[#1c1917] border border-stone-800 rounded-xl overflow-hidden hover:border-orange-500/40 transition-all group">
            {/* Gradient Cover */}
            <div className={`h-40 w-full bg-gradient-to-br ${item.gradient} relative`}>
              {/* Grainy overlay for texture */}
               <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight min-h-[3rem]">
                {item.title}
              </h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-stone-500 text-sm">
                  <Clock size={14} />
                  <span>Duração: <span className="text-stone-300">{item.duration}</span></span>
                </div>
                <div className="flex items-center gap-2 text-stone-500 text-sm">
                  <Calendar size={14} />
                  <span>Lançamento: <span className="text-stone-300">{item.launchDate}</span></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <button className="text-orange-500 font-medium text-sm hover:text-orange-400">
                  Ver detalhes
                </button>
                <button className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCatalog;
