import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Play, Pause, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      setIsPlaying(false);
      setProgress(0);
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && value[0] !== undefined) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl flex flex-col gap-4 w-full relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50"></div>
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        className="hidden"
      />
      
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full shrink-0 shadow-sm"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-1" />
          )}
        </Button>
        
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5" />
              <span>Studio Quality</span>
            </div>
            <div className="tabular-nums">
              {formatTime(progress)} / {formatTime(duration)}
            </div>
          </div>
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>
        
        <Button asChild variant="outline" className="shrink-0 rounded-xl gap-2 font-medium">
          <a href={audioUrl} download={`voiceforge-${Date.now()}.mp3`}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
