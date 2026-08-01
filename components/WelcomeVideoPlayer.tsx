import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from '../lib/video';

interface WelcomeVideoPlayerProps {
  videoUrl: string;
  label?: string;
}

/**
 * Welcome video player: shows the YouTube thumbnail with an orange play
 * button and swaps to the autoplaying embed in-place when clicked.
 * Keeps the same dark/card visual language of the app.
 */
const WelcomeVideoPlayer: React.FC<WelcomeVideoPlayerProps> = ({
  videoUrl,
  label = 'Assista antes de começar',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoId = extractYouTubeId(videoUrl);
  const thumbnail = getYouTubeThumbnail(videoUrl);

  if (!videoId) {
    return null;
  }

  if (isPlaying) {
    const autoplayEmbedUrl = getYouTubeEmbedUrl(videoId).replace('autoplay=0', 'autoplay=1');
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-black shadow-2xl animate-in fade-in duration-300">
        <iframe
          src={autoplayEmbedUrl}
          title="Vídeo de boas-vindas"
          className="w-full h-full block"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-black shadow-2xl text-left focus:outline-none focus:ring-2 focus:ring-primary/60"
      aria-label="Reproduzir vídeo de boas-vindas"
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="Vídeo de boas-vindas"
          className="w-full h-full object-cover opacity-80 transition-all duration-300 group-hover:opacity-60 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#FF6A00]/30 to-black" />
      )}

      {/* Bottom gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary flex items-center justify-center shadow-glow transition-transform duration-300 group-hover:scale-110">
          <Play size={30} fill="white" className="text-white ml-1" />
        </div>
      </div>

      {/* Label */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
        <span className="bg-black/60 backdrop-blur-md text-white/95 text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full border border-white/10">
          {label}
        </span>
      </div>
    </button>
  );
};

export default WelcomeVideoPlayer;
