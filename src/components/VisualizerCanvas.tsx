import React, { useEffect, useRef, useState } from 'react';
import { VisualizerId, BarVisualizerSettings } from '../types';

interface VisualizerCanvasProps {
  activeId: VisualizerId;
  settings: BarVisualizerSettings;
  backgroundImageUrl: string | null;
  bgOpacity: number; // 0 to 100
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  isSimulated: boolean;
  isPlaying: boolean;
}

export default function VisualizerCanvas({
  activeId,
  settings,
  backgroundImageUrl,
  bgOpacity,
  audioElementRef,
  isSimulated,
  isPlaying,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Audio state refs to share with render loop
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Floating peak items for bars spectrum
  const peaksRef = useRef<{ val: number; age: number }[]>([]);
  
  // Background image object reference
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Particle systems
  const particlesRef = useRef<{ x: number; y: number; z: number; speed: number; size: number; color: string }[]>([]);
  const sparkParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }[]>([]);
  const matrixColumnsRef = useRef<{ chars: string[]; y: number[]; speeds: number[] } | null>(null);
  
  // 3D rotation state for Wireframe Cube
  const cubeRotationRef = useRef({ x: 0, y: 0, z: 0 });

  // Liquid particle simulation systems
  const splashesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; decay: number; gravity: number }[]>([]);
  const rainDropsRef = useRef<{ x: number; y: number; speed: number; size: number; rippleRadius: number; maxRipple: number; state: 'falling' | 'rippling' }[]>([]);
  const magneticNodesRef = useRef<{ x: number; y: number; size: number; angle: number; currentDist: number; speed: number }[]>([]);
  const vortexParticlesRef = useRef<{ angle: number; radius: number; speed: number; size: number }[]>([]);

  // Web Audio Context setup
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;

    const setupAudio = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const ann = ctx.createAnalyser();
          ann.fftSize = 256; // 128 bins
          analyserRef.current = ann;

          // Connect audio tag to context
          const src = ctx.createMediaElementSource(audioEl);
          src.connect(ann);
          ann.connect(ctx.destination);
          sourceNodeRef.current = src;
        }
      } catch (err) {
        console.warn('AudioContext failed to initialize (this is normal if no clip is played yet or autoplay blocked)', err);
      }
    };

    const handlePlayGesture = () => {
      setupAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    audioEl.addEventListener('play', handlePlayGesture);
    return () => {
      audioEl.removeEventListener('play', handlePlayGesture);
    };
  }, [audioElementRef]);

  // Handle analyser settings modification
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = settings.smoothing;
    }
  }, [settings.smoothing]);

  // Background Image Loader
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBgImage(img);
      };
      img.onerror = () => {
        console.error('Failed to load background image, fallback to dark backdrop');
        setBgImage(null);
      };
      img.src = backgroundImageUrl;
    } else {
      setBgImage(null);
    }
  }, [backgroundImageUrl]);

  // Observer to handle container resizing reliably
  useEffect(() => {
    const elem = containerRef.current;
    if (!elem) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 320),
          height: Math.max(height, 240),
        });
      }
    });

    resizeObserver.observe(elem);
    return () => {
      resizeObserver.unobserve(elem);
    };
  }, []);

  // Initialize systems: Stars particles & Matrix columns
  useEffect(() => {
    // Stars
    const tempStars = [];
    for (let i = 0; i < 200; i++) {
      tempStars.push({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        z: Math.random() * 1000,
        speed: 2 + Math.random() * 3,
        size: 1 + Math.random() * 2,
        color: `hsl(${200 + Math.random() * 40}, 85%, 85%)`,
      });
    }
    particlesRef.current = tempStars;

    // Matrix Rain
    const colCount = Math.floor(1920 / 15);
    const yArr = Array(colCount).fill(0).map(() => Math.random() * -100);
    const speeds = Array(colCount).fill(0).map(() => 0.5 + Math.random() * 2.5);
    const alphabet = '0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ$#@%&*+=?~'.split('');
    matrixColumnsRef.current = {
      chars: alphabet,
      y: yArr,
      speeds,
    };
  }, []);

  // Primary animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const fftSize = 256;
    const dataArray = new Uint8Array(fftSize / 2); // 128 frequency values
    const timeDomainArray = new Uint8Array(fftSize / 2); // 128 waveform values
    
    // Rolling average bass for beat detection
    let bassHistory: number[] = [];
    
    const tick = () => {
      const width = dimensions.width;
      const height = dimensions.height;
      
      let isBeat = false;
      let vol = 0;
      let bass = 0;
      let mid = 0;
      let treble = 0;

      // Extract details either from analytical node or simulated waveform
      if (!isSimulated && analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
        analyserRef.current.getByteTimeDomainData(timeDomainArray);

        // Analyze frequency spectrum bands
        let totalVal = 0;
        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i];
          totalVal += val;

          if (i < 12) bassSum += val; // Lows
          else if (i < 65) midSum += val; // Mids
          else trebleSum += val; // Highs
        }

        vol = totalVal / dataArray.length / 255;
        bass = (bassSum / 12 / 255) * settings.sensitivity;
        mid = (midSum / 53 / 255) * settings.sensitivity;
        treble = (trebleSum / 63 / 255) * settings.sensitivity;

        // Dynamic thresholding for beat detection on kick frequency
        const kValue = bass;
        bassHistory.push(kValue);
        if (bassHistory.length > 30) bassHistory.shift();
        const avgBass = bassHistory.reduce((a, b) => a + b, 0) / Math.max(1, bassHistory.length);
        if (kValue > avgBass * 1.35 && kValue > 0.15) {
          isBeat = true;
        }
      } else {
        // Procedural simulation logic when no real track is active, or user is previewing
        const now = performance.now();
        const beatPeriod = 491.8; // ~122 BPM
        const progress = (now % beatPeriod) / beatPeriod;
        
        // Emulate kick decay
        const kickLevel = Math.exp(-progress * 5.0);
        vol = 0.15 + kickLevel * 0.45 + Math.sin(now * 0.0007) * 0.1;
        bass = (kickLevel * 0.75 + Math.sin(now * 0.001) * 0.1) * settings.sensitivity;
        
        // Snare sweep
        const isSnare = Math.floor(now / beatPeriod) % 2 === 1;
        const snareLevel = isSnare ? Math.exp(-progress * 3.5) * 0.5 : 0;
        mid = (snareLevel + 0.15 + (Math.sin(now * 0.0003) + 1) * 0.1) * settings.sensitivity;
        
        // Sparkling high hats
        const speedHat = Math.random() > 0.84 ? Math.random() * 0.6 : 0.08;
        treble = (speedHat + 0.08 + Math.sin(now * 0.002) * 0.05) * settings.sensitivity;

        isBeat = progress < 0.15; // Beat signal triggers at the front of each beat window

        // Fill procedural frequency arrays for visualizers expecting direct frequency bins
        for (let i = 0; i < dataArray.length; i++) {
          let val = 0;
          if (i < 12) {
            val = (kickLevel * 170 + Math.sin(now * 0.005 + i) * 30 + 40);
          } else if (i < 65) {
            val = (snareLevel * 120 + (Math.sin(now * (0.01 + (i % 5) * 0.002)) + 1) * 45 + 15);
          } else {
            val = (Math.random() > 0.88 ? Math.random() * 60 : 15) + (Math.sin(now * 0.02 + i) + 1) * 12;
          }
          val = Math.max(0, Math.min(255, val * settings.sensitivity));
          dataArray[i] = val;
          timeDomainArray[i] = 128 + Math.sin(now * 0.02 + i * 0.2) * (val / 6);
        }
      }

      // --- Rendering Pipeline ---
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Background Image or Default Pure Black Space
      if (bgImage) {
        // Cover scaling
        const imgAspect = bgImage.width / bgImage.height;
        const canvasAspect = width / height;
        let dWidth = width;
        let dHeight = height;
        let dx = 0;
        let dy = 0;

        if (canvasAspect > imgAspect) {
          dHeight = width / imgAspect;
          dy = (height - dHeight) / 2;
        } else {
          dWidth = height * imgAspect;
          dx = (width - dWidth) / 2;
        }

        ctx.drawImage(bgImage, dx, dy, dWidth, dHeight);

        // Apply adjustable solid black shade cover to keep the visualizer readable
        const dimIndex = bgOpacity / 100; // 0.0 = bright background, 1.0 = pitch black background
        ctx.fillStyle = `rgba(0, 0, 0, ${dimIndex})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
      }

      // Color themes config maps
      const getThemeFill = (opacity = 1) => {
        switch (settings.color) {
          case 'neon-cyan': return `rgba(6, 182, 212, ${opacity})`;
          case 'hot-pink': return `rgba(236, 72, 153, ${opacity})`;
          case 'amber-orange': return `rgba(245, 158, 11, ${opacity})`;
          case 'forest-green': return `rgba(34, 197, 94, ${opacity})`;
          case 'rainbow': return 'rainbow'; // Handled individually
          case 'white':
          default:
            return `rgba(255, 255, 255, ${opacity})`;
        }
      };

      const getThemeGradient = (startVal = 0, stopVal = 1) => {
        const grad = ctx.createLinearGradient(0, height, 0, height - (height * settings.maxHeight));
        switch (settings.color) {
          case 'neon-cyan':
            grad.addColorStop(0, `rgba(8, 145, 178, ${startVal})`);
            grad.addColorStop(1, `rgba(34, 211, 238, ${stopVal})`);
            return grad;
          case 'hot-pink':
            grad.addColorStop(0, `rgba(190, 24, 74, ${startVal})`);
            grad.addColorStop(1, `rgba(244, 114, 182, ${stopVal})`);
            return grad;
          case 'amber-orange':
            grad.addColorStop(0, `rgba(180, 83, 9, ${startVal})`);
            grad.addColorStop(1, `rgba(251, 191, 36, ${stopVal})`);
            return grad;
          case 'forest-green':
            grad.addColorStop(0, `rgba(21, 128, 61, ${startVal})`);
            grad.addColorStop(1, `rgba(74, 222, 128, ${stopVal})`);
            return grad;
          case 'rainbow':
            grad.addColorStop(0, `rgba(239, 68, 68, ${stopVal})`);    // Red
            grad.addColorStop(0.2, `rgba(245, 158, 11, ${stopVal})`); // Orange
            grad.addColorStop(0.4, `rgba(234, 179, 8, ${stopVal})`);  // Yellow
            grad.addColorStop(0.6, `rgba(34, 197, 94, ${stopVal})`);  // Green
            grad.addColorStop(0.8, `rgba(59, 130, 246, ${stopVal})`); // Blue
            grad.addColorStop(1, `rgba(168, 85, 247, ${stopVal})`);   // Violet
            return grad;
          case 'white':
          default:
            grad.addColorStop(0, `rgba(100, 116, 139, ${startVal})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${stopVal})`);
            return grad;
        }
      };

      // 2. Process Chosen Visualizer Animation Style
      switch (activeId) {
        // --- Variant 1: White or Themed Flat Bars Spectrum ---
        case 'bars': {
          const barCount = settings.barCount;
          const barWidth = settings.barWidth;
          const barGap = settings.gap;
          const limitHeight = height * (settings.maxHeight * 0.9);

          // Calculate total spectrum width to center it in screen
          const totalSpecWidth = (barCount * barWidth) + ((barCount - 1) * barGap);
          const startX = (width - totalSpecWidth) / 2;

          // Align peaks array size
          while (peaksRef.current.length < barCount) {
            peaksRef.current.push({ val: 0, age: 0 });
          }

          // Render each column in the spectrogram
          for (let i = 0; i < barCount; i++) {
            // Distribute 128 FFT bins evenly across barCount using interpolation
            const dataIndex = Math.floor((i / barCount) * dataArray.length);
            const rawVal = dataArray[dataIndex] / 255;
            const barH = rawVal * limitHeight;

            // Apply specific bar position
            const x = startX + i * (barWidth + barGap);
            const y = height - barH;

            // Render glowing backdrop if activated
            if (settings.glow) {
              ctx.shadowColor = settings.color === 'rainbow' ? '#ec4899' : getThemeFill(0.8);
              ctx.shadowBlur = 12;
            } else {
              ctx.shadowBlur = 0;
            }

            // Fill Bar
            if (settings.color === 'rainbow') {
              const hCol = (i / barCount) * 360;
              ctx.fillStyle = `hsla(${hCol}, 80%, 60%, 1)`;
            } else {
              ctx.fillStyle = getThemeGradient(0.6, 1);
            }

            // Draw rounded rectangular columns
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [Math.min(barWidth / 2, 4), Math.min(barWidth / 2, 4), 0, 0]);
            ctx.fill();

            // Handle the Floating peak logic
            const currentPeak = peaksRef.current[i];
            if (barH >= currentPeak.val) {
              currentPeak.val = barH;
              currentPeak.age = 0;
            } else {
              currentPeak.age += 1;
              if (currentPeak.age > 18) {
                currentPeak.val = Math.max(0, currentPeak.val - (limitHeight * 0.015));
              }
            }

            // Draw the Peak Cap dot
            if (currentPeak.val > 1) {
              ctx.fillStyle = settings.color === 'rainbow' ? `hsla(${(i / barCount) * 360}, 85%, 70%, 0.95)` : getThemeFill(0.9);
              ctx.fillRect(x, height - currentPeak.val - 3, barWidth, 3);
            }
          }

          // Restore paint properties
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 2: Classic Central Water Droplet ---
        case 'blob-classic': {
          const centerX = width / 2;
          const centerY = height / 2;
          const baseRadius = Math.min(width, height) * 0.18 + (bass * 30);
          
          ctx.shadowBlur = settings.glow ? 20 : 0;
          ctx.shadowColor = settings.color === 'rainbow' ? '#60a5fa' : getThemeFill(0.85);
          ctx.fillStyle = settings.color === 'rainbow' ? 'rgba(255, 255, 255, 0.9)' : getThemeFill(0.9);
          
          ctx.beginPath();
          const points = 72;
          const time = performance.now() * 0.003;
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const waveIndex = Math.floor((Math.abs(points / 2 - i) / (points / 2)) * dataArray.length);
            const rawVal = dataArray[waveIndex] / 255;
            
            // Build dual-layered fluid distortion
            const radialOffset = Math.sin(angle * 6 + time) * (bass * 30) + Math.cos(angle * 3 - time * 1.5) * (mid * 15);
            const radius = baseRadius + radialOffset + (rawVal * 10);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 3: Water Droplet with Splash Particles (Bit-Kicker) ---
        case 'blob-splash': {
          const centerX = width / 2;
          const centerY = height / 2;
          const baseRadius = Math.min(width, height) * 0.16 + (bass * 35);
          
          ctx.shadowBlur = settings.glow ? 24 : 0;
          ctx.shadowColor = settings.color === 'rainbow' ? '#38bdf8' : getThemeFill(0.85);
          ctx.fillStyle = getThemeFill(0.95);
          
          // Render central water blob
          ctx.beginPath();
          const points = 60;
          const timeNow = performance.now() * 0.004;
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const dataIdx = Math.floor((i / points) * dataArray.length);
            const rawVal = dataArray[dataIdx] / 255;
            
            // Organic water wiggle
            const ripple = Math.sin(angle * 5 - timeNow * 2) * (bass * 35) + Math.sin(angle * 10 + timeNow) * (mid * 10);
            const r = baseRadius + ripple + (rawVal * 15);
            
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Splat emitters: spawn in directions when a beat kick hits
          const isTriggered = isBeat || (bass > 0.48 && Math.random() > 0.7);
          if (isTriggered && splashesRef.current.length < 150) {
            const count = Math.floor(4 + Math.random() * 8);
            for (let c = 0; c < count; c++) {
              const spawnAngle = Math.random() * Math.PI * 2;
              const splashSpeed = 4 + Math.random() * 9 + (bass * 6);
              splashesRef.current.push({
                x: centerX + Math.cos(spawnAngle) * baseRadius,
                y: centerY + Math.sin(spawnAngle) * baseRadius,
                vx: Math.cos(spawnAngle) * splashSpeed + (Math.random() - 0.5) * 3,
                vy: Math.sin(spawnAngle) * splashSpeed - 2 - (bass * 4), // lift up slightly
                size: 2 + Math.random() * 5,
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                gravity: 0.14
              });
            }
          }
          
          // Update and draw floating splashes/splatters (physics-based)
          splashesRef.current.forEach((sp) => {
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += sp.gravity; // Gravity pulling water splashes down
            sp.vx *= 0.98;       // Air resistance drag
            sp.alpha -= sp.decay;
            
            if (sp.alpha > 0) {
              ctx.beginPath();
              ctx.fillStyle = getThemeFill(sp.alpha);
              ctx.arc(sp.x, sp.y, sp.size * (1 + bass * 0.3), 0, Math.PI * 2);
              ctx.fill();
            }
          });
          
          // Filter alive splashes
          splashesRef.current = splashesRef.current.filter(sp => sp.alpha > 0);
          break;
        }

        // --- Variant 4: Multi-Layer Organic Jelly Droplet ---
        case 'blob-organic': {
          const centerX = width / 2;
          const centerY = height / 2;
          const layers = 3;
          const t = performance.now() * 0.002;
          
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.7);
          
          for (let l = 0; l < layers; l++) {
            const mult = 1 - l * 0.22;
            const baseRad = Math.min(width, height) * 0.19 * mult + (bass * 30 * mult);
            ctx.fillStyle = getThemeFill(0.18 + (l * 0.28)); // Multi-density liquid shading
            
            ctx.beginPath();
            const points = 72;
            for (let i = 0; i < points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const sourceIdx = Math.floor((i / points) * dataArray.length);
              const amp = dataArray[sourceIdx] / 255;
              
              const pulse = Math.sin(angle * (4 + l) + t * (1.2 + l * 0.4)) * (bass * 25 * mult) +
                            Math.cos(angle * 8 - t) * (mid * 8);
              const r = baseRad + pulse + (amp * 12 * mult);
              
              const x = centerX + Math.cos(angle) * r;
              const y = centerY + Math.sin(angle) * r;
              
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 5: Cosmic Stars & Particle Nebula (Preserved) ---
        case 'nebula': {
          const cX = width / 2;
          const cY = height / 2;

          // Pulse Nebula background on beat hits
          if (isBeat || bass > 0.45) {
            ctx.beginPath();
            const glowGrad = ctx.createRadialGradient(cX, cY, 10, cX, cY, Math.max(width, height) * 0.4);
            glowGrad.addColorStop(0, settings.color === 'rainbow' ? 'rgba(236,72,153,0.18)' : getThemeFill(0.25));
            glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, width, height);
          }

          // Render flying stars array
          const stars = particlesRef.current;
          const velocityFactor = 1 + (bass * 7);

          for (let i = 0; i < stars.length; i++) {
            const p = stars[i];
            p.z -= p.speed * velocityFactor;
            
            if (p.z <= 0) {
              p.x = (Math.random() - 0.5) * 1000;
              p.y = (Math.random() - 0.5) * 1000;
              p.z = 1000;
            }

            // Project 3d positions
            const projX = (p.x / p.z) * width + cX;
            const projY = (p.y / p.z) * height + cY;
            const starSize = (1 - p.z / 1000) * p.size * (1 + mid * 2);

            if (projX >= 0 && projX < width && projY >= 0 && projY < height) {
              ctx.beginPath();
              ctx.arc(projX, projY, Math.max(0.5, starSize), 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.fill();
            }
          }

          // Animated central glowing audio rings
          ctx.strokeStyle = getThemeFill(0.7);
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.8);
          ctx.lineWidth = 2 + mid * 4;

          ctx.beginPath();
          ctx.arc(cX, cY, 50 + highAverage(dataArray) * 200 * settings.maxHeight, 0, Math.PI * 2);
          ctx.stroke();

          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 6: Splash Crown Ring (Circle) ---
        case 'blob-ring': {
          const centerX = width / 2;
          const centerY = height / 2;
          const ringRad = Math.min(width, height) * 0.22 + (bass * 35);
          
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.7);
          
          const dropCount = 24;
          const t6 = performance.now() * 0.003;
          
          for (let i = 0; i < dropCount; i++) {
            const angle = (i / dropCount) * Math.PI * 2 + t6 * 0.1;
            const ampIndex = Math.floor((i / dropCount) * dataArray.length);
            const val = dataArray[ampIndex] / 255;
            
            // Radially outwards push water lines
            const currentRad = ringRad + (val * 50);
            const dropX = centerX + Math.cos(angle) * currentRad;
            const dropY = centerY + Math.sin(angle) * currentRad;
            
            // Draw water droplet bead
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(0.85);
            ctx.arc(dropX, dropY, 5 + val * 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Connect with thin web spline to give cohesive liquid crown vibe
            if (i > 0) {
              ctx.beginPath();
              ctx.strokeStyle = getThemeFill(0.25);
              ctx.lineWidth = 1.5;
              const prevAngle = ((i - 1) / dropCount) * Math.PI * 2 + t6 * 0.1;
              const prevVal = dataArray[Math.floor(((i - 1) / dropCount) * dataArray.length)] / 255;
              const prevRad = ringRad + (prevVal * 50);
              ctx.moveTo(centerX + Math.cos(prevAngle) * prevRad, centerY + Math.sin(prevAngle) * prevRad);
              ctx.lineTo(dropX, dropY);
              ctx.stroke();
            }
          }
          
          // Close the crown circle connection
          ctx.beginPath();
          ctx.strokeStyle = getThemeFill(0.25);
          const firstAngle = t6 * 0.1;
          const firstVal = dataArray[0] / 255;
          const firstRad = ringRad + (firstVal * 50);
          const lastAngle = ((dropCount - 1) / dropCount) * Math.PI * 2 + t6 * 0.1;
          const lastVal = dataArray[Math.floor(((dropCount - 1) / dropCount) * dataArray.length)] / 255;
          const lastRad = ringRad + (lastVal * 50);
          ctx.moveTo(centerX + Math.cos(lastAngle) * lastRad, centerY + Math.sin(lastAngle) * lastRad);
          ctx.lineTo(centerX + Math.cos(firstAngle) * firstRad, centerY + Math.sin(firstAngle) * firstRad);
          ctx.stroke();
          
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 7: Liquid Wave Horizon line ---
        case 'blob-fluid': {
          const midY = height / 2;
          ctx.beginPath();
          ctx.strokeStyle = getThemeFill(0.95);
          ctx.lineWidth = 4 + bass * 6;
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.8);
          
          const segments = 50;
          const t7 = performance.now() * 0.005;
          
          for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * width;
            const dataIdx = Math.floor((i / segments) * dataArray.length);
            const rawVal = dataArray[dataIdx] / 255;
            
            // Curved fluid horizon flow
            const offset = Math.sin(i * 0.3 - t7) * (bass * 45) + Math.cos(i * 0.7 + t7 * 1.5) * (mid * 15);
            const y = midY + offset + (rawVal * 10);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.bezierCurveTo(x - (width / segments / 2), y, x - (width / segments / 2), y, x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 8: Heavy Water Droplets Rain (Splashing Ripples) ---
        case 'blob-drop-rain': {
          // Initialize raindrop collections
          if (rainDropsRef.current.length === 0) {
            for (let i = 0; i < 40; i++) {
              rainDropsRef.current.push({
                x: Math.random() * width,
                y: Math.random() * -height,
                speed: 3 + Math.random() * 5,
                size: 2 + Math.random() * 3,
                rippleRadius: 0,
                maxRipple: 25 + Math.random() * 35,
                state: 'falling'
              });
            }
          }
          
          // Track activity level
          const velocityAdder = bass * 12;
          
          rainDropsRef.current.forEach((dp) => {
            if (dp.state === 'falling') {
              dp.y += dp.speed + velocityAdder;
              
              // Draw falling droplet pins
              ctx.beginPath();
              ctx.fillStyle = getThemeFill(0.7);
              ctx.fillRect(dp.x, dp.y, dp.size / 2, dp.size * 2.5);
              
              const floor = height * 0.82;
              if (dp.y >= floor) {
                dp.y = floor;
                dp.state = 'rippling';
                dp.rippleRadius = 1;
              }
            } else if (dp.state === 'rippling') {
              dp.rippleRadius += 1.8 + (mid * 3);
              const ratio = 1 - (dp.rippleRadius / dp.maxRipple);
              
              if (ratio > 0) {
                ctx.beginPath();
                ctx.strokeStyle = getThemeFill(ratio * 0.8);
                ctx.lineWidth = 1 + ratio * 2;
                ctx.ellipse(dp.x, dp.y, dp.rippleRadius, dp.rippleRadius * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                dp.x = Math.random() * width;
                dp.y = Math.random() * -200;
                dp.rippleRadius = 0;
                dp.state = 'falling';
                dp.speed = 3 + Math.random() * 5;
              }
            }
          });
          break;
        }

        // --- Variant 9: Magnetic Metadrops Apparition ---
        case 'blob-magnet': {
          const centerX = width / 2;
          const centerY = height / 2;
          const centralRadius = Math.min(width, height) * 0.15 + (bass * 35);
          
          // Attractor droplet
          ctx.beginPath();
          ctx.fillStyle = getThemeFill(0.95);
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.85);
          ctx.arc(centerX, centerY, centralRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          if (magneticNodesRef.current.length === 0) {
            for (let i = 0; i < 35; i++) {
              magneticNodesRef.current.push({
                x: 0,
                y: 0,
                size: 3 + Math.random() * 6,
                angle: Math.random() * Math.PI * 2,
                currentDist: 300 + Math.random() * 400,
                speed: 1.5 + Math.random() * 2.5
              });
            }
          }
          
          magneticNodesRef.current.forEach((node) => {
            const pullSpeed = (node.speed + (bass * 8)) * (1 + (600 - node.currentDist) * 0.002);
            node.currentDist -= pullSpeed;
            node.angle += 0.015;
            
            node.x = centerX + Math.cos(node.angle) * node.currentDist;
            node.y = centerY + Math.sin(node.angle) * node.currentDist;
            
            if (node.currentDist <= centralRadius) {
              node.currentDist = 350 + Math.random() * 350;
              node.angle = Math.random() * Math.PI * 2;
            }
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(Math.min(1, (node.currentDist - centralRadius) / 200));
            ctx.arc(node.x, node.y, node.size * (1 + mid * 0.4), 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }

        // --- Variant 10: Swirling Water Vortex ---
        case 'blob-vortex': {
          const centerX = width / 2;
          const centerY = height / 2;
          
          if (vortexParticlesRef.current.length === 0) {
            for (let i = 0; i < 150; i++) {
              vortexParticlesRef.current.push({
                angle: Math.random() * Math.PI * 2,
                radius: 50 + Math.random() * 500,
                speed: 0.02 + Math.random() * 0.03,
                size: 1.5 + Math.random() * 3
              });
            }
          }
          
          ctx.shadowBlur = settings.glow ? 12 : 0;
          ctx.shadowColor = getThemeFill(0.7);
          
          const spinFactor = 1 + (bass * 3);
          
          vortexParticlesRef.current.forEach((part) => {
            part.angle += part.speed * spinFactor;
            part.radius -= 1.2 * spinFactor;
            
            if (part.radius < 15) {
              part.radius = 450 + Math.random() * 150;
              part.angle = Math.random() * Math.PI * 2;
            }
            
            const px = centerX + Math.cos(part.angle) * part.radius;
            const py = centerY + Math.sin(part.angle) * part.radius;
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(Math.min(1.0, part.radius / 150));
            ctx.arc(px, py, part.size * (1 + treble * 0.4), 0, Math.PI * 2);
            ctx.fill();
          });
          
          ctx.shadowBlur = 0;
          
          // Lock hole
          ctx.beginPath();
          ctx.fillStyle = '#000000';
          ctx.arc(centerX, centerY, 15 + bass * 15, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        // --- Variant 11: Sinusoidal Stream of Water Beads ---
        case 'blob-sine': {
          const midY = height / 2;
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.85);
          
          const maxH = height * settings.maxHeight * 0.45;
          const beadCount = 60;
          const t11 = performance.now() * 0.003;
          
          for (let i = 0; i < beadCount; i++) {
            const fraction = i / beadCount;
            const x = fraction * width;
            const dataIdx = Math.floor(fraction * dataArray.length);
            const val = dataArray[dataIdx] / 255;
            
            const waveY = midY + Math.sin(fraction * Math.PI * 4 - t11) * maxH * bass +
                            Math.cos(fraction * Math.PI * 8 + t11 * 1.5) * (mid * 20);
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(0.9);
            ctx.arc(x, waveY, 4 + val * 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 12: Hydrodynamic Liquid Lattice (Mesh Grid) ---
        case 'blob-grid': {
          const cols = 15;
          const rows = 12;
          const startX = width * 0.1;
          const endX = width * 0.9;
          const startY = height * 0.15;
          const endY = height * 0.85;
          const t12 = performance.now() * 0.002;
          
          for (let c = 0; c < cols; c++) {
            const cx = startX + (c / (cols - 1)) * (endX - startX);
            const rawIndex = Math.floor((c / cols) * dataArray.length);
            const val = dataArray[rawIndex] / 255;
            
            for (let r = 0; r < rows; r++) {
              const cy = startY + (r / (rows - 1)) * (endY - startY);
              
              const deformX = Math.sin(c * 0.4 + t12) * (bass * 15);
              const deformY = Math.cos(r * 0.4 - t12) * (mid * 15);
              
              ctx.beginPath();
              ctx.fillStyle = getThemeFill(0.35 + (val * 0.65));
              ctx.arc(cx + deformX, cy + deformY, 3 + val * 6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        }

        // --- Variant 13: Central core with pulsing Hydro-Rays ---
        case 'blob-pulsar': {
          const centerX = width / 2;
          const centerY = height / 2;
          const coreRadius = Math.min(width, height) * 0.14 + (bass * 25);
          
          ctx.shadowBlur = settings.glow ? 20 : 0;
          ctx.shadowColor = getThemeFill(0.9);
          
          const rayCount = 48;
          ctx.lineWidth = 2.5;
          
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + (performance.now() * 0.0004);
            const valIdx = Math.floor((Math.abs(rayCount / 2 - i) / (rayCount / 2)) * dataArray.length);
            const val = dataArray[valIdx] / 255;
            
            const rayLen = coreRadius + (val * 140 * settings.maxHeight);
            const outerX = centerX + Math.cos(angle) * rayLen;
            const outerY = centerY + Math.sin(angle) * rayLen;
            
            ctx.beginPath();
            ctx.strokeStyle = getThemeFill(0.4 + val * 0.6);
            ctx.moveTo(centerX + Math.cos(angle) * coreRadius, centerY + Math.sin(angle) * coreRadius);
            ctx.lineTo(outerX, outerY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(0.9);
            ctx.arc(outerX, outerY, 3.5 + val * 6, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.beginPath();
          ctx.fillStyle = getThemeFill(1.0);
          ctx.arc(centerX, centerY, coreRadius * 0.9, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 14: Orbiting Counter-balancing Droplets (Yin-Yang) ---
        case 'blob-yin-yang': {
          const centerX = width / 2;
          const centerY = height / 2;
          const orbitsRad = 90 + (bass * 50);
          const orbitAngle = performance.now() * 0.0018;
          
          ctx.shadowBlur = settings.glow ? 15 : 0;
          ctx.shadowColor = getThemeFill(0.85);
          
          for (let k = 0; k < 2; k++) {
            const currentAngle = orbitAngle + k * Math.PI;
            const ox = centerX + Math.cos(currentAngle) * orbitsRad;
            const oy = centerY + Math.sin(currentAngle) * orbitsRad;
            
            const dropSize = 25 + (k === 0 ? mid : treble) * 45;
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(0.9);
            ctx.arc(ox, oy, dropSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.strokeStyle = getThemeFill(0.35);
            ctx.lineWidth = 4;
            ctx.arc(centerX, centerY, orbitsRad, currentAngle - 0.45, currentAngle, false);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          break;
        }

        // --- Variant 15: Abstract Fluid Cascades on Edges ---
        case 'blob-abstract': {
          const edgeWidth = 90;
          const flowCount = 18;
          
          ctx.shadowBlur = settings.glow ? 12 : 0;
          ctx.shadowColor = getThemeFill(0.7);
          
          for (let i = 0; i < flowCount; i++) {
            const fraction = i / flowCount;
            const y = fraction * height;
            const rawVal = dataArray[Math.floor(fraction * dataArray.length)] / 255;
            
            const length = rawVal * edgeWidth * settings.maxHeight * 1.5;
            ctx.fillStyle = getThemeFill(0.45 + rawVal * 0.5);
            ctx.fillRect(0, y, length, 6);
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(0.9);
            ctx.arc(length + 4, y + 3, 4 + rawVal * 5, 0, Math.PI * 2);
            ctx.fill();
          }
          
          for (let i = 0; i < flowCount; i++) {
            const fraction = i / flowCount;
            const y = fraction * height;
            const rawVal = dataArray[Math.floor((1 - fraction) * dataArray.length)] / 255;
            
            const length = rawVal * edgeWidth * settings.maxHeight * 1.5;
            ctx.fillStyle = getThemeFill(0.45 + rawVal * 0.5);
            ctx.fillRect(width - length, y, length, 6);
            
            ctx.beginPath();
            ctx.fillStyle = getThemeFill(0.9);
            ctx.arc(width - length - 4, y + 3, 4 + rawVal * 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }

        default:
          break;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [dimensions, activeId, settings, isSimulated, isPlaying, bgImage, bgOpacity]);

  // Small helper calculation to average high range treble
  const highAverage = (arr: Uint8Array) => {
    let sum = 0;
    const startIdx = Math.floor(arr.length * 0.65);
    for (let j = startIdx; j < arr.length; j++) {
      sum += arr[j];
    }
    return sum / (arr.length - startIdx) / 255;
  };

  return (
    <div
      ref={containerRef}
      id="root-visualizer-container"
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center rounded-xl border border-zinc-800 shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        id="visualizer-canvas-screen"
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      />
    </div>
  );
}
