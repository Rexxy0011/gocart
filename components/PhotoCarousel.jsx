'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Reusable image carousel. Designed for hero / gallery surfaces - not
// the listing image gallery (that one already lives in ProductDetails).
//
// Behaviour:
//   - Auto-advance every `autoRotateMs` (default 5s)
//   - Pause on hover (desktop)
//   - Swipe left/right (mobile)
//   - Manual prev/next chevrons (only visible on hover)
//   - Dot indicators at the bottom - click to jump
//
// `images` is an array of { src, alt?, caption? }. `src` can be a static
// import (for /assets) or a remote URL (Unsplash / Supabase / etc).
const PhotoCarousel = ({
    images = [],
    aspectRatio = 'aspect-[16/9]',
    autoRotateMs = 5000,
    showCaptions = false,
    rounded = 'rounded-2xl',
}) => {

    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const touchStartX = useRef(null)
    const total = images.length

    useEffect(() => {
        if (paused || total <= 1) return
        const id = setInterval(() => setIndex(i => (i + 1) % total), autoRotateMs)
        return () => clearInterval(id)
    }, [paused, total, autoRotateMs])

    if (!total) return null

    const go = (delta) => setIndex(i => (i + delta + total) % total)

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
    const onTouchEnd = (e) => {
        if (touchStartX.current == null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchStartX.current = null
    }

    return (
        <div
            className={`relative w-full ${aspectRatio} ${rounded} overflow-hidden bg-slate-100 ring-1 ring-slate-200 group`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {images.map((img, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                        i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                >
                    <Image
                        src={img.src}
                        alt={img.alt || ''}
                        fill
                        sizes="(min-width: 1024px) 900px, 100vw"
                        priority={i === 0}
                        className="object-cover"
                    />
                    {showCaptions && img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent p-5 sm:p-6">
                            <p className="text-white text-sm sm:text-base font-medium leading-snug">
                                {img.caption}
                            </p>
                        </div>
                    )}
                </div>
            ))}

            {total > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => go(-1)}
                        aria-label="Previous"
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/85 hover:bg-white text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => go(1)}
                        aria-label="Next"
                        className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/85 hover:bg-white text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Go to slide ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all ${
                                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default PhotoCarousel
