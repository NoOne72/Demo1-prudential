// src/components/BannerCarousel.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBanners } from '../utils/auth';

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setBanners(getBanners());
  }, []);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  if (banners.length === 0) {
    return (
      <div className="w-full h-64 bg-slate-200 rounded-2xl flex items-center justify-center mb-8 border border-gray-300 border-dashed">
        <p className="text-gray-500 font-medium">Belum ada banner event yang aktif.</p>
      </div>
    );
  }

  const activeBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-64 bg-gray-900 rounded-2xl overflow-hidden mb-8 shadow-sm group">
      
      {/* Background Image - Menghapus mix-blend overlay & menambahkan imagePosition */}
      <div 
        className={`absolute inset-0 opacity-60 bg-cover transition-all duration-500 ${activeBanner.imagePosition || 'bg-center'}`}
        style={{ backgroundImage: `url(${activeBanner.imageUrl})` }}
      ></div>
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-16 z-10">
        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full w-max mb-3 uppercase tracking-wide">
          {activeBanner.badge}
        </span>
        <h2 className="text-3xl font-bold text-white mb-2 max-w-xl drop-shadow-lg">
          {activeBanner.title}
        </h2>
        <p className="text-gray-100 max-w-lg text-sm drop-shadow-md">
          {activeBanner.description}
        </p>
      </div>

      {/* Navigation Arrows */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-20">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-20">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, index) => (
          <div key={index} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-red-500 w-4' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;