import React from 'react';
import { interpolate, Easing } from 'remotion';
import { BookOpen, Trophy, Clock, Search } from 'lucide-react';

export const EstudoScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  const scrollY = interpolate(
    frame,
    [fps * 4, fps * 7.5],
    [0, -420], // Scrolldown amount to show modules
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  const capaPreta = "https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/capa%20preta.png?alt=media&token=7e334f88-5595-4c1b-9898-6ce4553869bb";
  const capaVerde = "https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/capa%20verde.png?alt=media&token=a95bf929-8766-4153-a16e-f96b4acc015f";

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', WebkitFontSmoothing: 'antialiased', transform: 'translateZ(0)', backfaceVisibility: 'hidden', textRendering: 'geometricPrecision' }}>
      
      {/* Scrollable Container */}
      <div style={{ transform: `translateY(${scrollY}px)`, display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', willChange: 'transform' }}>
        
        {/* Hub Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '4px 10px', alignSelf: 'flex-start', color: '#d1d5db', fontSize: '10px', fontFamily: 'sans-serif' }}>
           <BookOpen size={12} color="#10b981" /> Hub Acadêmico de Vídeo
        </div>

        {/* Header Mobile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0, fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
            Estudo & Capacitação
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
            Aprenda a criar, filmar e editar conteúdos cinematográficos com qualidade profissional utilizando apenas o seu celular.
          </p>
        </div>

        {/* Progresso de Estudos */}
        <div style={{ backgroundColor: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'sans-serif' }}>Seu Progresso de Estudos</span>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>0%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '0%', height: '100%', backgroundColor: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '11px', fontFamily: 'sans-serif' }}>
            <Trophy size={12} color="#10b981" /> 0 de 62 aulas finalizadas
          </div>
        </div>

        {/* Course Cards (Smaller) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>Mobile Lab</span>
                <span style={{ backgroundColor: '#10b981', color: 'black', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: '800' }}>CURSO COMPLETO</span>
             </div>
             <span style={{ color: '#9ca3af', fontSize: '11px', fontFamily: 'sans-serif' }}>3 Módulos + Bônus</span>
          </div>

          <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>3D pelo Celular</span>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#d1d5db', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: '800' }}>MASTERCLASS</span>
             </div>
             <span style={{ color: '#9ca3af', fontSize: '11px', fontFamily: 'sans-serif' }}>4 Módulos · 31 Aulas</span>
          </div>
        </div>

        {/* Description Text */}
        <p style={{ color: '#6b7280', fontSize: '11px', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
           Do enquadramento à edição avançada: domine a criação profissional de vídeo usando apenas o celular.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '4px', paddingTop: '10px' }}>
           <div style={{ backgroundColor: '#10b981', color: 'black', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Todos os Vídeos</div>
           <div style={{ color: '#9ca3af', padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}>Módulos do Curso</div>
           <div style={{ color: '#9ca3af', padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}>Gravações & Lives</div>
        </div>

        {/* Module 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>Módulo 1</span>
               <span style={{ color: '#10b981', fontSize: '10px' }}>•</span>
               <span style={{ color: '#10b981', fontSize: '11px', fontFamily: 'sans-serif' }}>A Teoria Importa</span>
             </div>
             <span style={{ color: '#6b7280', fontSize: '10px' }}>12 aulas</span>
           </div>

           <div style={{ display: 'flex', gap: '12px', paddingBottom: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ minWidth: '130px', height: '180px', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                     <img src={capaPreta} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <Clock size={8} /> {`0${i * 4}:12`}
                  </div>
                  <div style={{ padding: '10px' }}>
                     <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>Aula 0{i} - {i===1?'Introdução':i===2?'Mercado':'Luz'}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Module 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>Módulo 2</span>
               <span style={{ color: '#6b7280', fontSize: '10px' }}>•</span>
               <span style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'sans-serif' }}>Captação na Prática</span>
             </div>
             <span style={{ color: '#6b7280', fontSize: '10px' }}>5 aulas</span>
           </div>

           <div style={{ display: 'flex', gap: '12px', paddingBottom: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ minWidth: '130px', height: '180px', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                     <img src={capaVerde} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <Clock size={8} /> {`1${i}:40`}
                  </div>
                  <div style={{ padding: '10px' }}>
                     <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>Aula 0{i} - {i===1?'Configurando Câmera':i===2?'Estudo Ambiente':'Captação (Parte 1)'}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};
