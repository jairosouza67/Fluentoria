import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Clock3, Loader2, PlayCircle } from 'lucide-react';
import { Screen } from '../types';
import { Reminder, getReminderReadsForUser, getRemindersForUser, markReminderAsRead, unmarkReminderAsRead } from '../lib/db';
import { useAppStore } from '../lib/stores/appStore';
import { getYouTubeThumbnail } from '../lib/video';
import AnimatedInput from './ui/AnimatedInput';

interface ReminderListProps {
  onNavigate: (screen: Screen) => void;
  onSelectReminder: (reminder: Reminder, isRead: boolean) => void;
}

const toMillis = (value: unknown): number => {
  if (!value) return 0;

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const dateValue = (value as { toDate?: () => Date }).toDate?.();
    if (dateValue instanceof Date) {
      return dateValue.getTime();
    }
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  return parsed.getTime();
};

const ReminderList: React.FC<ReminderListProps> = ({ onNavigate, onSelectReminder }) => {
  const user = useAppStore(state => state.user);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [readReminderIds, setReadReminderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setReminders([]);
        setReadReminderIds(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);
      const [reminderData, reads] = await Promise.all([
        getRemindersForUser(user.uid),
        getReminderReadsForUser(user.uid),
      ]);

      setReminders(reminderData);
      setReadReminderIds(new Set(reads.map(read => read.reminderId)));
      setLoading(false);
    };

    loadData();
  }, [user]);

  const filteredReminders = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    const filtered = reminders.filter(reminder => {
      if (!normalized) return true;
      return (
        reminder.title.toLowerCase().includes(normalized) ||
        reminder.message.toLowerCase().includes(normalized)
      );
    });

    return [...filtered].sort((a, b) => {
      const aId = a.id || '';
      const bId = b.id || '';
      const aRead = aId ? readReminderIds.has(aId) : false;
      const bRead = bId ? readReminderIds.has(bId) : false;

      if (aRead !== bRead) {
        return aRead ? 1 : -1;
      }

      return toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
    });
  }, [reminders, readReminderIds, searchTerm]);

  const handleToggleRead = async (reminderId: string, isRead: boolean) => {
    if (!user || !reminderId) {
      return;
    }

    setMarkingId(reminderId);
    const saved = isRead
      ? await unmarkReminderAsRead(user.uid, reminderId)
      : await markReminderAsRead(user.uid, reminderId);

    if (saved) {
      setReadReminderIds(prev => {
        const next = new Set(prev);
        if (isRead) {
          next.delete(reminderId);
        } else {
          next.add(reminderId);
        }
        return next;
      });
    }

    setMarkingId(null);
  };

  return (
    <div className="p-8 max-w-container mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.05] font-bold text-[#F3F4F6]">Lembretes</h1>
          <p className="text-[#9CA3AF] mt-1">Avisos e mensagens globais para manter seu estudo em dia.</p>
        </div>

        <div className="w-full md:w-72">
          <AnimatedInput
            type="search"
            placeholder="Buscar lembretes..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon="search"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-white/[0.03] flex items-center justify-center">
            <Bell className="text-[#9CA3AF]" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-[#F3F4F6]">Nenhum lembrete disponivel</h3>
          <p className="text-[#9CA3AF] mt-2">Quando novos lembretes forem publicados, eles aparecerao aqui.</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-10 text-center">
          <h3 className="text-lg font-semibold text-[#F3F4F6]">Nenhum resultado encontrado</h3>
          <p className="text-[#9CA3AF] mt-2">Tente ajustar o termo da busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReminders.map(reminder => {
            const reminderId = reminder.id || '';
            const isRead = reminderId ? readReminderIds.has(reminderId) : false;
            const thumbnail = reminder.coverImage || getYouTubeThumbnail(reminder.videoUrl);

            return (
              <div
                key={reminderId || reminder.title}
                onClick={() => {
                  onSelectReminder(reminder, isRead);
                  onNavigate('reminder-detail');
                }}
                className="group bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#FF6A00]/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-card hover:shadow-elevated"
              >
                <div className="relative">
                  {thumbnail ? (
                    <img src={thumbnail} alt={reminder.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f]" />
                  )}

                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ${isRead
                        ? 'bg-[#23D18B]/20 text-[#23D18B] border-[#23D18B]/40'
                        : 'bg-[#FF6A00]/20 text-[#FFB37A] border-[#FF6A00]/40'
                        }`}
                    >
                      {isRead ? 'Lido' : 'Nao lido'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#F3F4F6] line-clamp-1 group-hover:text-[#FF6A00] transition-colors">
                      {reminder.title}
                    </h3>
                    <p className="text-sm text-[#9CA3AF] mt-2 line-clamp-3">{reminder.message}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1.5">
                      <PlayCircle size={12} className="text-[#FF6A00]" />
                      Video
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={12} className="text-[#FF6A00]" />
                      Lembrete global
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (reminderId) {
                          onSelectReminder(reminder, isRead);
                          onNavigate('reminder-detail');
                        }
                      }}
                      className="text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
                    >
                      Ver detalhes
                    </button>

                    <button
                      type="button"
                      disabled={!reminderId || markingId === reminderId}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (reminderId) {
                          void handleToggleRead(reminderId, isRead);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60 ${isRead
                        ? 'text-[#23D18B] hover:text-[#8EF0C2]'
                        : 'text-[#FF6A00] hover:text-[#FFB37A]'
                        }`}
                    >
                      {markingId === reminderId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {isRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReminderList;
