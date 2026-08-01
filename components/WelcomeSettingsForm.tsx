import React, { useEffect, useState } from 'react';
import { Video, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { getWelcomeVideo, saveWelcomeVideo } from '../lib/db';
import { extractYouTubeId, getYouTubeThumbnail } from '../lib/video';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

/**
 * Admin panel for the "Boas-vindas" tab: configure the welcome video
 * shown to students on the Courses home (Minhas Aulas).
 */
const WelcomeSettingsForm: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const settings = await getWelcomeVideo();
      const url = settings?.videoUrl || '';
      setVideoUrl(url);
      setSavedUrl(url);
      setLoading(false);
    };
    load();
  }, []);

  const videoId = extractYouTubeId(videoUrl);
  const previewThumbnail = videoId ? getYouTubeThumbnail(videoUrl) : null;
  const hasChanges = videoUrl.trim() !== savedUrl;

  const handleSave = async () => {
    if (videoUrl.trim() && !videoId) {
      setFeedback({ type: 'error', message: 'Cole uma URL válida do YouTube (watch, youtu.be ou embed).' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    const ok = await saveWelcomeVideo(videoUrl);
    setSaving(false);

    if (ok) {
      setSavedUrl(videoUrl.trim());
      setFeedback({
        type: 'success',
        message: videoUrl.trim()
          ? 'Vídeo de boas-vindas salvo! Ele já aparece na tela de Aulas dos alunos.'
          : 'Vídeo removido. A tela de Aulas voltou a exibir o texto de boas-vindas.',
      });
    } else {
      setFeedback({ type: 'error', message: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' });
    }
  };

  const handleRemove = async () => {
    setVideoUrl('');
    setSaving(true);
    setFeedback(null);
    const ok = await saveWelcomeVideo('');
    setSaving(false);

    if (ok) {
      setSavedUrl('');
      setFeedback({ type: 'success', message: 'Vídeo removido. A tela de Aulas voltou a exibir o texto de boas-vindas.' });
    } else {
      setFeedback({ type: 'error', message: 'Não foi possível remover o vídeo. Tente novamente.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
        <p className="text-[#9CA3AF] animate-pulse">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card className="p-6 md:p-8 border-white/[0.06] bg-[#111111]/80 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00]">
            <Video size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F3F4F6]">Vídeo de Boas-vindas</h3>
            <p className="text-xs text-[#9CA3AF]">
              Exibido na tela de Aulas, no lugar do texto "Bem-vindo ao Fluentoria".
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#F3F4F6]">URL do vídeo (YouTube)</label>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setFeedback(null);
            }}
            className="w-full"
          />
          <p className="text-[11px] text-[#9CA3AF]">
            Dica: suba como "não listado" no YouTube — só quem tem o link (os alunos) consegue assistir.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-[#F3F4F6]">Pré-visualização</span>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-black">
            {previewThumbnail ? (
              <>
                <img
                  src={previewThumbnail}
                  alt="Pré-visualização do vídeo de boas-vindas"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg">
                    <Video size={22} className="text-white" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                <Video size={28} className="opacity-40" />
                <span className="text-xs">
                  {videoUrl.trim() ? 'URL inválida — cole um link do YouTube' : 'Nenhum vídeo configurado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-[#23D18B]/10 border-[#23D18B]/30 text-[#23D18B]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges || (!!videoUrl.trim() && !videoId)}
            className="gap-2 flex-1 sm:flex-none"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {saving ? 'Salvando...' : 'Salvar vídeo'}
          </Button>

          {savedUrl && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={saving}
              className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              Remover vídeo
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WelcomeSettingsForm;
