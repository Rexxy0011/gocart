'use client'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import CategoriesMarquee from './CategoriesMarquee'

const topCategories = [
    {
        name: 'Hot 🔥',
        href: '/hot',
        icon: 'fluent-emoji-flat:fire',
        gradient: 'from-orange-100 to-rose-200',
    },
    {
        name: 'Home & Appliances',
        href: '/shop?category=Home+%26+Appliances',
        icon: 'fluent-emoji-flat:couch-and-lamp',
        gradient: 'from-amber-50 to-orange-100',
    },
    {
        name: 'Electronics',
        href: '/shop?category=Electronics',
        icon: 'fluent-emoji-flat:mobile-phone',
        gradient: 'from-violet-50 to-fuchsia-100',
    },
    {
        name: 'Vehicles',
        href: '/shop?category=Vehicles',
        icon: 'fluent-emoji-flat:automobile',
        gradient: 'from-rose-50 to-red-100',
    },
    {
        name: 'Pets & Lifestyle',
        href: '/shop?category=Pets+%26+Lifestyle',
        icon: 'fluent-emoji-flat:dog-face',
        gradient: 'from-emerald-50 to-green-100',
    },
    {
        name: 'Repairs & Services',
        href: '/services',
        icon: 'fluent-emoji-flat:wrench',
        gradient: 'from-sky-50 to-cyan-100',
    },
]

const TopCategories = () => {
    return (
        <section className='my-30'>
            <div className='px-6 max-w-6xl mx-auto'>
                <div className='flex flex-col items-center'>
                    <h1 className='text-2xl font-semibold text-slate-800 text-center'>Discover top categories</h1>
                    <p className='text-sm text-slate-600 text-center max-w-lg mt-2'>Fresh listings updated every minute.</p>
                </div>

                <div className='mt-10 grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-5'>
                    {topCategories.map(({ name, href, icon, gradient }) => (
                        <Link
                            key={name}
                            href={href}
                            className={`group relative aspect-square w-full max-w-44 mx-auto bg-gradient-to-br ${gradient} rounded-[60%_40%_30%_70%/60%_30%_70%_40%] hover:rounded-[40%_60%_70%_30%/40%_70%_30%_60%] transition-[border-radius,box-shadow,transform] duration-700 ease-out flex flex-col items-center justify-center p-3 sm:p-4 shadow-sm hover:shadow-lg active:scale-95`}
                        >
                            <Icon
                                icon={icon}
                                className='w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-500 group-hover:scale-110'
                            />
                            <span className='mt-2 text-slate-800 font-semibold text-[11px] sm:text-xs text-center leading-tight'>{name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className='mt-14'>
                <CategoriesMarquee />
            </div>
        </section>
    )
}

export default TopCategories
