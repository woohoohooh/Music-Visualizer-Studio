import React, { useRef, useState } from 'react';
import { BarVisualizerSettings, VisualizerId } from '../types';
import { 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  Maximize2, 
  Image as ImageIcon, 
  Volume2, 
  Sliders as SlidersIcon, 
  Cpu, 
  Music,
  Maximize
} from 'lucide-react';

interface ControlPanelProps {
  activeId: VisualizerId;
  settings: BarVisualizerSettings;
  onChangeSettings: (newSettings: BarVisualizerSettings) => void;
  bgOpacity: number;
  onChangeBgOpacity: (opacity: number) => void;
  onAudioUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onClearImage: () => void;
  activeImageName: string | null;
  activeAudioName: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  audioDuration: number;
  audioCurrentTime: number;
  onSeekAudio: (time: number) => void;
  onEnterFullScreen: () => void;
}

export default function ControlPanel({
  activeId,
  settings,
  onChangeSettings,
  bgOpacity,
  onChangeBgOpacity,
  onAudioUpload,
  onImageUpload,
  onClearImage,
  activeImageName,
  activeAudioName,
  isPlaying,
  onTogglePlay,
  isSimulated,
  onToggleSimulated,
  audioDuration,
  audioCurrentTime,
  onSeekAudio,
  onEnterFullScreen,
}: ControlPanelProps) {
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  
  const [isAudioOver, setIsAudioOver] = useState(false);
  const [isImageOver, setIsImageOver] = useState(false);

  // Drag and Drop helpers for Audios
  const handleAudioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAudioOver(true);
  };
  const handleAudioDragLeave = () => {
    setIsAudioOver(false);
  };
  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAudioOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
        onAudioUpload(file);
      }
    }
  };

  // Drag and Drop helpers for Background Images
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsImageOver(true);
  };
  const handleImageDragLeave = () => {
    setIsImageOver(false);
  };
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsImageOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    }
  };

  // Human duration formatter
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const updateParam = (key: keyof BarVisualizerSettings, value: any) => {
    onChangeSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <div id="control-panel-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* COLUMN 1: Files, Playback and Mode controls */}
      <div id="panel-column-files" className="lg:col-span-6 space-y-5 flex flex-col justify-between">
        <div id="files-top-section" className="space-y-4">
          <h3 id="files-section-heading" className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Step 1: File Uploads & Playback Controls
          </h3>

          {/* AUDIO FILE DROPZONE */}
          <div
            id="audio-dropzone"
            onDragOver={handleAudioDragOver}
            onDragLeave={handleAudioDragLeave}
            onDrop={handleAudioDrop}
            className={`relative p-5 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md backdrop-blur-md ${
              isAudioOver 
                ? 'bg-white/10 border-white/40' 
                : activeAudioName 
                  ? 'bg-white/5 border-white/10 hover:border-white/20' 
                  : 'bg-black/30 border-white/10 hover:border-white/20'
            }`}
            onClick={() => audioInputRef.current?.click()}
          >
            <input
              ref={audioInputRef}
              id="audio-file-input"
              type="file"
              accept=".mp3,.wav,audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onAudioUpload(e.target.files[0])}
            />
            <Music id="icon-audio-upload" className="w-8 h-8 text-zinc-400 mb-2 group-hover:text-zinc-350" />
            
            {activeAudioName ? (
              <div id="active-audio-meta" className="w-full">
                <span id="active-audio-badge" className="text-[10px] bg-emerald-950 text-emerald-400 font-medium px-2 py-0.5 rounded border border-emerald-800 inline-block mb-1">
                  Audio Track Loaded
                </span>
                <p id="active-audio-filename" className="text-sm font-medium text-white truncate max-w-xs mx-auto">
                  {activeAudioName}
                </p>
                <p id="active-audio-instruction" className="text-xs text-zinc-500 mt-1">
                  Click to replace track or drop a new file here
                </p>
              </div>
            ) : (
              <div id="empty-audio-meta">
                <p id="empty-audio-text" className="text-sm font-medium text-zinc-200">
                  Drop audio track here or click to browse
                </p>
                <p id="empty-audio-formats" className="text-xs text-zinc-500 mt-1 bg-zinc-900 px-2 py-0.5 rounded inline-block">
                  Supports WAV, MP3, and standard audio formats
                </p>
              </div>
            )}
          </div>

          {/* IMAGE BACKGROUND DROPZONE */}
          <div
            id="image-dropzone"
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
            className={`relative p-5 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md backdrop-blur-md ${
              isImageOver 
                ? 'bg-white/10 border-white/40' 
                : activeImageName 
                  ? 'bg-white/5 border-white/10 hover:border-white/20' 
                  : 'bg-black/30 border-white/10 hover:border-white/20'
            }`}
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              ref={imageInputRef}
              id="image-background-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])}
            />
            <ImageIcon id="icon-image-upload" className="w-8 h-8 text-zinc-400 mb-2 group-hover:text-zinc-350" />

            {activeImageName ? (
              <div id="active-image-meta" className="w-full flex flex-col items-center">
                <span id="active-image-badge" className="text-[10px] bg-blue-950 text-blue-400 font-medium px-2 py-0.5 rounded border border-blue-900 inline-block mb-1">
                  Background Image Active
                </span>
                <p id="active-image-name" className="text-sm font-medium text-white truncate max-w-xs mx-auto">
                  {activeImageName}
                </p>
                <div id="image-action-wrapper" className="flex items-center space-x-3 mt-2">
                  <span className="text-xs text-zinc-500 hover:underline">Change</span>
                  <button
                    id="image-clear-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearImage();
                    }}
                    className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800 flex items-center text-xs space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div id="empty-image-meta">
                <p id="empty-image-text" className="text-sm font-medium text-zinc-200">
                  Add Background Wallpaper
                </p>
                <p id="empty-image-subtext" className="text-xs text-zinc-500 mt-1 bg-zinc-900 px-2 py-0.5 rounded inline-block">
                  Default background is pure black
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTIVE PLAYER & FULLSCREEN BAR */}
        <div id="player-and-actions" className="space-y-4 pt-4 border-t border-zinc-800">
          
          {/* PLAYBACK ENGINE MODES */}
          <div id="source-toggle-bar" className="backdrop-blur-xl bg-white/5 p-3 rounded-lg border border-white/10 flex items-center justify-between shadow-md">
            <div id="simulation-indicator" className="flex items-center space-x-2 border-white/5">
              <Cpu className={`w-4.5 h-4.5 ${isSimulated ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <div>
                <p id="source-status-title" className="text-xs font-semibold text-zinc-250 leading-none">
                  {isSimulated ? 'Mode: DEMO (Simulated Beat)' : 'Mode: LIVE (Uploaded Audio)'}
                </p>
                <p id="source-status-subtext" className="text-[10px] text-zinc-500 mt-0.5 leading-none">
                  {isSimulated ? 'Procedural rhythm for instant preview' : 'Real-time analyzer reading your audio file'}
                </p>
              </div>
            </div>
            
            <button
              id="toggle-sim-mode-btn"
              onClick={onToggleSimulated}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-all ${
                isSimulated 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.01]' 
                  : 'bg-zinc-850 text-zinc-300 hover:bg-zinc-800 border border-white/5'
              }`}
            >
              {isSimulated ? 'Switch to Uploaded Track' : 'Enable Demo Frequencies'}
            </button>
          </div>

          {/* ACTIVE MUSIC TRACK AUDIO CONTROLLER GUI */}
          <div id="music-track-player-control" className={`backdrop-blur-xl p-4 rounded-xl border transition-all ${
            !isSimulated && activeAudioName 
              ? 'bg-black/45 border-emerald-500/30 shadow-emerald-950/20 shadow-lg' 
              : 'bg-black/25 border-white/5 shadow-md opacity-60'
          }`}>
            <div id="audio-playback-row" className="flex items-center justify-between mb-3">
              <div id="track-name-layout" className="min-w-0 flex-1 pr-3">
                <p id="playback-title" className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
                  PLAYER
                </p>
                <p id="playback-filename" className="text-sm font-semibold text-white truncate">
                  {!isSimulated && activeAudioName ? activeAudioName : 'No audio file selected yet'}
                </p>
              </div>

              <button
                id="playback-control-btn"
                disabled={isSimulated || !activeAudioName}
                onClick={onTogglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isSimulated || !activeAudioName
                    ? 'bg-zinc-800 text-zinc-650 cursor-not-allowed'
                    : isPlaying
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-white text-black hover:scale-105'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
            </div>

            {/* Seeking bar */}
            <div id="playback-timeline-bar" className="space-y-1">
              <input
                id="playback-range-slider"
                type="range"
                min={0}
                max={audioDuration || 100}
                value={audioCurrentTime}
                disabled={isSimulated || !activeAudioName}
                onChange={(e) => onSeekAudio(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 accent-height disabled:opacity-40"
              />
              <div id="playback-times" className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>{formatTime(audioCurrentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>
          </div>

          {/* SCREEN RECORDING / ALL-SCREEN ACTION */}
          <button
            id="fullscreen-trigger-btn"
            onClick={onEnterFullScreen}
            className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] hover:shadow-lg shadow-indigo-500/10 active:scale-95"
          >
            <Maximize className="w-5 h-5" />
            <span>LAUNCH FULL SCREEN VISUALIZER (Press Esc to exit)</span>
          </button>
        </div>
      </div>

      {/* COLUMN 2: Variant 1 Custom Sliders & Background Dim Controls */}
      <div id="panel-column-customizers" className="lg:col-span-6 space-y-5 backdrop-blur-2xl bg-black/40 p-5 rounded-2xl border border-white/10 shadow-2xl">
        <div id="sliders-heading-layout" className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <SlidersIcon className="w-4 h-4 text-zinc-400" />
          <h3 id="sliders-heading" className="text-sm font-semibold uppercase tracking-wider text-zinc-350">
            Step 2: Graphic Customization & Sliders
          </h3>
        </div>

        {/* BACKGROUND DIM CONTROL */}
        <div id="bg-dim-group" className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-zinc-300">Background Dimming:</span>
            <span className="text-white font-mono">{bgOpacity}%</span>
          </div>
          <input
            id="bg-dim-slider"
            type="range"
            min={0}
            max={100}
            value={bgOpacity}
            onChange={(e) => onChangeBgOpacity(parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <p className="text-[10px] text-zinc-500 leading-none">
            0% = full image brightness, 100% = solid black backdrop (for peak visualizer contrast)
          </p>
        </div>

        {activeId === 'bars' ? (
          // RENDER FULL SPECIFIC REQ PARAMETER SLIDERS FOR VARIANT 1
          <div id="variant-1-sliders-block" className="space-y-4 pt-2">
            
            {/* Color preset theme selector */}
            <div id="param-color-preset" className="space-y-1.5">
              <span className="text-xs text-zinc-400 font-medium">Color Palette</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'white', title: 'Pure White', color: 'bg-white' },
                  { key: 'neon-cyan', title: 'Electric Cyan', color: 'bg-cyan-400' },
                  { key: 'hot-pink', title: 'Neon Pink', color: 'bg-pink-500' },
                  { key: 'amber-orange', title: 'Amber Fire', color: 'bg-amber-500' },
                  { key: 'forest-green', title: 'Emerald Green', color: 'bg-green-500' },
                  { key: 'rainbow', title: 'Spectrum Rainbow', color: 'bg-gradient-to-r from-red-500 via-green-500 to-indigo-500' },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    id={`color-preset-${preset.key}`}
                    onClick={() => updateParam('color', preset.key)}
                    className={`flex items-center space-x-1 px-1.5 py-1.5 rounded text-[11px] text-left border ${
                      settings.color === preset.key
                        ? 'border-white bg-zinc-900 font-semibold text-white'
                        : 'border-zinc-850 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${preset.color} shrink-0`} />
                    <span className="truncate">{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider: Bar count */}
            <div id="param-bar-count-group" className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-350">Bar Count:</span>
                <span className="text-white font-mono">{settings.barCount} bars</span>
              </div>
              <input
                id="bar-count-slider"
                type="range"
                min={12}
                max={150}
                step={1}
                value={settings.barCount}
                onChange={(e) => updateParam('barCount', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Slider: Bar Height */}
            <div id="param-max-height-group" className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-350">Max Bar Height:</span>
                <span className="text-white font-mono">{Math.round(settings.maxHeight * 100)}%</span>
              </div>
              <input
                id="bar-height-slider"
                type="range"
                min={0.2}
                max={1.5}
                step={0.05}
                value={settings.maxHeight}
                onChange={(e) => updateParam('maxHeight', parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Slider: Bar width */}
            <div id="param-bar-width-group" className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-350">Individual Bar Width:</span>
                <span className="text-white font-mono">{settings.barWidth} px</span>
              </div>
              <input
                id="bar-width-slider"
                type="range"
                min={2}
                max={28}
                step={1}
                value={settings.barWidth}
                onChange={(e) => updateParam('barWidth', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Slider: Gap size */}
            <div id="param-gap-group" className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-350">Gap Between Bars:</span>
                <span className="text-white font-mono">{settings.gap} px</span>
              </div>
              <input
                id="bar-gap-slider"
                type="range"
                min={0}
                max={16}
                step={1}
                value={settings.gap}
                onChange={(e) => updateParam('gap', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Slider: Sensitivity */}
            <div id="param-sens-group" className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-350">Audio Sensitivity:</span>
                <span className="text-white font-mono">{settings.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                id="bar-sens-slider"
                type="range"
                min={0.5}
                max={3.5}
                step={0.1}
                value={settings.sensitivity}
                onChange={(e) => updateParam('sensitivity', parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Slider: Smoothing */}
            <div id="param-smoothing-group" className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-350">Motion Smoothing:</span>
                <span className="text-white font-mono">{settings.smoothing.toFixed(2)}</span>
              </div>
              <input
                id="bar-smoothing-slider"
                type="range"
                min={0.3}
                max={0.95}
                step={0.02}
                value={settings.smoothing}
                onChange={(e) => updateParam('smoothing', parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Checkbox: Neon lighting */}
            <div id="param-neon-checkbox-group" className="flex items-center space-x-3 pt-1">
              <input
                id="bar-glow-checkbox"
                type="checkbox"
                checked={settings.glow}
                onChange={(e) => updateParam('glow', e.target.checked)}
                className="w-4 h-4 text-emerald-650 bg-zinc-900 border-zinc-850 rounded focus:ring-emerald-500 accent-emerald-500"
              />
              <label htmlFor="bar-glow-checkbox" className="text-xs text-zinc-300 font-medium cursor-pointer select-none">
                Enable Soft Neon Glow Effect
              </label>
            </div>

          </div>
        ) : (
          // UNSELECTED INFO PRESET ALERT STATE FOR OTHERS
          <div id="other-variants-alert-panel" className="backdrop-blur-xl bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-center items-center text-center h-[340px] space-y-3 shadow-md">
            <SlidersIcon className="w-8 h-8 text-zinc-550" />
            <p className="text-sm font-semibold text-zinc-300">
              Adaptive Procedural Preset
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Preset "{activeId}" is calibrated for modern YouTube aesthetic standards. The dedicated density and bar width sliders apply directly to Preset 1 (Classic Bottom Spectrum). You can customize global amplitude height, color palette, and glow across all styles!
            </p>
            
            {/* Minimal standard controller for and others */}
            <div id="universal-short-settings" className="w-full space-y-3.5 pt-3 border-t border-white/5 text-left">
              {/* Common Height */}
              <div id="short-height" className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-zinc-400">Overall Height Scale:</span>
                  <span className="text-white font-mono">{Math.round(settings.maxHeight * 100)}%</span>
                </div>
                <input
                  id="short-height-slider"
                  type="range"
                  min={0.2}
                  max={1.5}
                  step={0.05}
                  value={settings.maxHeight}
                  onChange={(e) => updateParam('maxHeight', parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              {/* Common Color selectors for and others */}
              <div id="short-colors" className="space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium">Color Palette</span>
                <div className="flex justify-between space-x-1 overflow-x-auto pb-1">
                  {[
                    { key: 'white', color: 'bg-white' },
                    { key: 'neon-cyan', color: 'bg-cyan-400' },
                    { key: 'hot-pink', color: 'bg-pink-500' },
                    { key: 'amber-orange', color: 'bg-amber-500' },
                    { key: 'forest-green', color: 'bg-green-500' },
                    { key: 'rainbow', color: 'bg-gradient-to-r from-red-500 to-violet-500' }
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      id={`short-color-${preset.key}`}
                      onClick={() => updateParam('color', preset.key)}
                      className={`w-5 h-5 rounded-full border ${preset.color} ${
                        settings.color === preset.key ? 'ring-2 ring-white border-black' : 'border-zinc-800'
                      }`}
                      title={preset.key}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
