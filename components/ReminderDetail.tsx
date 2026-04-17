import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { Reminder, markReminderAsRead, unmarkReminderAsRead } from '../lib/db';
import { getEmbedUrl } from '../lib/video';
import { useAppStore } from '../lib/stores/appStore';

interface ReminderDetailProps {
  onBack: () => void;
  reminder: Reminder | null;
  isRead: boolean;
  onReadStatusChange?: (reminderId: string, isRead: boolean) => void;
}

const ReminderDetail: React.FC<ReminderDetailProps> = ({ onBack, reminder, isRead, onReadStatusChange }) => {
  const user = useAppStore(state => state.user);
  const [marking, setMarking] = useState(false);
  const [localRead, setLocalRead] = useState(isRead);

  useEffect(() => {
    setLocalRead(isRead);
  }, [isRead, reminder?.id]);

  if (!reminder) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen bg-[#12100e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-400 mb-4">Lembrete nao encontrado</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(reminder.videoUrl);

  const handleToggleRead = async () => {
    if (!user || !reminder.id) {
      return;
    }

    setMarking(true);
    const saved = localRead
      ? await unmarkReminderAsRead(user.uid, reminder.id)
      : await markReminderAsRead(user.uid, reminder.id);

    if (saved) {
      const nextStatus = !localRead;
      setLocalRead(nextStatus);
      onReadStatusChange?.(reminder.id, nextStatus);
    }

    setMarking(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#0B0B0B] flex flex-col">
      <div className="p-4 md:p-6 flex items-center gap-3 md:gap-4 border-b border-white/[0.06] sticky top-0 bg-[#0B0B0B]/95 backdrop-blur-sm z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/[0.02] rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] transition-all duration-200">
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-[#F3F4F6] truncate">{reminder.title}</h1>
          <p className="text-xs text-[#9CA3AF]">Lembrete global</p>
        </div>

        <button
          onClick={handleToggleRead}
          disabled={marking}
          className={`px-3 md:px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 shrink-0 disabled:opacity-60 ${localRead
            ? 'bg-[#23D18B]/20 text-[#23D18B] border border-[#23D18B]/30 hover:bg-[#23D18B]/30'
            : 'bg-[#FF6A00]/20 text-[#FFB37A] border border-[#FF6A00]/30 hover:bg-[#FF6A00]/30'
            }`}
        >
          {marking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {localRead ? 'Marcar como nao lido' : 'Marcar como lido'}
        </button>
      </div>

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
        <div className="aspect-video w-full bg-[#111111] rounded-xl overflow-hidden border border-white/[0.06] shadow-card">
          {embedUrl ? (
            <iframe
              className="w-full h-full"
              src={embedUrl}
              title={reminder.title}
              frameBorder="0"
              allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : reminder.videoUrl ? (
            <video className="w-full h-full" controls src={reminder.videoUrl} poster={reminder.coverImage}>
              Seu navegador nao suporta video.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
              <div className="text-center space-y-2">
                <PlayCircle size={36} className="mx-auto text-[#FF6A00]" />
                <p>Nenhum video disponivel para este lembrete.</p>
              </div>
            </div>
          )}
        </div>

        <section className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 space-y-3 shadow-card">
          <h2 className="text-lg font-semibold text-[#F3F4F6]">Mensagem</h2>
          <p className="text-[#D1D5DB] whitespace-pre-wrap leading-relaxed">{reminder.message}</p>
        </section>
      </div>
    </div>
  );
};

export default ReminderDetail;
