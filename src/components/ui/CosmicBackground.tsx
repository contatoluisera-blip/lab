'use client';

import React, { useEffect, useRef } from 'react';

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Very lightweight configuration
    const PARTICLE_COUNT = 70;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', setSize);

    class Particle {
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
      opacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.dx = (Math.random() - 0.5) * 0.3; // Very slow drift
        this.dy = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1; 
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(167, 243, 208, ${this.opacity})`; // Mint color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;

        this.draw();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particles.push(new Particle(x, y));
      }
    };

    setSize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-3] bg-[#020202] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_100%)] opacity-90 mix-blend-multiply" />
      
      {/* Lightweight Canvas Particles (Hidden on mobile for performance) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-80 hidden md:block"
      />
      
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-jade/10 blur-[60px] md:blur-[150px] rounded-full mix-blend-screen animate-pulse-slow will-change-transform" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-emerald-500/5 blur-[80px] md:blur-[200px] rounded-full mix-blend-screen animate-pulse-slow delay-1000 will-change-transform" />
    </div>
  );
}
