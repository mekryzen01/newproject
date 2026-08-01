'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
  alt?: string;
}

export function ImageLightbox({ src, onClose, alt = 'Enlarged preview' }: ImageLightboxProps) {
  if (!src) return null;

  return (
    <div 
      className="fixed inset-0 z-55 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in no-print"
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-[#15110a] p-2 rounded-2xl border border-amber-200/25 shadow-2xl overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white cursor-pointer z-10 border-none"
        >
          <X className="size-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-[80vh] object-contain rounded-xl"
        />
      </div>
    </div>
  );
}
