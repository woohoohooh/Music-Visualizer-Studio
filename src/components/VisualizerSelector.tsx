import React from 'react';
import { VisualizerId, VisualizerVariant } from '../types';
import { 
  Sliders, 
  Activity, 
  CircleDot, 
  Compass, 
  Sparkles, 
  Orbit, 
  Waves, 
  Table, 
  Eye, 
  Radio, 
  Flame, 
  Box, 
  Droplet
} from 'lucide-react';

const VARIANTS: VisualizerVariant[] = [
  {
    id: 'bars',
    name: '1. Classic Spectrum (Sliders)',
    description: 'Dense white bars along the bottom, stretched edge-to-edge. Full real-time customization via sliders.',
    icon: 'Sliders'
  },
  {
    id: 'blob-classic',
    name: '2. Fluid Droplet (Center)',
    description: 'Minimalist white water droplet in the center, flexing smoothly to bass and midrange pulses.',
    icon: 'Droplet'
  },
  {
    id: 'blob-splash',
    name: '3. Splatter Droplet (Beat Kicker)',
    description: 'Reactive central water droplet vibrating in all directions, discharging flying splash droplets on punchy kicks!',
    icon: 'Sparkles'
  },
  {
    id: 'blob-organic',
    name: '4. Multi-Layer Fluid (Organic)',
    description: 'Layered translucent water contours creating a voluminous living liquid silhouette.',
    icon: 'Waves'
  },
  {
    id: 'nebula',
    name: '5. Cosmic Star Nebula',
    description: 'Deep space 3D particle warp reacting to speed and bass bursts.',
    icon: 'Orbit'
  },
  {
    id: 'blob-ring',
    name: '6. Crown Splash (Radial Ring)',
    description: 'Radial burst of droplet beads exploding outward from the center to rhythmic transients.',
    icon: 'CircleDot'
  },
  {
    id: 'blob-fluid',
    name: '7. Liquid Horizon (Wave)',
    description: 'Horizontal flowing waterline undulating rhythmically across the center of the frame.',
    icon: 'Activity'
  },
  {
    id: 'blob-drop-rain',
    name: '8. Heavy Rain & Ripples',
    description: 'Descending liquid beads bursting into concentric shockwave ripples across the screen.',
    icon: 'Flame'
  },
  {
    id: 'blob-magnet',
    name: '9. Magnetic Metadrops',
    description: 'Orbital droplet swarm gravitationally pulled toward the central fluid nucleus.',
    icon: 'Eye'
  },
  {
    id: 'blob-vortex',
    name: '10. Hydro Vortex (Spiral)',
    description: 'Spiral vortex of white liquid beads swirling inward in tempo with the music.',
    icon: 'Compass'
  },
  {
    id: 'blob-sine',
    name: '11. Sinusoidal Bead Stream',
    description: 'Running stream of water droplets dispersing into pearl clusters at harmonic peaks.',
    icon: 'Radio'
  },
  {
    id: 'blob-grid',
    name: '12. Liquid Lattice (Membrane)',
    description: 'Flexible crystalline lattice of water nodes oscillating to frequency dynamics.',
    icon: 'Table'
  },
  {
    id: 'blob-pulsar',
    name: '13. Hydro-Resonator (Pulsar)',
    description: 'Pulsating core emitting radiating liquid beacons with energy flare spikes.',
    icon: 'Box'
  },
  {
    id: 'blob-yin-yang',
    name: '14. Dual Orbit (Yin-Yang)',
    description: 'Two balanced liquid droplets gracefully orbiting each other in harmonic equilibrium.',
    icon: 'Sliders'
  },
  {
    id: 'blob-abstract',
    name: '15. Waterfall Cascade (Edges)',
    description: 'Twin fluid cascades running down the screen edges responding to stereo dynamics.',
    icon: 'Waves'
  }
];

interface VisualizerSelectorProps {
  selectedId: VisualizerId;
  onSelect: (id: VisualizerId) => void;
}

export default function VisualizerSelector({ selectedId, onSelect }: VisualizerSelectorProps) {
  // Simple map from string representation to Lucide icons
  const renderIcon = (name: string, isSelected: boolean) => {
    const cls = `w-5 h-5 ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`;
    switch (name) {
      case 'Sliders': return <Sliders id="icon-sliders" className={cls} />;
      case 'Activity': return <Activity id="icon-activity" className={cls} />;
      case 'CircleDot': return <CircleDot id="icon-circledot" className={cls} />;
      case 'Compass': return <Compass id="icon-compass" className={cls} />;
      case 'Sparkles': return <Sparkles id="icon-sparkles" className={cls} />;
      case 'Orbit': return <Orbit id="icon-orbit" className={cls} />;
      case 'Waves': return <Waves id="icon-waves" className={cls} />;
      case 'Table': return <Table id="icon-table" className={cls} />;
      case 'Eye': return <Eye id="icon-eye" className={cls} />;
      case 'Radio': return <Radio id="icon-radio" className={cls} />;
      case 'Flame': return <Flame id="icon-flame" className={cls} />;
      case 'Box': return <Box id="icon-box" className={cls} />;
      case 'Droplet': return <Droplet id="icon-droplet" className={cls} />;
      default: return <Sliders id="icon-default" className={cls} />;
    }
  };

  return (
    <div id="visualizer-selection-panel" className="backdrop-blur-2xl bg-black/40 border border-white/10 p-6 rounded-2xl shadow-2xl">
      <h3 id="selector-panel-heading" className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
        Choose Visualizer Style ({VARIANTS.length} Presets)
      </h3>
      <div id="variants-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {VARIANTS.map((v) => {
          const isSelected = v.id === selectedId;
          return (
            <button
              key={v.id}
              id={`variant-btn-${v.id}`}
              onClick={() => onSelect(v.id)}
              className={`group flex items-start p-3.5 rounded-xl border text-left transition-all backdrop-blur-md ${
                isSelected
                  ? 'bg-white/10 border-indigo-550/50 shadow-indigo-550/20 shadow-lg scale-[1.01]'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div 
                id={`icon-container-${v.id}`} 
                className={`p-2 rounded-lg mr-3 mt-0.5 ${
                  isSelected ? 'bg-indigo-950/40 border border-indigo-500/35' : 'bg-black/40 border border-white/5'
                }`}
              >
                {renderIcon(v.icon, isSelected)}
              </div>
              <div id={`variant-meta-${v.id}`} className="flex-1 min-w-0">
                <p 
                  id={`variant-name-${v.id}`} 
                  className={`text-sm font-medium leading-none ${
                    isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                  }`}
                >
                  {v.name}
                </p>
                <p 
                  id={`variant-desc-${v.id}`} 
                  className="text-xs text-zinc-400 mt-1.5 leading-normal"
                >
                  {v.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
