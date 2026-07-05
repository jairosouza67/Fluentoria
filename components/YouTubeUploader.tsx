import React, { useState, useRef } from 'react';
import { Upload, Youtube, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface YouTubeUploaderProps {
  onUploadComplete?: (youtubeUrl: string) => void;
  courseTitle?: string;
  lessonTitle?: string;
}

/**
 * Componente de upload direto para o YouTube.
 * Para uso no painel admin ao cadastrar novas aulas.
 * 
 * PRÉ-REQUISITO: Configurar uma Cloud Function ou endpoint Netlify
 * que receba o vídeo e faça o upload para o YouTube via API.
 * 
 * Este componente chama a função create-youtube-upload (a ser criada).
 */
const YouTubeUploader: React.FC<YouTubeUploaderProps> = ({
  onUploadComplete,
  courseTitle = '',
  lessonTitle = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (f: File) => {
    setError(null);
    setYoutubeUrl(null);

    if (!f.type.startsWith('video/')) {
      setError('Selecione um arquivo de vídeo (MP4, MOV, etc).');
      return;
    }

    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB (limite do YouTube sem verificação)
    if (f.size > maxSize) {
      setError('Arquivo muito grande. Máximo: 2GB.');
      return;
    }

    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Opção 1: Upload via Cloud Function
      // const formData = new FormData();
      // formData.append('video', file);
      // formData.append('title', lessonTitle || courseTitle);
      // formData.append('privacyStatus', 'unlisted');
      // const res = await fetch('/.netlify/functions/youtube-upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await res.json();
      // setYoutubeUrl(data.youtubeUrl);
      // onUploadComplete?.(data.youtubeUrl);

      // --- Simulação (substituir pela chamada real acima) ---
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 300));
        setProgress(i);
      }
      const fakeUrl = `https://www.youtube.com/watch?v=VIDEO_ID_${Date.now()}`;
      setYoutubeUrl(fakeUrl);
      onUploadComplete?.(fakeUrl);
      // --- Fim simulação ---

    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload para o YouTube.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setYoutubeUrl(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Área de drop */}
      {!youtubeUrl && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
            dragActive
              ? 'border-red-500 bg-red-500/10'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="space-y-3">
              <Youtube className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-zinc-400 text-sm">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {!uploading && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleUpload} disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar para YouTube
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    Trocar arquivo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Youtube className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-zinc-300 font-medium">
                Arraste um vídeo ou clique para selecionar
              </p>
              <p className="text-zinc-500 text-sm">
                MP4, MOV, AVI — até 2GB
              </p>
              <p className="text-zinc-600 text-xs">
                O vídeo será publicado como <strong>Não listado</strong> no YouTube
              </p>
            </div>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enviando para o YouTube... {progress}%</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Sucesso */}
      {youtubeUrl && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Vídeo publicado com sucesso!</span>
          </div>
          <p className="text-zinc-400 text-sm break-all">{youtubeUrl}</p>
          <div className="flex gap-2">
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver no YouTube
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={reset}>
              Enviar outro
            </Button>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default YouTubeUploader;