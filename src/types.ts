export type VisualizerId =
  | 'bars'          // Variant 1: White bar spectrum with physical sliders
  | 'blob-classic'   // Variant 2: Classic central water droplet
  | 'blob-splash'    // Variant 3: Water droplet with flying splatter effects on high beats
  | 'blob-organic'   // Variant 4: Multi-layer organic liquid droplet
  | 'nebula'        // Variant 5: Cosmic Stars & Particle Nebula (Preserved)
  | 'blob-ring'      // Variant 6: Ring of splashing liquid droplets
  | 'blob-fluid'     // Variant 7: Horizontal melting liquid wave
  | 'blob-drop-rain' // Variant 8: Heavy water drops rain bursting on beats
  | 'blob-magnet'    // Variant 9: Magnetic attracting liquid droplets
  | 'blob-vortex'    // Variant 10: Swirling vortex of water beads
  | 'blob-sine'      // Variant 11: Sinusoidal stream of liquid beads
  | 'blob-grid'      // Variant 12: Hydrodynamic liquid lattice
  | 'blob-pulsar'    // Variant 13: Pulsating droplet with liquid rays
  | 'blob-yin-yang'  // Variant 14: Two orbiting fluid droplets
  | 'blob-abstract'; // Variant 15: Abstract liquid edge waterfall

export interface VisualizerVariant {
  id: VisualizerId;
  name: string;
  description: string;
  icon: string; // Icon identifier
}

export interface BarVisualizerSettings {
  barCount: number;
  maxHeight: number; // percentage of screen or pixel ratio
  barWidth: number;
  gap: number;
  sensitivity: number;
  smoothing: number;
  color: string;
  glow: boolean;
}

export interface AudioFrequencyData {
  frequencies: Uint8Array;
  timeDomain: Uint8Array;
  volume: number; // 0.0 to 1.0 representation of overall amplitude
  bass: number;   // average low frequency strength
  mid: number;    // average midrange strength
  treble: number; // average high frequency strength
  isBeatDetected: boolean;
}
