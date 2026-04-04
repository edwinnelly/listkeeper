"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Users, Zap, ArrowRight, Play } from "lucide-react";
import NextImage from "next/image"; // Renamed to avoid conflict
import { slides } from "../data";

export const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(
    new Array(slides.length).fill(false)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Preload all images
  useEffect(() => {
    slides.forEach((slide, index) => {
      // Use the global window.Image constructor explicitly
      const img = typeof window !== 'undefined' ? new window.Image() : null;
      if (img) {
        img.src = slide.image;
        img.onload = () => {
          setImagesLoaded((prev) => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        };
      }
    });
  }, []); // Empty dependency array - only runs once on mount

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsTransitioning(false), 800);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [isTransitioning]); // Removed slides.length dependency

  const nextSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  const prevSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/40 z-[1]" />
            <div className="relative w-full h-full">
              <NextImage
                src={slides[currentSlide].image}
                alt="Slide"
                fill
                className={`object-cover transition-opacity duration-500 ${
                  imagesLoaded[currentSlide] ? "opacity-100" : "opacity-0"
                }`}
                priority={currentSlide === 0}
                quality={90}
                sizes="100vw"
                onLoadingComplete={() => {
                  setImagesLoaded((prev) => {
                    const newState = [...prev];
                    newState[currentSlide] = true;
                    return newState;
                  });
                }}
              />
            </div>
            <div
              className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].gradient} z-[2]`}
            />
            <div className="absolute inset-0 bg-black/30 z-[3]" />
          </div>

          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h1
                  key={`title-${currentSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
                >
                  {slides[currentSlide].title}
                </motion.h1>

                <motion.p
                  key={`subtitle-${currentSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-base md:text-lg lg:text-xl text-white/95 mb-8 leading-relaxed max-w-2xl mx-auto"
                  style={{ textShadow: "0 1px 5px rgba(0,0,0,0.2)" }}
                >
                  {slides[currentSlide].subtitle}
                </motion.p>

                <motion.div
                  key={`buttons-${currentSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <button className="group inline-flex items-center justify-center rounded-xl bg-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-gray-900 transition-all hover:shadow-2xl hover:scale-105 transform duration-200 gap-2">
                    Start Free Trial
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-transparent px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-white transition-all hover:bg-white/10 hover:scale-105 transform duration-200 gap-2">
                    <Play size={20} /> Watch Demo
                  </button>
                </motion.div>

                <motion.div
                  key={`stats-${currentSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-wrap gap-6 justify-center mt-12 pt-6 border-t border-white/30"
                >
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-gray-400 fill-gray-400" />
                    <span className="text-white text-sm">4.9/5 Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-white" />
                    <span className="text-white text-sm">10,000+ Businesses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-white" />
                    <span className="text-white text-sm">99.9% Uptime</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-transparent rounded-full shadow-none transition-all duration-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:scale-110 group"
      >
        <ChevronLeft size={28} className="text-white/70 group-hover:text-white transition-colors" />
      </button>
      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-transparent rounded-full shadow-none transition-all duration-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:scale-110 group"
      >
        <ChevronRight size={28} className="text-white/70 group-hover:text-white transition-colors" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!isTransitioning && idx !== currentSlide) {
                setIsTransitioning(true);
                setCurrentSlide(idx);
                setTimeout(() => setIsTransitioning(false), 800);
              }
            }}
            className="group relative"
            disabled={isTransitioning}
          >
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
            {currentSlide === idx && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute top-0 left-0 h-full bg-white/70 rounded-full origin-left"
                style={{ width: "100%" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block"
        style={{ bottom: "20px" }}
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white/70 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
};