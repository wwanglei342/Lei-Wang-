
import React, { useMemo, useEffect, useRef } from 'react';
import { SpindleParams } from '../types';
import { SPINDLE_COLORS } from '../constants';

interface Props {
  params: SpindleParams;
  showPressureMap: boolean;
  showAirParticles: boolean;
}

const SpindleVisualizer: React.FC<Props> = ({ params, showPressureMap, showAirParticles }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Normalize eccentricity for visualization
  // High load = high eccentricity
  const eccentricity = Math.min(params.load / 200, 0.6); 
  const offsetX = eccentricity * 20; // Max offset pixels
  const rotationAngle = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const statorRadius = 160;
      const rotorRadius = 140;

      // 1. Draw Stator (The Bushing)
      ctx.beginPath();
      ctx.arc(centerX, centerY, statorRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 20;
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // 2. Draw Air Supply Channels (Orifices)
      const orificeCount = 8;
      for (let i = 0; i < orificeCount; i++) {
        const angle = (i / orificeCount) * Math.PI * 2;
        const xStart = centerX + Math.cos(angle) * (statorRadius + 10);
        const yStart = centerY + Math.sin(angle) * (statorRadius + 10);
        const xEnd = centerX + Math.cos(angle) * statorRadius;
        const yEnd = centerY + Math.sin(angle) * statorRadius;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.strokeStyle = SPINDLE_COLORS.airFilmHigh;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Particle effect from supply
        if (showAirParticles) {
            const time = Date.now() / 500;
            const pX = centerX + Math.cos(angle) * (statorRadius - (time % 1) * 20);
            const pY = centerY + Math.sin(angle) * (statorRadius - (time % 1) * 20);
            ctx.beginPath();
            ctx.arc(pX, pY, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#7dd3fc';
            ctx.fill();
        }
      }

      // 3. Draw Pressure Map (If enabled)
      if (showPressureMap) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 360; i += 2) {
            const rad = (i * Math.PI) / 180;
            // Gap is smaller where rotor is shifted (offsetX is positive X)
            // Offset affects gap: d = d0 - e*cos(theta)
            const gapFactor = 1 - Math.cos(rad) * eccentricity;
            const pressure = params.pressure * (1 + (1/gapFactor - 1) * 2);
            const pRadius = rotorRadius + (pressure * 10);
            
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(rad) * rotorRadius, centerY + Math.sin(rad) * rotorRadius);
            ctx.lineTo(centerX + Math.cos(rad) * pRadius, centerY + Math.sin(rad) * pRadius);
            ctx.strokeStyle = pressure > params.pressure ? SPINDLE_COLORS.pressureHot : SPINDLE_COLORS.pressureCold;
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Draw Rotor (The Spindle Shaft)
      rotationAngle.current += (params.speed / 1000);
      const rotorX = centerX + offsetX;
      const rotorY = centerY;

      ctx.save();
      ctx.translate(rotorX, rotorY);
      ctx.rotate(rotationAngle.current);
      
      // Main shaft body
      ctx.beginPath();
      ctx.arc(0, 0, rotorRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Visualization details on rotor to show rotation
      for(let i=0; i<4; i++) {
        const a = (i/4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * rotorRadius, Math.sin(a) * rotorRadius);
        ctx.strokeStyle = '#64748b';
        ctx.stroke();
      }
      
      // Center cap
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();

      ctx.restore();

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [params, showPressureMap, showAirParticles, offsetX, eccentricity]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={600} 
        className="max-w-full max-h-full drop-shadow-[0_0_30px_rgba(56,189,248,0.2)]"
      />
      
      {/* UI Overlays */}
      <div className="absolute top-4 left-4 pointer-events-none space-y-2">
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            <div className="w-3 h-3 rounded-full bg-sky-400 animate-pulse"></div>
            <span className="text-xs font-mono uppercase">Air Supply: {params.pressure.toFixed(2)} MPa</span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse"></div>
            <span className="text-xs font-mono uppercase">Load: {params.load} N</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col items-end text-right">
        <h3 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Current Speed</h3>
        <p className="text-3xl font-mono text-sky-400 leading-none">{params.speed.toLocaleString()}</p>
        <p className="text-xs text-slate-500 font-mono">RPM</p>
      </div>

      {/* Cross section label */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 rotate-180 [writing-mode:vertical-lr] text-slate-600 text-[10px] tracking-widest font-bold border-r border-slate-700 pr-2">
         CROSS-SECTION VIEW / A-A
      </div>
    </div>
  );
};

export default SpindleVisualizer;
