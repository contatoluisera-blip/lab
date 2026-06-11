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
    
    const colors = [
      { fill: 'rgba(16, 185, 129, 0.8)', glow: 'rgba(16, 185, 129, 0.6)' },  // Emerald
      { fill: 'rgba(52, 211, 153, 0.9)', glow: 'rgba(52, 211, 153, 0.7)' },  // Neon
      { fill: 'rgba(167, 243, 208, 0.6)', glow: 'rgba(167, 243, 208, 0.4)' }, // Mint
      { fill: 'rgba(6, 95, 70, 0.8)', glow: 'rgba(6, 95, 70, 0.4)' }         // Jade
    ];

    // Resize handler
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Mouse coordinates
    let mouse = {
      x: -1000,
      y: -1000,
      radius: 150 // increased interaction radius
    };

    window.addEventListener('resize', setSize);
    
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      colorSet: { fill: string; glow: string };

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 2.5 + 0.8; // slightly larger particles
        this.dx = (Math.random() - 0.5) * 0.8; // slightly faster
        this.dy = (Math.random() - 0.5) * 0.8;
        this.density = (Math.random() * 30) + 1;
        this.colorSet = colors[Math.floor(Math.random() * colors.length)];
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.colorSet.fill;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        // Natural drift
        this.x += this.dx;
        this.y += this.dy;

        // Wrap around bounds
        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;

        // Interaction logic
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        // Force applied if mouse is close
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
          // Repel away from mouse
          this.x -= directionX;
          this.y -= directionY;
        }

        this.draw();
      }
    }

    const initParticles = () => {
      particles = [];
      // Optimize particle count to prevent main thread starvation
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < numberOfParticles; i++) {
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
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[-2] opacity-100"
      />
      {/* Dynamic spatial lighting layer behind everything */}
      <div className="fixed inset-0 pointer-events-none z-[-3]">
         {/* Deep shadow vignette around the corners */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_100%)] opacity-90 mix-blend-multiply" />
         
         {/* Subtle ambient volumetric lights in background */}
         <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-jade/10 blur-[200px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-brand-emerald/5 blur-[250px] rounded-full mix-blend-screen" />
      </div>
    </>
  );
}
