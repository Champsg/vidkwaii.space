import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface ProductVisualizerProps {
  onQuickBuy?: () => void;
}

const VIDEO_SRC = '/media/demo-video-optimized.mp4';
const VIDEO_POSTER = '/media/demo-video-poster.webp';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const slides = [
  {
    id: 'video',
    badge: 'See It In Action',
    title: 'Flawless Peach Fuzz Removal',
    subtitle: 'Watch how easy and painless it is',
    type: 'video' as const,
    src: VIDEO_SRC,
    poster: VIDEO_POSTER,
    thumb: '/media/thumbs/video.webp',
  },
  {
    id: 'trio',
    badge: 'Pack of 3 Pastel Tones',
    title: 'Trio Precision Dermaplaning Razors',
    subtitle: 'Sakura Blush · Glacier Mint · Butter Yellow',
    type: 'image' as const,
    src: '/media/slide1.webp',
    thumb: '/media/thumbs/slide1.webp',
  },
  {
    id: 'slide2',
    badge: 'Ergonomic Grip',
    title: 'Perfect Control & Precision',
    subtitle: 'Non-slip grip for safe dermaplaning',
    type: 'image' as const,
    src: '/media/slide2.webp',
    thumb: '/media/thumbs/slide2.webp',
  },
  {
    id: 'slide3',
    badge: 'Premium Materials',
    title: 'Surgical Stainless Steel',
    subtitle: 'Micro-guard tech to prevent nicks',
    type: 'image' as const,
    src: '/media/slide3.webp',
    thumb: '/media/thumbs/slide3.webp',
  },
  {
    id: 'slide4',
    badge: 'Flawless Results',
    title: 'Instant Glass Skin',
    subtitle: 'Removes dead skin & peach fuzz instantly',
    type: 'image' as const,
    src: '/media/slide4.webp',
    thumb: '/media/thumbs/slide4.webp',
  },
  {
    id: 'slide5',
    badge: 'Complete Kit',
    title: 'Everything You Need',
    subtitle: 'Safety caps, precision blades & pastel tones',
    type: 'image' as const,
    src: '/media/slide5.webp',
    thumb: '/media/thumbs/slide5.webp',
  },
  {
    id: 'slide6',
    badge: 'Beautiful Design',
    title: 'Aesthetic Pastel Packaging',
    subtitle: 'Designed to look beautiful on your vanity',
    type: 'image' as const,
    src: '/media/slide6.webp',
    thumb: null,
  },
  {
    id: 'real-1',
    badge: 'Real Product Photo',
    title: 'What You Actually Receive',
    subtitle: 'Real unboxed product — no filters',
    type: 'image' as const,
    src: '/media/product-pack-real-1.jpg',
    thumb: null,
  },
  {
    id: 'real-2',
    badge: 'Real Product Photo',
    title: 'Actual Pack Close-Up',
    subtitle: 'See the real quality up close',
    type: 'image' as const,
    src: '/media/product-pack-real-2.jpg',
    thumb: null,
  },
];

const SWIPE_THRESHOLD = 40;

