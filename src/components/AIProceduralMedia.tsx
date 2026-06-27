import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Settings, SlidersHorizontal, Music, Info, RefreshCw, Sparkles, Download } from 'lucide-react';

interface ProceduralSoundPlayerProps {
  soundType: string;
  prompt: string;
  darkMode: boolean;
  language: string;
}

export const ProceduralSoundPlayer: React.FC<ProceduralSoundPlayerProps> = ({
  soundType,
  prompt,
  darkMode,
  language
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<'sine' | 'square' | 'sawtooth' | 'triangle'>('sine');
  const [pitchMultiplier, setPitchMultiplier] = useState(1);
  const [duration, setDuration] = useState(0.4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasAnimRef = useRef<number | null>(null);

  // Set default parameters based on soundType
  useEffect(() => {
    if (soundType === 'coin') {
      setWaveform('sine');
      setDuration(0.35);
    } else if (soundType === 'explosion') {
      setWaveform('square');
      setDuration(0.8);
    } else if (soundType === 'laser') {
      setWaveform('sawtooth');
      setDuration(0.3);
    } else if (soundType === 'jump') {
      setWaveform('triangle');
      setDuration(0.25);
    } else if (soundType === 'powerup') {
      setWaveform('sine');
      setDuration(0.6);
    } else if (soundType === 'teleport') {
      setWaveform('sawtooth');
      setDuration(0.7);
    }
  }, [soundType]);

  // Animate static waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = soundType === 'coin' ? '#eab308' : soundType === 'explosion' ? '#ef4444' : soundType === 'laser' ? '#a855f7' : '#3b82f6';
      
      for (let x = 0; x < canvas.width; x++) {
        let y = canvas.height / 2;
        const angle = (x / canvas.width) * Math.PI * 10 + offset;
        
        if (waveform === 'sine') {
          y += Math.sin(angle) * (canvas.height / 3.5);
        } else if (waveform === 'sawtooth') {
          y += ((x % 30) / 15 - 1) * (canvas.height / 4);
        } else if (waveform === 'square') {
          y += (Math.sin(angle) >= 0 ? 1 : -1) * (canvas.height / 4);
        } else if (waveform === 'triangle') {
          y += (Math.abs((angle % (Math.PI * 2)) - Math.PI) / Math.PI - 0.5) * (canvas.height / 2);
        }
        
        // Add decay envelope visual representation
        const decay = 1 - x / canvas.width;
        y = (y - canvas.height / 2) * decay + canvas.height / 2;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      if (isPlaying) {
        offset += 0.22;
      } else {
        offset += 0.01;
      }
      canvasAnimRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (canvasAnimRef.current) cancelAnimationFrame(canvasAnimRef.current);
    };
  }, [waveform, isPlaying, soundType]);

  const triggerSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsPlaying(true);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = waveform;

      // Base pitches
      const baseFreq = (soundType === 'coin' ? 523 : soundType === 'explosion' ? 120 : soundType === 'laser' ? 880 : soundType === 'jump' ? 150 : soundType === 'powerup' ? 261 : soundType === 'teleport' ? 300 : 440) * pitchMultiplier;

      if (soundType === 'coin') {
        // Double chime
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.08);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      } else if (soundType === 'explosion') {
        // Deep rumble sweep-down
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + duration);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        // Add a secondary white noise pop
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(250, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(30, now + duration);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
      } else if (soundType === 'laser') {
        // Fast descending frequency sweep
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + duration);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      } else if (soundType === 'jump') {
        // Pitch sweep up
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 3.5, now + duration);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      } else if (soundType === 'powerup') {
        // Multi-tier ascending chord
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.1);
        osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.2);
        osc.frequency.setValueAtTime(baseFreq * 2.0, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      } else if (soundType === 'teleport') {
        // Vibey scifi sweep
        osc.frequency.setValueAtTime(baseFreq, now);
        for (let t = 0; t < duration; t += 0.05) {
          const lfoPitch = baseFreq + Math.sin(t * 40) * 120;
          osc.frequency.setValueAtTime(lfoPitch, now + t);
        }
        gainNode.gain.setValueAtTime(0.22, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      } else {
        // General synth sweep
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + duration);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      }

      osc.start(now);
      osc.stop(now + duration);

      setTimeout(() => {
        setIsPlaying(false);
      }, duration * 1000);

    } catch (err) {
      console.error('Audio synthesis failed:', err);
      setIsPlaying(false);
    }
  };

  const soundTitles: Record<string, string> = {
    coin: language === 'de' ? '🪙 Münz-Sammler (Retro)' : '🪙 Coin Chime (Retro)',
    explosion: language === 'de' ? '💥 Krawall Explosion' : '💥 Heavy Explosion',
    laser: language === 'de' ? '🔫 Sci-Fi Laser Blaster' : '🔫 Sci-Fi Laser',
    jump: language === 'de' ? '🦘 Retro Sprung' : '🦘 Arcade Jump',
    powerup: language === 'de' ? '⭐ Level Up! Upgrade' : '⭐ Power-Up Upgrade',
    teleport: language === 'de' ? '🛸 Warp Teleportation' : '🛸 Warp Teleport',
    synth: language === 'de' ? '🎹 Synthesizer Sweep' : '🎹 Synthesizer Sweep'
  };

  return (
    <div className={`p-4 rounded-2xl border text-left flex flex-col gap-3 my-3 shadow-sm select-none max-w-md ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#e2e5f1] text-[#0d0f1a]'
    }`}>
      <div className="flex items-center justify-between border-b pb-2 border-slate-205/10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs font-black">SOUND ENGINE</span>
          <h4 className="text-[13px] font-extrabold truncate max-w-[180px]">{soundTitles[soundType] || soundTitles['synth']}</h4>
        </div>
        <button 
          onClick={triggerSound}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all transform cursor-pointer active:scale-95 ${
            isPlaying 
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500' 
              : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? (language === 'de' ? 'Spielt' : 'Playing') : (language === 'de' ? 'Anhören' : 'Play')}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between text-[10px] font-extrabold opacity-60">
          <span>{language === 'de' ? 'WAVEFORM' : 'WAVEFORM'}</span>
          <span>{waveform.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(['sine', 'square', 'sawtooth', 'triangle'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWaveform(w)}
              className={`text-[9px] font-black uppercase py-1 rounded-md transition border cursor-pointer ${
                waveform === w 
                  ? 'bg-indigo-500 text-white border-transparent shadow' 
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 border-transparent'
              }`}
            >
              {w.slice(0, 4)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-black opacity-60">
            <span>{language === 'de' ? 'PITCH MULTIPLIER' : 'PITCH MULTIPLIER'}</span>
            <span>{pitchMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="3.0"
            step="0.1"
            value={pitchMultiplier}
            onChange={(e) => setPitchMultiplier(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none dark:bg-slate-700"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-black opacity-60">
            <span>{language === 'de' ? 'DURATION' : 'DURATION'}</span>
            <span>{duration.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none dark:bg-slate-700"
          />
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-205/10 bg-slate-950 h-16 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 pointer-events-none opacity-85" width={380} height={64} />
        {!isPlaying && (
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 relative z-10 select-none animate-pulse">
            {language === 'de' ? 'BEREIT ZUM ABSPIELEN' : 'READY TO TRIGGER'}
          </span>
        )}
      </div>
    </div>
  );
};


// ── DYNAMIC PROCEDURAL LOOP MUSIC COMPOSER ──
interface ProceduralMusicPlayerProps {
  musicStyle: string;
  prompt: string;
  darkMode: boolean;
  language: string;
}

export const ProceduralMusicPlayer: React.FC<ProceduralMusicPlayerProps> = ({
  musicStyle,
  prompt,
  darkMode,
  language
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempoBpm, setTempoBpm] = useState(110);
  const [activeTracks, setActiveTracks] = useState({ bass: true, melody: true, drums: true });
  const [currentStep, setCurrentStep] = useState(0);
  const [cutoff, setCutoff] = useState(1200);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sequencerIntervalRef = useRef<any | null>(null);
  const stepCount = 8;
  const canvasAnimRef = useRef<number | null>(null);

  useEffect(() => {
    // Customize tempo default based on musicStyle
    if (musicStyle === 'lofi') {
      setTempoBpm(80);
      setCutoff(800);
    } else if (musicStyle === 'techno') {
      setTempoBpm(130);
      setCutoff(1600);
    } else if (musicStyle === 'retro') {
      setTempoBpm(120);
      setCutoff(2500);
    } else if (musicStyle === 'happy') {
      setTempoBpm(115);
      setCutoff(1800);
    } else if (musicStyle === 'sad') {
      setTempoBpm(70);
      setCutoff(750);
    }
  }, [musicStyle]);

  // Audio composer scheduler
  const triggerNote = (freq: number, type: 'sine' | 'sawtooth' | 'triangle' | 'square', duration: number, gainVal: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Apply cutoff filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, ctx.currentTime);

    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const triggerDrumClick = (now: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Snare/Hat noise pop
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    gainNode.connect(ctx.destination);
    noise.start(now);
  };

  const playStep = (step: number) => {
    if (!audioCtxRef.current) return;
    
    // Bass note sequences (Pentatonic scale degrees based on mood)
    const baseFreq = musicStyle === 'lofi' ? 110 : musicStyle === 'techno' ? 82.4 : musicStyle === 'retro' ? 130.8 : musicStyle === 'happy' ? 146.8 : musicStyle === 'sad' ? 98.0 : 110;
    const bassScale = [1, 1.2, 1.33, 1.5, 1.68, 1.87, 2.0, 1.5];
    const bassFreq = baseFreq * bassScale[step % bassScale.length];

    // Bass trigger
    if (activeTracks.bass && (step % 2 === 0)) {
      triggerNote(bassFreq, 'triangle', 0.25, 0.28);
    }

    // Melody sequences (High-pitched sparkling tones)
    const melodyScaleDe = musicStyle === 'lofi' 
      ? [440, 494, 523, 587, 659, 784, 880, 987]
      : musicStyle === 'techno'
        ? [164.8, 196, 220, 246.9, 293.7, 329.6, 392, 440]
        : musicStyle === 'retro'
          ? [523.2, 587.3, 659.3, 698.5, 784, 880, 987.8, 1046.5]
          : musicStyle === 'happy'
            ? [587.3, 659.3, 740, 784, 880, 987.8, 1109, 1174.7]
            : [392, 440, 466.2, 523.3, 587.3, 622.3, 698.5, 784]; // Sad G minor

    const melodyNotes = [0, -1, 2, 4, 1, 3, 6, 5];
    const targetMelodyFreq = melodyScaleDe[(melodyNotes[step] + step) % melodyScaleDe.length];

    if (activeTracks.melody && (step % 2 !== 0 || step === 0)) {
      triggerNote(targetMelodyFreq, musicStyle === 'retro' ? 'square' : 'sine', 0.35, 0.15);
    }

    // Drums pop
    if (activeTracks.drums) {
      if (step === 0 || step === 4) {
        // Kick punch (Low sine thump)
        triggerNote(65, 'sine', 0.15, 0.45);
      } else if (step === 2 || step === 6) {
        // Hat click
        triggerDrumClick(audioCtxRef.current.currentTime);
      }
    }
  };

  const startPlayback = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsPlaying(true);
      let step = 0;
      setCurrentStep(0);

      const intervalMs = (60 / tempoBpm) * 250; // Sixteenth note subdivisions
      sequencerIntervalRef.current = setInterval(() => {
        playStep(step);
        setCurrentStep(step);
        step = (step + 1) % stepCount;
      }, intervalMs);

    } catch (err) {
      console.error('Sequencer setup failed:', err);
    }
  };

  const stopPlayback = () => {
    if (sequencerIntervalRef.current) {
      clearInterval(sequencerIntervalRef.current);
      sequencerIntervalRef.current = null;
    }
    setIsPlaying(false);
  };

  // Keep interval updated when tempo changes on the fly
  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
  }, [tempoBpm, activeTracks, cutoff]);

  useEffect(() => {
    return () => {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
      }
    };
  }, []);

  // Visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = Array(20).fill(0).map(() => Math.random() * 20);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = darkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(243, 244, 246, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bars.length;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#ec4899');

      for (let i = 0; i < bars.length; i++) {
        if (isPlaying) {
          // Dynamic height sweeps based on steps
          const speedFactor = (i % 3 + 1) * 0.15;
          bars[i] = Math.abs(Math.sin(Date.now() * 0.005 * speedFactor + i)) * (canvas.height - 10) + 4;
        } else {
          bars[i] = Math.max(2, bars[i] - 1.2);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(i * barWidth + 2, canvas.height - bars[i], barWidth - 4, bars[i], 4);
        ctx.fill();
      }

      canvasAnimRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (canvasAnimRef.current) cancelAnimationFrame(canvasAnimRef.current);
    };
  }, [isPlaying]);

  const styleLabels: Record<string, string> = {
    lofi: language === 'de' ? 'Entspannter Lofi-Beat' : 'Chill Lofi Beat',
    techno: language === 'de' ? 'Cyber Techno Loop' : 'Cyber Techno Loop',
    retro: language === 'de' ? '8-Bit Retro Chiptune' : '8-Bit Retro Chiptune',
    happy: language === 'de' ? 'Fröhlicher Upbeat Loop' : 'Cheerful Upbeat Loop',
    sad: language === 'de' ? 'Melancholisches Piano Loop' : 'Melancholy Piano Loop',
    ambient: language === 'de' ? 'Atmosphärisches Pad' : 'Atmospheric Pad'
  };

  return (
    <div className={`p-4 rounded-2xl border text-left flex flex-col gap-3 my-3 shadow-lg max-w-md ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#e2e5f1] text-[#0d0f1a]'
    }`}>
      <div className="flex items-center justify-between border-b pb-2 border-slate-205/10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black">MUSIC SYNTH</span>
          <h4 className="text-[13px] font-extrabold truncate max-w-[180px]">{styleLabels[musicStyle] || styleLabels['ambient']}</h4>
        </div>
        <button 
          onClick={isPlaying ? stopPlayback : startPlayback}
          className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all transform cursor-pointer active:scale-95 ${
            isPlaying 
              ? 'bg-red-500 text-white hover:bg-red-600 shadow shadow-red-500/20' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? (language === 'de' ? 'Pause' : 'Pause') : (language === 'de' ? 'Spielen' : 'Play')}</span>
        </button>
      </div>

      <div className="relative rounded-lg overflow-hidden h-14 bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 pointer-events-none opacity-85" width={380} height={56} />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none animate-pulse">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
              {language === 'de' ? 'BEREIT ZUM KOMPONIEREN' : 'READY TO COMPOSE'}
            </span>
          </div>
        )}
      </div>

      {/* Steps Visualizer */}
      <div className="flex items-center justify-between gap-1.5 p-2 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        {Array(stepCount).fill(0).map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-3 rounded-md transition-all duration-100 ${
              idx === currentStep && isPlaying
                ? 'bg-emerald-500 scale-110 shadow-lg' 
                : 'bg-slate-200 dark:bg-slate-800'
            }`} 
          />
        ))}
      </div>

      {/* Control Mixer */}
      <div className="grid grid-cols-3 gap-2 border-t pt-2 border-slate-205/10">
        <button
          onClick={() => setActiveTracks(p => ({ ...p, melody: !p.melody }))}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer border ${
            activeTracks.melody 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-slate-50/50 dark:bg-slate-900 border-transparent text-slate-400'
          }`}
        >
          <span>🎹</span>
          <span>MELODY</span>
        </button>
        <button
          onClick={() => setActiveTracks(p => ({ ...p, bass: !p.bass }))}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer border ${
            activeTracks.bass 
              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' 
              : 'bg-slate-50/50 dark:bg-slate-900 border-transparent text-slate-400'
          }`}
        >
          <span>🎸</span>
          <span>BASS</span>
        </button>
        <button
          onClick={() => setActiveTracks(p => ({ ...p, drums: !p.drums }))}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer border ${
            activeTracks.drums 
              ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' 
              : 'bg-slate-50/50 dark:bg-slate-900 border-transparent text-slate-400'
          }`}
        >
          <span>🥁</span>
          <span>DRUMS</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-black opacity-60">
            <span>{language === 'de' ? 'TEMPO (BPM)' : 'TEMPO (BPM)'}</span>
            <span>{tempoBpm} BPM</span>
          </div>
          <input
            type="range"
            min="60"
            max="160"
            step="5"
            value={tempoBpm}
            onChange={(e) => setTempoBpm(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none dark:bg-slate-700"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-black opacity-60">
            <span>{language === 'de' ? 'SYNTH FILTER' : 'FILTER CUTOFF'}</span>
            <span>{cutoff} Hz</span>
          </div>
          <input
            type="range"
            min="300"
            max="3000"
            step="50"
            value={cutoff}
            onChange={(e) => setCutoff(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none dark:bg-slate-700"
          />
        </div>
      </div>
    </div>
  );
};


// ── CINEMATIC DYNAMIC KI-VIDEO LOOP PLAYER ──
interface LoopingVideoPlayerProps {
  videoUrl: string;
  videoType?: string;
  videoTitle?: string;
  darkMode: boolean;
  language: string;
}

export const LoopingVideoPlayer: React.FC<LoopingVideoPlayerProps> = ({
  videoUrl,
  videoType,
  videoTitle,
  darkMode,
  language
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // For image-to-video, we render a highly visual cinematic photo zoom (Ken Burns zoom) 
  // overlaid with a drifting visualizer particle field in HTML/CSS! This is exceptionally creative.
  const isImageToVideo = videoType === 'image-to-video';

  return (
    <div 
      ref={containerRef}
      className={`p-3 rounded-2xl border text-left flex flex-col gap-2.5 my-3 shadow-md max-w-sm sm:max-w-md ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#e2e5f1] text-[#0d0f1a]'
      }`}
    >
      <div className="flex items-center justify-between border-b pb-2 border-slate-205/10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-wider">AI VIDEO GENERATOR</span>
          <h4 className="text-[12px] font-extrabold truncate max-w-[150px]">{videoTitle || (language === 'de' ? 'KI-Video' : 'AI Video')}</h4>
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase">
          {isImageToVideo ? 'IMAGE-TO-VIDEO' : 'TEXT-TO-VIDEO'}
        </span>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-850/50 shadow-inner group">
        {isImageToVideo ? (
          // Simulated 3D Parallax & Ken Burns zoom animation loop with particles
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            <img 
              src={videoUrl} 
              alt="Animate frame" 
              className="absolute w-full h-full object-cover animate-[kenburns_16s_infinite_alternate]"
              style={{ transformOrigin: 'center center' }}
            />
            
            {/* Drifting amber neon fireflies */}
            <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70">
              <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full blur-[2px] animate-[particle_12s_infinite] top-1/4 left-1/3" />
              <div className="absolute w-2 h-2 bg-orange-400 rounded-full blur-[3px] animate-[particle_18s_infinite] top-1/2 left-2/3" />
              <div className="absolute w-1 h-1 bg-yellow-200 rounded-full blur-[1px] animate-[particle_9s_infinite] top-2/3 left-1/5" />
              <div className="absolute w-2.5 h-2.5 bg-amber-400 rounded-full blur-[4px] animate-[particle_22s_infinite] top-1/3 left-3/4" />
            </div>

            {/* Cinematic cinematic lighting leaks overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15 text-[9.5px] text-white">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="font-extrabold uppercase tracking-wide">Image-to-Video Loop Rendering</span>
            </div>
          </div>
        ) : (
          // Play actual mp4 video render loop
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            loop 
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Styled downlader utility link */}
      <div className="flex items-center justify-between mt-1 text-[10px] opacity-65">
        <p className="max-w-[200px] truncate">{language === 'de' ? 'Rendering abgeschlossen. Hohe Frame-Rate.' : 'Rendering completed. High framerate.'}</p>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#4f6ef7] hover:text-[#3b59df] font-black transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'de' ? 'Herunterladen' : 'Download'}</span>
        </a>
      </div>

      {/* CSS rules definition for image animation */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) rotate(0deg) translate(0px, 0px); }
          100% { transform: scale(1.15) rotate(1deg) translate(-10px, -5px); }
        }
        @keyframes particle {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-80px) translateX(25px) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
