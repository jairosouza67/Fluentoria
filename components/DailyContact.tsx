
import React, { useState } from 'react';
import { Calendar, Check, Volume2, ArrowRight, RefreshCw } from 'lucide-react';

const DailyContact: React.FC = () => {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const steps = [
    {
      type: 'quote',
      title: 'Frase do Dia',
      content: '"A única maneira de fazer um excelente trabalho é amar o que você faz."',
      author: 'Steve Jobs',
      sub: 'Reflita: O que te motiva hoje?'
    },
    {
      type: 'listening',
      title: 'Listening Practice',
      content: 'Ouça o áudio e repita a frase.',
      audio: true,
      phrase: 'Consistency is the key to mastery.'
    },
    {
      type: 'quiz',
      title: 'Quiz Rápido',
      question: 'Qual a tradução correta para "Improvement"?',
      options: ['Aprovação', 'Melhoria', 'Improviso'],
      answer: 1
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div className="p-8 max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <Check size={48} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Daily Contact Concluído!</h2>
        <p className="text-stone-400 mb-8 max-w-md">
          Parabéns! Você manteve sua ofensiva de 5 dias. Volte amanhã para mais pílulas de conhecimento.
        </p>
        <button 
          onClick={() => { setCompleted(false); setStep(0); }}
          className="bg-stone-800 text-stone-300 px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refazer Atividade
        </button>
      </div>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Daily Contact</h1>
          <p className="text-stone-400">Sua dose diária de evolução.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#292524] px-4 py-2 rounded-full border border-stone-800">
          <Calendar size={18} className="text-orange-500" />
          <span className="text-stone-300 font-medium">Dia 5 Streak</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-stone-800 h-1 rounded-full mb-8">
        <div 
          className="bg-orange-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${((step) / steps.length) * 100}%` }}
        />
      </div>

      {/* Activity Card */}
      <div className="bg-[#1c1917] border border-stone-800 rounded-2xl p-8 md:p-12 shadow-2xl min-h-[400px] flex flex-col justify-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center space-y-8">
          <span className="text-orange-500 font-semibold tracking-widest text-sm uppercase">{currentStep.title}</span>
          
          {currentStep.type === 'quote' && (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-serif italic text-white leading-tight">
                {currentStep.content}
              </h2>
              <p className="text-stone-500">- {currentStep.author}</p>
              <p className="text-stone-400 text-sm bg-stone-800/50 inline-block px-4 py-2 rounded-lg">{currentStep.sub}</p>
            </div>
          )}

          {currentStep.type === 'listening' && (
            <div className="space-y-8 flex flex-col items-center">
              <p className="text-xl text-stone-300">{currentStep.content}</p>
              <button className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform hover:shadow-orange-500/20">
                <Volume2 size={32} />
              </button>
              <p className="text-2xl font-bold text-white border-b border-stone-700 pb-2">{currentStep.phrase}</p>
            </div>
          )}

          {currentStep.type === 'quiz' && (
             <div className="space-y-6 w-full max-w-md mx-auto">
               <h3 className="text-2xl font-semibold text-white">{currentStep.question}</h3>
               <div className="space-y-3">
                 {currentStep.options?.map((opt, idx) => (
                   <button 
                    key={idx} 
                    className="w-full p-4 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:border-orange-500 hover:text-orange-500 transition-all text-left font-medium"
                    onClick={() => {}} // In a real app, validate answer here
                   >
                     {opt}
                   </button>
                 ))}
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleNext}
          className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-stone-200 transition-transform hover:scale-105 flex items-center gap-2 shadow-lg"
        >
          {step === steps.length - 1 ? 'Concluir' : 'Próximo'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DailyContact;
