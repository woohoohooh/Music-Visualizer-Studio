import React, { useState, useEffect, useRef } from 'react';
import { VisualizerId, BarVisualizerSettings } from './types';
import VisualizerCanvas from './components/VisualizerCanvas';
import ControlPanel from './components/ControlPanel';
import VisualizerSelector from './components/VisualizerSelector';
import { Music4, Youtube, Play, Pause, Maximize, X, Volume2, HelpCircle } from 'lucide-react';

export default function App() {
  // Visualizer selection state
  const [activeId, setActiveId] = useState<VisualizerId>('bars');
  
  // Custom spectrogram configuration (requested white bars with full sliders)
  const [settings, setSettings] = useState<BarVisualizerSettings>({
    barCount: 52,
    maxHeight: 0.85,
    barWidth: 10,
    gap: 4,
    sensitivity: 1.6,
    smoothing: 0.78,
    color: 'white',
    glow: true
  });

  // Background configurations
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [bgImageName, setBgImageName] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(75); // 0 = bright, 100 = black cover

  // Audio system state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(true); // Starts on demo simulation for immediate preview
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);

  // Keyboard and Viewport Fullscreen states
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showExitHint, setShowExitHint] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Manage Keyboard ESC listener for Fullscreen exits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Manage auto-hiding the full-screen exit button for clean videos recording
  useEffect(() => {
    if (isFullscreen) {
      setShowExitHint(true);
      const timer = setTimeout(() => {
        setShowExitHint(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Audio File input handler
  const handleAudioUpload = (file: File) => {
    // Reset any existing object URLs to avoid memory leaks
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioName(file.name);
    setIsSimulated(false); // Switch to real file analysis automatically
    setIsPlaying(false);   // Stop any simulated triggers
    
    // Reset playheads
    setAudioCurrentTime(0);
    setAudioDuration(0);
  };

  // Background Image input handler
  const handleImageUpload = (file: File) => {
    if (backgroundImageUrl) {
      URL.revokeObjectURL(backgroundImageUrl);
    }
    const url = URL.createObjectURL(file);
    setBackgroundImageUrl(url);
    setBgImageName(file.name);
  };

  const handleClearImage = () => {
    if (backgroundImageUrl) {
      URL.revokeObjectURL(backgroundImageUrl);
    }
    setBackgroundImageUrl(null);
    setBgImageName(null);
  };

  // Playback managers
  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio play failed, user gesture requirement not fulfilled', err);
      });
    }
  };

  const handleSeekAudio = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const handleToggleSimulated = () => {
    // Pause any active real player before toggling to simulation data
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setIsSimulated(!isSimulated);
  };

  // Full Screen Viewport launcher
  const handleEnterFullScreen = () => {
    setIsFullscreen(true);

    // Additionally attempt actual browser fullscreen if permitted inside iframe container sandbox
    try {
      const container = document.getElementById('visualizer-canvas-screen');
      if (container && container.requestFullscreen) {
        container.requestFullscreen();
      }
    } catch {
      // Sandbox restrictions may prevent direct full-screen, which our absolute standard div handles beautifully anyway
    }
  };

  return (
    <div id="visualizer-app-root" className="min-h-screen bg-transparent text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER SECTION */}
      <header id="main-header" className="bg-black/35 border-b border-white/5 sticky top-0 z-40 backdrop-blur-md px-6 py-4">
        <div id="header-container" className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div id="header-logo-column" className="flex items-center space-x-3 text-center md:text-left">
            <div id="logo-icon-badge" className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner flex items-center justify-center animate-pulse">
              <Music4 className="w-6 h-6" />
            </div>
            <div>
              <h1 id="app-title" className="text-lg font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-1.5">
                BeatBounce <span className="text-indigo-300 text-[10px] px-2 py-0.5 bg-indigo-950/60 rounded-full border border-indigo-800/40">Studio v1.2</span>
              </h1>
              <p id="app-subtitle" className="text-xs text-zinc-400 mt-1">
                Interactive Video Studio Generator for YouTube Music Tracks
              </p>
            </div>
          </div>

          <div id="header-social-badges" className="flex items-center space-x-3 text-xs text-zinc-400">
            <div id="youtube-target-card" className="backdrop-blur-md bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
              <Youtube className="w-4 h-4 text-red-500" />
              <span className="font-medium text-white">Optimized for 1 hr+ long videos</span>
            </div>
          </div>

        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <main id="workspace-main" className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* UPPER ROW: ACTIVE CANVAS DEMONSTRATION WINDOW AND FILE INFO STATS */}
        <div id="top-workspace-row" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: CANVAS AND GRAPHICAL RENDER CONTAINER */}
          <div id="canvas-grid-side" className="xl:col-span-8 flex flex-col space-y-2">
            <div id="canvas-wrapper-layout" className="aspect-video w-full relative">
              <VisualizerCanvas
                activeId={activeId}
                settings={settings}
                backgroundImageUrl={backgroundImageUrl}
                bgOpacity={bgOpacity}
                audioElementRef={audioRef}
                isSimulated={isSimulated}
                isPlaying={isPlaying}
              />
            </div>
            <div id="view-guides-line" className="flex justify-between items-center px-2 text-xs text-zinc-500 leading-none">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-ping" />
                <span className="font-mono">Viewport: 16:9 HD ready</span>
              </span>
              <span>Press <b>Esc</b> anytime to exit full-screen mode</span>
            </div>
          </div>

          {/* RIGHT: HOW-TO INSTRUCTION GUIDE */}
          <div id="instructions-grid-side" className="xl:col-span-4 backdrop-blur-2xl bg-black/40 p-5 rounded-2xl border border-white/10 flex flex-col justify-between shadow-lg">
            <div id="guide-top" className="space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 pb-2 border-b border-white/5">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Creator Quick-Start Guide</h4>
              </div>

              <ol className="space-y-3.5 text-xs text-zinc-300">
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2.5 mt-0.5">1</span>
                  <span><b>Click Demo Frequencies</b> below to preview the responsive spectrum animation.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2.5 mt-0.5">2</span>
                  <span><b>Upload your WAV or MP3</b> file — drag and drop it directly into the zone or browse from your device.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2.5 mt-0.5">3</span>
                  <span><b>Add a background image</b> (drag & drop supported) and tune the dark dimming slider for maximum contrast.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2.5 mt-0.5">4</span>
                  <span><b>Explore 15 trending visualizer styles</b> by clicking the cards below to match your musical genre.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2.5 mt-0.5">5</span>
                  <span>Click <b>"LAUNCH FULL SCREEN VISUALIZER"</b>, start your recording (via OBS, ShadowPlay, or ShareX), and produce clean 1-hour music videos!</span>
                </li>
              </ol>
            </div>

            <div id="guide-bottom" className="pt-4 border-t border-white/5 mt-4">
              <div className="bg-white/5 p-3.5 rounded-lg border border-white/10 flex flex-col space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-indigo-400/80">RECOMMENDED OBS SETTINGS:</span>
                <p className="text-[11px] text-zinc-400">Recording format: <b>MP4</b>, video bitrate: <b>12000 Kbps</b>, 1080p, 60fps. For crisp white bars, use Preset 1 with Glow enabled.</p>
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE LAYER: CONTROLLER SLIDERS, RANGE SWITCHERS AND UPLOADS */}
        <div id="middle-panel-wrapper">
          <ControlPanel
            activeId={activeId}
            settings={settings}
            onChangeSettings={setSettings}
            bgOpacity={bgOpacity}
            onChangeBgOpacity={setBgOpacity}
            onAudioUpload={handleAudioUpload}
            onImageUpload={handleImageUpload}
            onClearImage={handleClearImage}
            activeImageName={bgImageName}
            activeAudioName={audioName}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            isSimulated={isSimulated}
            onToggleSimulated={handleToggleSimulated}
            audioDuration={audioDuration}
            audioCurrentTime={audioCurrentTime}
            onSeekAudio={handleSeekAudio}
            onEnterFullScreen={handleEnterFullScreen}
          />
        </div>

        {/* BOTTOM LAYER: SELECTABLE 15 VARIANT GRID CARDS */}
        <div id="selector-wrapper">
          <VisualizerSelector
            selectedId={activeId}
            onSelect={setActiveId}
          />
        </div>

      </main>

      {/* FOOTER */}
      <footer id="main-footer" className="bg-black/35 border-t border-white/5 py-6 px-6 text-center text-xs text-zinc-500 font-mono mt-12 backdrop-blur-md">
        <div id="footer-container" className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>BeatBounce Visualizer Studio • 2026</span>
          <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-1 rounded">Ideal for Lo-Fi, Synthwave, Techno, Hip-hop, and Bass music channels</span>
        </div>
      </footer>

      {/* HIDDEN HTML5 AUDIO MECHANIC TAG */}
      {audioUrl && (
        <audio
          ref={audioRef}
          id="hidden-audio-player-node"
          src={audioUrl}
          className="hidden"
          onDurationChange={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
          onTimeUpdate={(e) => setAudioCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* --- IN-TAB VIEWPORT FULL-SCREEN CAPTURE MODAL OVERLAY (SAVES VIDEO CAPTURING WITH ZERO INTRUSIVE LABELS) --- */}
      {isFullscreen && (
        <div 
          id="immersive-fullscreen-portal" 
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-none"
        >
          {/* Main Renderer fully taking screen space */}
          <div className="w-full h-full relative">
            <VisualizerCanvas
              activeId={activeId}
              settings={settings}
              backgroundImageUrl={backgroundImageUrl}
              bgOpacity={bgOpacity}
              audioElementRef={audioRef}
              isSimulated={isSimulated}
              isPlaying={isPlaying}
            />
            
            {/* FLOATING ACTION GUIDES WITH DELAYED AUTOHIDE ON MOUSE STILLNESS */}
            <div 
              id="fullscreen-floating-exit-bar" 
              className={`absolute top-5 right-5 z-20 flex items-center bg-zinc-950/90 border border-zinc-800 p-2.5 px-4 rounded-xl text-xs space-x-3 transition-opacity duration-500 cursor-auto ${
                showExitHint ? 'opacity-100' : 'opacity-0 hover:opacity-100'
              }`}
            >
              <div id="fullscreen-playback-bubble" className="flex items-center space-x-2 border-r border-zinc-850 pr-3 mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
                <span className="font-semibold text-zinc-300 uppercase tracking-widest text-[10px]">REC</span>
                
                {/* Embedded dynamic play pause in full screen for handy handling */}
                {!isSimulated && audioName && (
                  <button
                    id="fs-play-btn"
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-md hover:bg-zinc-800 text-white ml-2 transition-all"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              
              <span className="text-zinc-400">Press <b>Esc</b> to exit</span>
              
              <button
                id="close-fullscreen-overlay-btn"
                onClick={() => setIsFullscreen(false)}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-red-950/80 hover:text-red-400 hover:border-red-900 text-zinc-300 transition-all flex items-center justify-center"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
