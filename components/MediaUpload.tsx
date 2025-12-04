import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, Image, Video, Music, FileText, Trash2, Download, X, Mic, Square, Send } from 'lucide-react';
import { MediaSubmission } from '../types';
import { uploadMedia, getCourseMedia, formatFileSize } from '../lib/media';

interface MediaUploadProps {
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  isInstructor?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  courseId,
  courseName,
  studentId,
  studentName,
  isInstructor = false,
}) => {
  const [mediaList, setMediaList] = useState<MediaSubmission[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadMedia();
  }, [courseId]);

  const loadMedia = async () => {
    setLoading(true);
    const media = await getCourseMedia(courseId);
    setMediaList(media);
    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile && !recordedAudio) return;

    setUploading(true);
    setUploadProgress(0);

    let fileToUpload = selectedFile;
    
    // Convert recorded audio to File object if exists
    if (recordedAudio && !selectedFile) {
      fileToUpload = new File([recordedAudio], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
    }

    if (!fileToUpload) {
      setUploading(false);
      return;
    }

    try {
      const mediaId = await uploadMedia(
        fileToUpload,
        courseId,
        studentId,
        studentName,
        description,
        (progress) => setUploadProgress(progress)
      );

      if (mediaId) {
        setSelectedFile(null);
        setRecordedAudio(null);
        setDescription('');
        setPreviewUrl(null);
        await loadMedia();
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    setRecordedAudio(null);
    setIsRecording(false);
  };

  const getFileIcon = (fileType: MediaSubmission['fileType']) => {
    switch (fileType) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const studentMedia = isInstructor ? mediaList : mediaList.filter(m => m.studentId === studentId);
  
  // Separate media by type
  const videos = studentMedia.filter(m => m.fileType === 'video');
  const audios = studentMedia.filter(m => m.fileType === 'audio');
  const others = studentMedia.filter(m => m.fileType !== 'video' && m.fileType !== 'audio');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-[#F3F4F6] mb-2">
          {isInstructor ? 'Mídias dos Alunos' : 'Minhas Mídias'}
        </h3>
        <p className="text-sm text-[#9CA3AF]">
          {isInstructor 
            ? 'Visualize as mídias enviadas pelos alunos nesta aula'
            : 'Envie vídeos, imagens, áudios ou documentos relacionados à aula'}
        </p>
      </div>

      {/* Collapsible Upload Area */}
      <div className="border border-white/[0.1] bg-white/[0.02] rounded-lg overflow-hidden">
        {!selectedFile && !recordedAudio && (
          <div className="space-y-4 p-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragActive
                  ? 'border-[#FF6A00] bg-[#FF6A00]/5'
                  : 'border-white/[0.1] hover:border-[#FF6A00]/50 bg-white/[0.02]'
              }`}
            >
              <Upload className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
              <p className="text-[#F3F4F6] font-medium mb-2">
                Arraste e solte seu arquivo aqui
              </p>
              <p className="text-sm text-[#9CA3AF] mb-4">ou</p>
              <label className="inline-block bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:-translate-y-0.5">
                Escolher Arquivo
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
              </label>
              <p className="text-xs text-[#9CA3AF] mt-4">
                Suporta: Imagens, Vídeos, Áudios, PDFs e Documentos
              </p>
            </div>

            <div className="text-center border-t border-white/[0.06] pt-4">
              <p className="text-sm text-[#9CA3AF] mb-3">Ou grave uma mensagem de áudio</p>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  type="button"
                  className="inline-flex items-center gap-2 bg-white/[0.02] border border-white/[0.1] hover:bg-[#FF6A00]/10 hover:border-[#FF6A00]/50 text-[#F3F4F6] px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <Mic className="w-5 h-5" />
                  Iniciar Gravação
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  type="button"
                  className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-3 rounded-lg font-medium transition-all animate-pulse"
                >
                  <Square className="w-5 h-5" />
                  Parar Gravação
                </button>
              )}
            </div>
          </div>
        )}

        {/* File Preview & Upload - Inside the box */}
        {(selectedFile || recordedAudio) && (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                ) : recordedAudio ? (
                  <div className="w-24 h-24 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center">
                    <Music className="w-8 h-8 text-[#FF6A00]" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-white/[0.05] rounded-lg flex items-center justify-center">
                    {selectedFile && getFileIcon(selectedFile.type.startsWith('image/') ? 'image' : 
                                 selectedFile.type.startsWith('video/') ? 'video' :
                                 selectedFile.type.startsWith('audio/') ? 'audio' :
                                 selectedFile.type === 'application/pdf' ? 'pdf' : 'document')}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-[#F3F4F6]">
                    {recordedAudio ? `Gravação de Áudio ${new Date().toLocaleTimeString()}` : selectedFile?.name}
                  </p>
                  <p className="text-sm text-[#9CA3AF]">
                    {recordedAudio ? 'Arquivo de áudio' : selectedFile && formatFileSize(selectedFile.size)}
                  </p>
                  <input
                    type="text"
                    placeholder="Adicione uma descrição (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-3 bg-white/[0.05] border border-white/[0.1] focus:border-[#FF6A00]/50 rounded-lg px-3 py-2 text-sm text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setRecordedAudio(null);
                  setPreviewUrl(null);
                  setDescription('');
                }}
                type="button"
                className="text-[#9CA3AF] hover:text-[#F3F4F6] p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Enviando...</span>
                  <span className="text-[#FF6A00] font-medium">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6A00] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                type="button"
                className="flex-1 bg-[#FF6A00] hover:bg-[#FF6A00]/90 disabled:bg-[#9CA3AF]/20 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {uploading ? 'Enviando...' : recordedAudio ? 'Enviar Áudio' : 'Enviar Arquivo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Videos Section */}
      {videos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Video className="w-4 h-4 text-[#FF6A00]" />
            Vídeos ({videos.length})
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {videos.map((media) => (
              <div
                key={media.id}
                className="border border-white/[0.1] bg-white/[0.02] rounded-lg p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center text-[#FF6A00] shrink-0">
                    {getFileIcon(media.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#F3F4F6] truncate">{media.fileName}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {isInstructor && `${media.studentName} • `}
                      {formatFileSize(media.fileSize)} • {new Date(media.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                    {media.description && (
                      <p className="text-sm text-[#9CA3AF] mt-2">{media.description}</p>
                    )}
                  </div>
                  <a
                    href={media.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6A00] hover:text-[#FF6A00]/80 p-2"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audios Section */}
      {audios.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Music className="w-4 h-4 text-[#FF6A00]" />
            Áudios ({audios.length})
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {audios.map((media) => (
              <div
                key={media.id}
                className="border border-white/[0.1] bg-white/[0.02] rounded-lg p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center text-[#FF6A00] shrink-0">
                    {getFileIcon(media.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#F3F4F6] truncate">{media.fileName}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {isInstructor && `${media.studentName} • `}
                      {formatFileSize(media.fileSize)} • {new Date(media.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                    {media.description && (
                      <p className="text-sm text-[#9CA3AF] mt-2">{media.description}</p>
                    )}
                  </div>
                  <a
                    href={media.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6A00] hover:text-[#FF6A00]/80 p-2"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Files Section */}
      {others.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <File className="w-4 h-4 text-[#FF6A00]" />
            Outros Arquivos ({others.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {others.map((media) => (
              <div
                key={media.id}
                className="border border-white/[0.1] bg-white/[0.02] rounded-lg p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center text-[#FF6A00] shrink-0">
                    {getFileIcon(media.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#F3F4F6] truncate">{media.fileName}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {isInstructor && `${media.studentName} • `}
                      {formatFileSize(media.fileSize)} • {new Date(media.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                    {media.description && (
                      <p className="text-sm text-[#9CA3AF] mt-2">{media.description}</p>
                    )}
                  </div>
                  <a
                    href={media.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6A00] hover:text-[#FF6A00]/80 p-2"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {loading ? (
        <div className="text-center py-12 text-[#9CA3AF]">
          <Upload className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Carregando...
        </div>
      ) : studentMedia.length === 0 && (
        <div className="text-center py-12 text-[#9CA3AF]">
          <Upload className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {isInstructor ? 'Nenhuma mídia enviada ainda' : 'Você ainda não enviou nenhum arquivo'}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