export const ProductVisualizer: React.FC<ProductVisualizerProps> = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const goToSlide = useCallback(
    (idx: number, dir?: 'left' | 'right') => {
      if (idx === activeSlide) return;
      setSlideDirection(dir ?? (idx > activeSlide ? 'left' : 'right'));
      setActiveSlide(idx);
      // Clear direction after animation
      setTimeout(() => setSlideDirection(null), 300);
    },
    [activeSlide]
  );

  const handlePrev = useCallback(() => {
    goToSlide(activeSlide === 0 ? slides.length - 1 : activeSlide - 1, 'right');
  }, [activeSlide, goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide(activeSlide === slides.length - 1 ? 0 : activeSlide + 1, 'left');
  }, [activeSlide, goToSlide]);

  const isVideoSlide = slides[activeSlide].type === 'video';

  const [isVisible, setIsVisible] = useState(false);

  // Scroll active thumbnail into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const thumb = container.children[activeSlide] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSlide]);

  // IntersectionObserver for lazy video loading
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin: '50px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Defer video bytes until idle
  useEffect(() => {
    if (!isInView) return;
    let cancelled = false;
    let idleHandle: number | undefined;
    let timer: number | undefined;
    const idleWindow = window as IdleWindow;

    const startVideo = () => {
      if (cancelled) return;
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleHandle = idleWindow.requestIdleCallback(() => setVideoSrc(VIDEO_SRC), {
          timeout: 2000,
        });
      } else {
        timer = window.setTimeout(() => setVideoSrc(VIDEO_SRC), 300);
      }
    };

    if (document.readyState === 'complete') {
      startVideo();
    } else {
      window.addEventListener('load', startVideo, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', startVideo);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [isInView]);

  // Play only while visible and on video slide
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVideoSlide && videoSrc && isVisible) {
      const playback = video.play();
      if (playback && typeof playback.then === 'function') {
        playback.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(true);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVideoSlide, videoSrc, isVisible]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !videoFailed) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only count as swipe if horizontal movement > vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -SWIPE_THRESHOLD) {
      handleNext();
    } else if (dx > SWIPE_THRESHOLD) {
      handlePrev();
    }
    isSwiping.current = false;
  };

  // Determine slide animation class
  const getSlideClass = () => {
    if (!slideDirection) return 'animate-fade-in';
    return slideDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';
  };

  return (
    <div
      ref={rootRef}
      className="w-full bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Visual Canvas Display */}
      <div
        className="relative aspect-[4/3] w-full bg-gradient-to-b from-[#FAF7F2] to-[#F3EFE9] flex items-center justify-center overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/70 via-transparent to-transparent pointer-events-none" />

        {/* Dynamic Slide Rendering */}
        <div key={activeSlide} className={`w-full h-full ${getSlideClass()}`}>
          {slides[activeSlide].type === 'video' && (
            <div
              className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer"
              onClick={togglePlay}
            >
              {videoFailed ? (
                <img
                  src={VIDEO_POSTER}
                  alt={slides[activeSlide].title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={videoSrc ?? undefined}
                  poster={VIDEO_POSTER}
                  className="w-full h-full object-cover"
                  width={406}
                  height={720}
                  loop
                  playsInline
                  muted={isMuted}
                  preload="none"
                  autoPlay
                  disablePictureInPicture
                  onPlaying={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoFailed(true)}
                />
              )}
              {/* Video Controls overlay */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          {slides[activeSlide].type === 'image' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={slides[activeSlide].src}
                alt={slides[activeSlide].title}
                loading={activeSlide <= 1 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Carousel Prev/Next Touch Buttons (>= 44x44px hitbox) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-stone-200/80 shadow-sm text-stone-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-stone-200/80 shadow-sm text-stone-700 active:scale-95 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Counter Indicator */}
        <div className="absolute top-3 right-3 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
          {activeSlide + 1} / {slides.length}
        </div>

        {/* Slide Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-stone-800 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-stone-100">
          {slides[activeSlide].badge}
        </div>
      </div>

      {/* Slide Thumbnails & Captions Bar */}
      <div
        ref={thumbsRef}
        className="p-3 bg-stone-50/60 border-t border-stone-100 flex items-center justify-start gap-2 overflow-x-auto no-scrollbar snap-x"
      >
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goToSlide(idx)}
            className={`snap-start relative shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all flex flex-col items-center justify-center ${
              activeSlide === idx
                ? 'ring-2 ring-stone-900 ring-offset-1 shadow-md scale-105'
                : 'opacity-60 hover:opacity-100 border border-stone-200'
            }`}
          >
            {s.thumb ? (
              <img
                src={s.thumb}
                alt={s.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : s.type === 'image' ? (
              <img
                src={s.src}
                alt={s.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500">
                {idx + 1}
              </div>
            )}
            {s.type === 'video' && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Slide Context Label */}
      <div className="px-4 py-2.5 bg-white flex items-center justify-between">
        <div className="truncate pr-2">
          <p className="text-xs font-semibold text-stone-900 truncate">
            {slides[activeSlide].title}
          </p>
          <p className="text-[11px] text-stone-500 truncate">{slides[activeSlide].subtitle}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-emerald-700 text-[11px] font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
          <Check className="w-3 h-3" />
          <span>In Stock</span>
        </div>
      </div>
    </div>
  );
};
