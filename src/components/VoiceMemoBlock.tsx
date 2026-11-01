import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, AlertCircle } from 'lucide-react';
import { storeMediaItem, getMediaItem } from '../services/mediaStore';
import { nanoid } from 'nanoid';
import { t, Language } from '../i18n';

interface VoiceMemoBlockProps {
  id: string;
  audioUrl?: string;
  audioDuration?: number;
  language?: Language;
  onUpdate: (audioUrl: string, duration: number) => void;
  onDelete: () => void;
}

export const VoiceMemoBlock: React.FC<VoiceMemoBlockProps> = ({
  id,
  audioUrl,
  audioDuration = 0,
  language = 'en',
  onUpdate,
  onDelete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Load audio source from mediaStore if audioUrl is a media id
  useEffect(() => {
    let active = true;
    if (audioUrl) {
      if (audioUrl.startsWith('data:') || audioUrl.startsWith('blob:')) {
        setAudioSrc(audioUrl);
      } else {
        getMediaItem(audioUrl).then((item) => {
          if (active && item) {
            setAudioSrc(item.dataUrl);
          }
        });
      }
    }
    return () => {
      active = false;
    };
  }, [audioUrl]);

  // Audio timer ticker
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const mediaId = 'audio-' + nanoid(8);
          await storeMediaItem({
            id: mediaId,
            type: 'audio',
            dataUrl,
            name: `voice-${Date.now()}.webm`,
            size: audioBlob.size,
            mimeType: 'audio/webm',
            createdAt: Date.now(),
          });
          setAudioSrc(dataUrl);
          onUpdate(mediaId, recordingSeconds);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setErrorMsg('Microphone access denied or unsupported');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="my-2 p-3.5 rounded-2xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] flex items-center justify-between gap-4 max-w-xl transition-all shadow-xs">
      <div className="flex items-center gap-3">
        {/* Record / Play Action Button */}
        {!audioSrc ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        )}

        <div>
          <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-900 dark:text-white">
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isRecording ? t('recording', language) : t('voiceNote', language)}</span>
          </div>
          <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
            {isRecording ? (
              <span className="text-rose-500 font-bold">{formatTime(recordingSeconds)}</span>
            ) : audioSrc ? (
              <span>{formatTime(currentTime)} / {formatTime(audioDuration || 0)}</span>
            ) : (
              <span>Click to record audio</span>
            )}
          </div>
          {errorMsg && (
            <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>
      </div>

      {/* Audio Element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Delete / Re-record options */}
      <button
        onClick={onDelete}
        title="Delete voice memo"
        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
