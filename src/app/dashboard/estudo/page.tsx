'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { COURSES_DATA, ALL_COURSES, Course, Module, Video } from '@/lib/coursesData';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { 
  Play, 
  Search, 
  Sparkles, 
  BookOpen, 
  Download, 
  FileText, 
  X, 
  CheckCircle2, 
  Lock, 
  Clock, 
  StickyNote, 
  Trophy, 
  ArrowRight,
  BookmarkCheck,
  Zap
} from 'lucide-react';

export default function EstudoPage() {
  const { hasCourseAccess, userProfile } = useUserProfile();

  // State for active course
  const [activeCourseId, setActiveCourseId] = useState<string>('mobile-lab');

  // State for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'lessons' | 'lives'>('all');
  
  // State for video player modal
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideoModule, setSelectedVideoModule] = useState<string>('');
  const [modalTab, setModalTab] = useState<'about' | 'resources' | 'notes'>('about');
  
  // State for user progress & notes (persisted in localStorage)
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [videoNotes, setVideoNotes] = useState<{ [key: string]: string }>({});
  const [localNoteText, setLocalNoteText] = useState('');
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // Load localStorage data on mount
  useEffect(() => {
    const savedCompleted = localStorage.getItem('asa_completed_videos');
    if (savedCompleted) {
      try {
        setCompletedVideos(JSON.parse(savedCompleted));
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }

    const savedNotes = localStorage.getItem('asa_video_notes');
    if (savedNotes) {
      try {
        setVideoNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Error loading notes:', e);
      }
    }
  }, []);

  // Save progress changes to localStorage
  const toggleVideoCompleted = (videoId: string) => {
    let updated: string[];
    if (completedVideos.includes(videoId)) {
      updated = completedVideos.filter(id => id !== videoId);
    } else {
      updated = [...completedVideos, videoId];
    }
    setCompletedVideos(updated);
    localStorage.setItem('asa_completed_videos', JSON.stringify(updated));
  };

  // Handle note change and auto-save
  useEffect(() => {
    if (!selectedVideo) return;
    
    // Set notes text when selected video changes
    setLocalNoteText(videoNotes[selectedVideo.id] || '');
  }, [selectedVideo]);

  const handleNoteSave = (text: string) => {
    if (!selectedVideo) return;
    setLocalNoteText(text);
    
    const updatedNotes = {
      ...videoNotes,
      [selectedVideo.id]: text
    };
    setVideoNotes(updatedNotes);
    localStorage.setItem('asa_video_notes', JSON.stringify(updatedNotes));
    
    // Visual auto-save feedback
    setIsSavedIndicator(true);
    setTimeout(() => setIsSavedIndicator(false), 1000);
  };

  // Calculate stats
  const totalVideos = useMemo(() => {
    return COURSES_DATA.reduce((acc, module) => {
      // Don't count coming soon videos towards total progress unless they have a URL
      const validVideos = module.videos.filter(v => !v.comingSoon);
      return acc + validVideos.length;
    }, 0);
  }, []);

  const completedCount = useMemo(() => {
    return completedVideos.filter(id => {
      // Verify that this video actually exists and is not coming soon
      const exists = COURSES_DATA.some(m => m.videos.some(v => v.id === id && !v.comingSoon));
      return exists;
    }).length;
  }, [completedVideos]);

  const progressPercentage = useMemo(() => {
    if (totalVideos === 0) return 0;
    return Math.round((completedCount / totalVideos) * 100);
  }, [completedCount, totalVideos]);

  // Filter video list by active course + search + filter
  const filteredModules = useMemo(() => {
    const activeCourse = ALL_COURSES.find(c => c.id === activeCourseId);
    const sourceModules = activeCourse?.modules ?? [];

    return sourceModules.map(module => {
      const filtered = module.videos.filter(video => {
        const matchesSearch = !searchQuery ||
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase());
        const isLive = video.id.startsWith('mb-l');
        const matchesFilter =
          activeFilter === 'all' ? true :
          activeFilter === 'lives' ? isLive :
          !isLive;
        return matchesSearch && matchesFilter;
      });
      if (filtered.length === 0) return null;
      return { ...module, videos: filtered };
    }).filter((m): m is Module => m !== null);
  }, [activeCourseId, activeFilter, searchQuery]);

  // Get first video of module 1 to feature in Hero section
  const firstVideo = COURSES_DATA[0]?.videos[0];

  // Helper to get resources based on module
  const getResourcesForVideo = (video: Video) => {
    const videoId = video.id;
    if (videoId.startsWith('m1-')) {
      return [
        { name: "Checklist de Pré-Produção.pdf", size: "1.2 MB", type: "PDF" },
        { name: "Guia de Roteiro e Estrutura Magnética.pdf", size: "2.4 MB", type: "PDF" }
      ];
    } else if (videoId.startsWith('m2-')) {
      return [
        { name: "Guia Técnico: Configurando Câmera Manual no Celular.pdf", size: "3.1 MB", type: "PDF" }
      ];
    } else if (videoId.startsWith('m3-')) {
      return [
        { name: "Pacote de Assets de Edição (Overlays & Transições).zip", size: "45 MB", type: "ZIP" },
        { name: "Presilhas de Áudio e Efeitos Sonoros Recomendados.zip", size: "18 MB", type: "ZIP" },
        { name: "Preset de Cores e LUTs para Mobile (CapCut/NodeVideo).zip", size: "5.4 MB", type: "ZIP" }
      ];
    }
    return [
      { name: "Modelo de Contrato Comercial de Edição de Vídeos.docx", size: "480 KB", type: "Word" },
      { name: "Anotações Complementares da Mentoria.pdf", size: "1.5 MB", type: "PDF" }
    ];
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-24 px-4 md:px-0">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neo-glass text-brand-mint bg-brand-emerald/10 text-xs font-semibold w-fit mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-white/90">Hub Acadêmico de Vídeo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Estudo & Capacitação</h1>
          <p className="text-gray-400 mt-1 max-w-xl text-sm leading-relaxed">
            Aprenda a criar, filmar e editar conteúdos cinematográficos com qualidade profissional utilizando apenas o seu celular.
          </p>
        </div>

        {/* Global Progress Card */}
        <div className="w-full md:w-80 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Seu Progresso de Estudos</span>
            <span className="text-sm font-bold text-brand-mint">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden mb-2.5">
            <div 
              className="bg-brand-emerald h-full shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-brand-neon flex-shrink-0" />
            <span>{completedCount} de {totalVideos} aulas finalizadas</span>
          </div>
        </div>
      </div>

      {/* ── Course Selector Tabs ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {ALL_COURSES.map((course) => {
            const isActive = activeCourseId === course.id;
            return (
              <button
                key={course.id}
                onClick={() => {
                  setActiveCourseId(course.id);
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className={`group relative flex flex-col items-start gap-1 px-5 py-4 rounded-2xl border transition-all duration-300 text-left min-w-[200px] ${
                  isActive
                    ? 'bg-brand-emerald/10 border-brand-emerald/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className={`text-sm font-extrabold tracking-tight ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {course.title}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-brand-emerald text-black' : 'bg-white/10 text-gray-400'
                  }`}>
                    {course.subtitle}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">{course.badge}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-emerald rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active course description strip */}
        {(() => {
          const course = ALL_COURSES.find(c => c.id === activeCourseId);
          return course ? (
            <p className="text-xs text-gray-500 leading-relaxed pl-1">{course.description}</p>
          ) : null;
        })()}
      </div>

      {/* ── Course Access Upgrade Banner ── */}
      {!hasCourseAccess && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-[0_0_25px_rgba(245,158,11,0.08)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex-shrink-0 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">Acesso aos cursos bloqueado</p>
              <p className="text-xs text-amber-400/70 mt-0.5 hidden sm:block">
                O Plano Elite desbloqueia todos os cursos, lives e aulas bônus da Creator Lab.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/billing'}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.35)] whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            Fazer Upgrade
          </button>
        </div>
      )}

      {/* Hero Section / Featured Video */}
      {firstVideo && !searchQuery && activeFilter === 'all' && (
        <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-black via-[#0c0c0c] to-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 items-center min-h-[340px]">
          
          {/* Text Content */}
          <div className="relative z-20 p-8 md:p-12 md:col-span-7 space-y-4">
            <span className="text-xs font-bold tracking-widest text-brand-emerald uppercase bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-1 rounded">
              Destaque do Curso
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              Aprenda a Editar como um Profissional pelo Celular
            </h2>
            <p className="text-sm text-gray-300 font-light leading-relaxed max-w-lg">
              O ecossistema completo para você dominar técnicas de enquadramento, iluminação, pré-produção e efeitos avançados com o Node Video e CapCut.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={() => {
                  setSelectedVideo(firstVideo);
                  setSelectedVideoModule(COURSES_DATA[0].title + " - " + COURSES_DATA[0].subtitle);
                }}
                className="shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <Play className="w-4 h-4 fill-current mr-2" />
                Assistir Introdução
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const element = document.getElementById('modulo-1');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explorar Módulos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right Side Graphics / Cover Image */}
          <div className="relative md:col-span-5 w-full h-full flex items-center justify-center p-6 md:p-8 bg-gradient-to-l from-brand-emerald/5 to-transparent overflow-hidden">
            {/* Glow Aura */}
            <div className="absolute w-44 h-44 rounded-full bg-brand-emerald/10 blur-[80px] pointer-events-none" />
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/imagem%20siteapp.png?alt=media&token=4465413b-007c-491a-a60e-398ce647e398" 
              alt="Creator Lab Capa"
              className="object-contain w-auto h-auto max-h-[220px] md:max-h-[280px] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transform hover:scale-[1.03] transition-all duration-700 ease-out"
            />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
        {/* Navigation Categories */}
        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl w-full md:w-auto">
          {[
            { id: 'all', label: 'Todos os Vídeos' },
            { id: 'lessons', label: 'Módulos do Curso' },
            { id: 'lives', label: 'Gravações & Lives' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex-1 md:flex-initial text-xs md:text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                activeFilter === tab.id 
                  ? 'bg-brand-emerald text-black font-bold shadow-[0_2px_10px_rgba(16,185,129,0.3)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar aula ou tema..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald/50 text-sm transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modules & Video Cards */}
      <div className="space-y-12">
        {filteredModules.length > 0 ? (
          filteredModules.map((module) => (
            <div key={module.id} id={module.id} className="space-y-4">
              {/* Module Header */}
              <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">{module.title}</h3>
                  <span className="text-brand-mint/90 font-medium text-sm">• {module.subtitle}</span>
                </div>
                <span className="text-xs text-gray-400">{module.videos.length} aulas</span>
              </div>

              {/* Horizontal Scroll Layout for Netflix Style */}
              <div className="relative group/scroll">
                <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-brand-jade scrollbar-track-transparent scroll-smooth pt-1 px-1">
                  {module.videos.map((video) => {
                    const isCompleted = completedVideos.includes(video.id);
                    const isLocked = !hasCourseAccess && !video.comingSoon;
                    return (
                      <div 
                        key={video.id}
                        onClick={() => {
                          if (video.comingSoon || isLocked) return;
                          setSelectedVideo(video);
                          setSelectedVideoModule(module.title + " - " + module.subtitle);
                        }}
                        className={`w-40 md:w-48 flex-shrink-0 group rounded-xl border transition-all duration-300 overflow-hidden bg-[#0f0f0f]/60 relative aspect-[2/3] select-none ${
                          video.comingSoon
                            ? 'border-white/5 opacity-60 cursor-default'
                            : isLocked
                            ? 'border-amber-500/15 cursor-default'
                            : 'cursor-pointer border-brand-emerald/10 hover:border-brand-emerald/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1'
                        }`}
                      >
                        {/* Video Thumbnail Image */}
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" 
                        />
                        
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent z-10" />

                        {/* Lock Overlay for non-Elite users */}
                        {isLocked && (
                          <div
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/65 backdrop-blur-[2px]"
                            onClick={(e) => { e.stopPropagation(); window.location.href = '/dashboard/billing'; }}
                          >
                            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-amber-400" />
                            </div>
                            <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider text-center px-2">Plano Elite</span>
                          </div>
                        )}

                        {/* Top Badges (z-20) */}
                        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-20">
                          {isCompleted && (
                            <span className="p-1.5 rounded-full bg-brand-emerald text-black shadow-lg" title="Concluído">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          )}
                          {video.comingSoon && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-md text-[8px] text-gray-300 font-semibold border border-white/10 uppercase">
                              <Lock className="w-2 h-2 text-gray-400" /> Em breve
                            </span>
                          )}
                        </div>

                        {/* Duration Badge (z-20) */}
                        {!video.comingSoon && (
                          <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-gray-300 font-mono tracking-wider z-20">
                            <Clock className="w-2.5 h-2.5 inline mr-1" />
                            {video.duration}
                          </span>
                        )}

                        {/* Play Hover Overlay (z-20) */}
                        {!video.comingSoon && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                            <div className="w-10 h-10 rounded-full bg-brand-emerald text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}

                        {/* Overlaid details at the bottom of the card (z-20) */}
                        <div className="absolute bottom-0 inset-x-0 p-3.5 z-20 flex flex-col justify-end">
                          <h4 className="text-xs md:text-sm font-bold text-white leading-snug group-hover:text-brand-neon transition-colors line-clamp-2">
                            {video.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-light leading-relaxed mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-300 max-h-0 group-hover:max-h-12 overflow-hidden">
                            {video.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl">
            <Sparkles className="w-12 h-12 text-brand-mint/60 mx-auto mb-4 animate-pulse" />
            <h4 className="text-lg font-bold text-white">Nenhum vídeo encontrado</h4>
            <p className="text-gray-400 text-sm mt-1">Experimente buscar por outros termos de edição.</p>
          </div>
        )}
      </div>

      {/* Immersive Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 transition-all duration-300">
          <div 
            className="w-full max-w-5xl bg-[#0b0b0c] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 md:px-6 bg-[#0f0f10] border-b border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-brand-mint font-bold block">
                  {selectedVideoModule}
                </span>
                <h3 className="text-base md:text-lg font-bold text-white">{selectedVideo.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Screen Area */}
            <div className="relative w-full aspect-video bg-black flex-shrink-0 group/player">
              {selectedVideo.url ? (
                <iframe
                  src={selectedVideo.url}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 space-y-4 px-4 text-center">
                  <Lock className="w-12 h-12 text-gray-500 animate-bounce" />
                  <h4 className="text-lg font-bold text-white">Vídeo Indisponível no Momento</h4>
                  <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                    Esta aula está sendo atualizada no Panda Video e estará disponível em breve.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Lower Panel */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row border-t border-white/5 min-h-[220px]">
              
              {/* Tabbed Navigation Side (or Left block) */}
              <div className="flex-1 p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/5 space-y-4">
                
                {/* Modal Tab Triggers */}
                <div className="flex gap-2 border-b border-white/5 pb-2.5">
                  {[
                    { id: 'about', label: 'Sobre a Aula', icon: BookOpen },
                    { id: 'resources', label: 'Recursos de Apoio', icon: Download },
                    { id: 'notes', label: 'Minhas Anotações', icon: StickyNote }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setModalTab(tab.id as any)}
                        className={`flex items-center gap-1.5 text-xs font-semibold pb-2 border-b-2 px-1 transition-all ${
                          modalTab === tab.id 
                            ? 'border-brand-emerald text-brand-emerald' 
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                <div className="min-h-[140px] pt-1">
                  
                  {/* ABOUT TAB */}
                  {modalTab === 'about' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-300 leading-relaxed font-light">
                        {selectedVideo.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded text-xs text-gray-400 font-mono border border-white/5">
                          <Clock className="w-3.5 h-3.5 text-brand-mint" />
                          <span>Duração: {selectedVideo.duration}</span>
                        </div>

                        {/* Completed Checkbox */}
                        <button
                          onClick={() => toggleVideoCompleted(selectedVideo.id)}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            completedVideos.includes(selectedVideo.id)
                              ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedVideos.includes(selectedVideo.id) ? 'Aula Concluída' : 'Marcar como Concluída'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RESOURCES TAB */}
                  {modalTab === 'resources' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 mb-1">Baixe arquivos extras e assets para acompanhar a aula na prática:</p>
                      {getResourcesForVideo(selectedVideo).map((resource, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-mint">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white line-clamp-1">{resource.name}</p>
                              <span className="text-[10px] text-gray-400 uppercase font-mono">{resource.type} • {resource.size}</span>
                            </div>
                          </div>
                          <button className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:border-brand-emerald/40 text-brand-mint hover:text-white transition-all text-xs flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" /> Baixar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NOTES TAB (Autosave text-area) */}
                  {modalTab === 'notes' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>Suas notas sobre esta aula</span>
                        {isSavedIndicator && (
                          <span className="text-brand-emerald font-bold animate-pulse flex items-center gap-0.5">
                            <BookmarkCheck className="w-3 h-3" /> Salvo!
                          </span>
                        )}
                      </div>
                      <textarea
                        value={localNoteText}
                        onChange={(e) => handleNoteSave(e.target.value)}
                        placeholder="Escreva anotações importantes para revisar depois... (salva automaticamente)"
                        className="w-full h-32 bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-emerald/30 resize-none font-light leading-relaxed"
                      />
                    </div>
                  )}

                </div>
              </div>

              {/* Next Video Recommendation Playlist Sidebar (Right block) */}
              <div className="w-full md:w-80 p-5 md:p-6 bg-[#0c0c0d] flex flex-col justify-between border-t md:border-t-0 border-white/5">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aulas no Módulo</h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {COURSES_DATA.find(module => 
                      module.videos.some(v => v.id === selectedVideo.id)
                    )?.videos.map((vid) => {
                      const isActive = vid.id === selectedVideo.id;
                      const isCompleted = completedVideos.includes(vid.id);
                      return (
                        <div 
                          key={vid.id}
                          onClick={() => {
                            if (vid.comingSoon) return;
                            setSelectedVideo(vid);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-brand-emerald/10 border border-brand-emerald/20 text-brand-mint' 
                              : vid.comingSoon 
                                ? 'opacity-40 cursor-default' 
                                : 'hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <div className="w-9 h-12 rounded overflow-hidden flex-shrink-0 bg-black relative">
                            <img src={vid.thumbnail} className="w-full h-full object-cover" />
                            {isCompleted && (
                              <div className="absolute inset-0 bg-brand-emerald/25 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-brand-neon fill-black" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate leading-none">{vid.title}</p>
                            <span className="text-[9px] text-gray-500 font-mono leading-none mt-1 block">{vid.duration}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
                  <Button 
                    onClick={() => setSelectedVideo(null)} 
                    variant="outline" 
                    className="w-full text-xs py-2 h-9"
                  >
                    Voltar ao Hub
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
