import { useState, useEffect } from "react";
import { useListVoices } from "@workspace/api-client-react";
import { useGenerateVoiceAudio } from "@/hooks/use-generate-voice";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, Sparkles, BookOpen, MessageSquare, PlayCircle } from "lucide-react";
import type { ContentMode } from "@workspace/api-client-react";

const MAX_CHARS = 5000;

export function Home() {
  const { toast } = useToast();
  const { data: voices = [], isLoading: isLoadingVoices } = useListVoices();
  const generateMutation = useGenerateVoiceAudio();
  
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [mode, setMode] = useState<ContentMode>("motivational");
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Set default voice when loaded
  useEffect(() => {
    if (voices.length > 0 && !voiceId) {
      setVoiceId(voices[0].id);
    }
  }, [voices, voiceId]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleGenerate = () => {
    if (!text.trim()) {
      toast({
        title: "Script required",
        description: "Please enter some text to generate voice.",
        variant: "destructive",
      });
      return;
    }
    
    if (!voiceId) {
      toast({
        title: "Voice required",
        description: "Please select a voice.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(
      { text, voiceId, stability, similarityBoost, mode },
      {
        onSuccess: (data) => {
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          setAudioUrl(data.url);
          toast({
            title: "Voice generated",
            description: "Your audio is ready to play.",
          });
        },
        onError: (error) => {
          toast({
            title: "Generation failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const isGenerating = generateMutation.isPending;
  const charCount = text.length;

  return (
    <div className="min-h-[100dvh] w-full bg-background selection:bg-primary/20 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">VoiceForge AI</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
            Powered by ElevenLabs
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Give your words a <span className="gradient-text">voice</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Transform text into studio-quality voice instantly. A premium creative tool for content creators and storytellers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Input Area - Takes 2/3 width on desktop */}
          <div className="lg:col-span-2 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <Card className="border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-0 flex flex-col h-[400px]">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Type or paste the words you want to bring to life..."
                  className="flex-1 resize-none border-0 focus-visible:ring-0 p-6 text-base md:text-lg bg-transparent font-medium leading-relaxed"
                />
                <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    <span className={charCount > MAX_CHARS * 0.9 ? "text-destructive" : ""}>{charCount}</span>
                    <span className="opacity-50"> / {MAX_CHARS}</span>
                  </span>
                  
                  {/* Mode Selector within input area footer for context */}
                  <div className="flex bg-background rounded-lg border border-border p-1 shadow-sm">
                    <button
                      onClick={() => setMode("motivational")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === "motivational" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span className="hidden sm:inline">Motivational</span>
                    </button>
                    <button
                      onClick={() => setMode("storytelling")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === "storytelling" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <BookOpen className="h-3 w-3" />
                      <span className="hidden sm:inline">Storytelling</span>
                    </button>
                    <button
                      onClick={() => setMode("educational")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === "educational" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span className="hidden sm:inline">Educational</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player Container */}
            <div className={`transition-all duration-500 ${audioUrl ? 'opacity-100 translate-y-0 h-auto mt-4' : 'opacity-0 translate-y-4 h-0 overflow-hidden'}`}>
              {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
            </div>
          </div>

          {/* Settings Sidebar - Takes 1/3 width on desktop */}
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 flex flex-col gap-8">
                
                {/* Voice Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Voice Model</Label>
                  <Select value={voiceId} onValueChange={setVoiceId} disabled={isLoadingVoices}>
                    <SelectTrigger className="w-full h-12 bg-background border-border/50">
                      <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Select a voice"} />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{voice.name}</span>
                            <span className="text-xs text-muted-foreground">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px w-full bg-border/50" />

                {/* Advanced Settings */}
                <div className="space-y-6">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Voice Settings</Label>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Stability</Label>
                      <span className="text-xs font-mono text-muted-foreground">{stability.toFixed(2)}</span>
                    </div>
                    <Slider 
                      value={[stability]} 
                      onValueChange={(v) => setStability(v[0])} 
                      max={1} 
                      step={0.01} 
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                    <p className="text-xs text-muted-foreground">Higher values make the voice more consistent, lower values make it more expressive.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Similarity Boost</Label>
                      <span className="text-xs font-mono text-muted-foreground">{similarityBoost.toFixed(2)}</span>
                    </div>
                    <Slider 
                      value={[similarityBoost]} 
                      onValueChange={(v) => setSimilarityBoost(v[0])} 
                      max={1} 
                      step={0.01} 
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                    <p className="text-xs text-muted-foreground">Higher values adhere closer to the original voice, but may sound less natural.</p>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Action Button */}
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 relative overflow-hidden group"
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim() || !voiceId}
            >
              {isGenerating ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Synthesizing...</span>
                    </div>
                  </div>
                  <span className="opacity-0">Generate Voice</span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  <span>Generate Voice</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
