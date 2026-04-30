'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { assets } from '@/assets/assets'

const slides = [
    { src: assets.hero_sofa_blue,    alt: 'Blue velvet sofa' },
    { src: assets.hero_mattress,     alt: 'Mattress' },
    { src: assets.hero_sedan,        alt: 'Mercedes sedan' },
    { src: assets.hero_tv_unit,      alt: 'TV unit' },
    { src: assets.hero_mini_fridge,  alt: 'Mini fridge' },
    { src: assets.hero_cookware,     alt: 'Cookware set' },
    { src: assets.hero_gas_cooker,   alt: 'Gas cooker' },
    { src: assets.hero_sofa_club,    alt: 'Club sofa' },
    { src: assets.hero_dog,          alt: 'Pets' },
]

const SLIDE_INTERVAL_MS = 4500

const PlatformIntro = () => {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % slides.length)
        }, SLIDE_INTERVAL_MS)
        return () => clearInterval(id)
    }, [])

    return (
        <section className='px-6 mt-10 mb-30 max-w-6xl mx-auto'>
            <div className='relative bg-white/50 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[260px] sm:min-h-[400px] lg:min-h-[460px] shadow-md'>

                {/* Left — write-up panel */}
                <div className='lg:col-span-3 relative z-10 px-6 sm:px-8 py-10 lg:py-14 flex flex-col justify-center gap-5'>
                    <div className='flex flex-col gap-2'>
                        <h2 className='text-lg sm:text-xl font-bold text-slate-800 whitespace-nowrap'>
                            Home for all your ads.
                        </h2>
                        <p className='text-sm text-slate-600'>
                            Sell what you no longer need. Find what you do.
                        </p>
                    </div>

                    <ul className='flex flex-col gap-2.5'>
                        {[
                            'Free to list — no commissions',
                            'Chat directly with sellers',
                            'Verified profiles',
                            'Trusted by 30k daily users · 50k+ live ads',
                        ].map((line) => (
                            <li key={line} className='flex items-start gap-2.5 text-sm text-slate-700'>
                                <Check size={16} className='text-slate-900 shrink-0 mt-0.5' strokeWidth={2.5} />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href='/store/add-product'
                        className='inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm py-3 px-6 rounded-full font-medium active:scale-95 transition shadow-md w-fit'
                    >
                        Create a listing <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Right — slider with slanted left edge (lg+) */}
                <div className='lg:col-span-9 relative min-h-[260px] sm:min-h-[400px] lg:min-h-full lg:[clip-path:polygon(18%_0%,_100%_0%,_100%_100%,_0%_100%)]'>
                    {slides.map((s, i) => (
                        <div
                            key={i}
                            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <Image
                                src={s.src}
                                alt={s.alt}
                                fill
                                sizes='(min-width: 1024px) 70vw, 100vw'
                                className='object-cover'
                                priority={i === 0}
                            />
                        </div>
                    ))}
                    {/* Dots */}
                    <div className='absolute bottom-4 right-6 z-10 flex gap-1.5'>
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                aria-label={`Go to slide ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'}`}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </section>
    )
}

export default PlatformIntro
