'use client'
import { Search, ShoppingCart, UserPlus, ChevronDown, Plus, MapPin, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { categoryGroups } from "@/assets/assets";

const ALL_LOCATIONS = 'All locations'

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [location, setLocation] = useState(ALL_LOCATIONS)
    const [openCatDropdown, setOpenCatDropdown] = useState(false)
    const [openLocDropdown, setOpenLocDropdown] = useState(false)
    const catDropdownRef = useRef(null)
    const locDropdownRef = useRef(null)

    const cartCount = useSelector(state => state.cart.total)
    const products = useSelector(state => state.product.list)
    const providerStatus = useSelector(state => state.provider.status)

    const providerHref = providerStatus === 'verified' ? '/pro' : '/pro/apply'
    const providerLabel = providerStatus === 'verified' ? 'Provider' : 'Offer a service'

    const locations = useMemo(() => {
        const counts = {}
        for (const p of products) {
            if (p.location) counts[p.location] = (counts[p.location] || 0) + 1
        }
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count }))
    }, [products])

    useEffect(() => {
        const onClickOutside = (e) => {
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
                setOpenCatDropdown(false)
            }
            if (locDropdownRef.current && !locDropdownRef.current.contains(e.target)) {
                setOpenLocDropdown(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (search.trim()) params.set('search', search.trim())
        if (location !== ALL_LOCATIONS) params.set('location', location)

        const serviceGroup = categoryGroups.find(g => g.name === 'Repairs & Services')
        const isServiceCategory = category === 'Repairs & Services' || serviceGroup?.items.includes(category)
        const base = isServiceCategory ? '/services' : '/shop'

        if (category !== 'All' && !isServiceCategory) params.set('category', category)
        if (isServiceCategory && category !== 'Repairs & Services') params.set('category', category)

        const qs = params.toString()
        router.push(qs ? `${base}?${qs}` : base)
    }

    const pickCategory = (value) => {
        setCategory(value)
        setOpenCatDropdown(false)
    }

    const pickLocation = (value) => {
        setLocation(value)
        setOpenLocDropdown(false)
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center gap-4 sm:gap-6 max-w-7xl mx-auto py-4 transition-all">

                    {/* Logo */}
                    <Link href="/" className="relative text-3xl sm:text-4xl font-semibold text-slate-700 shrink-0">
                        <span className="text-slate-900">go</span>cart<span className="text-slate-900 text-4xl sm:text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-slate-900">
                            plus
                        </p>
                    </Link>

                    {/* Search with category + location dropdowns + external Search button */}
                    <form
                        onSubmit={handleSearch}
                        className="flex-1 flex items-center gap-2"
                    >
                        <div className="flex-1 flex items-center text-sm bg-slate-100 rounded-full">

                            {/* Category dropdown */}
                            <div className="relative shrink-0" ref={catDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => { setOpenCatDropdown((o) => !o); setOpenLocDropdown(false) }}
                                    className="flex items-center gap-1 px-4 py-2.5 text-slate-700 hover:text-slate-900 rounded-l-full"
                                >
                                    <span className="truncate max-w-[6rem]">{category}</span>
                                    <ChevronDown size={14} className={`transition ${openCatDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {openCatDropdown && (
                                    <div className="absolute top-full left-0 mt-2 z-50 w-60 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 py-1 max-h-96 overflow-auto">
                                        <button
                                            type="button"
                                            onClick={() => pickCategory('All')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${category === 'All' ? 'text-slate-900 font-medium' : 'text-slate-700'}`}
                                        >
                                            All
                                        </button>
                                        {categoryGroups.map((group) => (
                                            <div key={group.name} className="border-t border-slate-100 mt-1 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => pickCategory(group.name)}
                                                    className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${category === group.name ? 'text-slate-900' : 'text-slate-800'}`}
                                                >
                                                    {group.name}
                                                </button>
                                                {group.items.map((item) => (
                                                    <button
                                                        type="button"
                                                        key={item}
                                                        onClick={() => pickCategory(item)}
                                                        className={`w-full text-left pl-8 pr-4 py-1.5 text-xs hover:bg-slate-50 ${category === item ? 'text-slate-900 font-medium' : 'text-slate-600'}`}
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <span className="h-6 w-px bg-slate-300 shrink-0" />

                            {/* Location dropdown */}
                            <div className="relative shrink-0" ref={locDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => { setOpenLocDropdown((o) => !o); setOpenCatDropdown(false) }}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-slate-700 hover:text-slate-900"
                                >
                                    <MapPin size={14} className="shrink-0" />
                                    <span className="truncate max-w-[7rem]">{location === ALL_LOCATIONS ? 'All locations' : location}</span>
                                    <ChevronDown size={14} className={`transition ${openLocDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {openLocDropdown && (
                                    <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 py-1 max-h-80 overflow-auto">
                                        <button
                                            type="button"
                                            onClick={() => pickLocation(ALL_LOCATIONS)}
                                            className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 ${location === ALL_LOCATIONS ? 'text-slate-900 font-medium' : 'text-slate-700'}`}
                                        >
                                            <span>All locations</span>
                                            <span className="text-xs text-slate-400">{products.length}</span>
                                        </button>
                                        <div className="border-t border-slate-100 mt-1 pt-1">
                                            {locations.map(({ name, count }) => (
                                                <button
                                                    type="button"
                                                    key={name}
                                                    onClick={() => pickLocation(name)}
                                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 ${location === name ? 'text-slate-900 font-medium' : 'text-slate-700'}`}
                                                >
                                                    <span>{name}</span>
                                                    <span className="text-xs text-slate-400">{count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <span className="h-6 w-px bg-slate-300 shrink-0" />

                            {/* Input */}
                            <div className="flex items-center gap-2 flex-1 px-4 text-slate-500">
                                <Search size={18} className="shrink-0" />
                                <input
                                    className="w-full bg-transparent outline-none placeholder-slate-500 py-2"
                                    type="text"
                                    placeholder="Search…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* External Search button */}
                        <button
                            type="submit"
                            className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-sm py-2.5 px-5 rounded-full active:scale-95 transition"
                        >
                            Search
                        </button>
                    </form>

                    {/* Right-side icon cluster */}
                    <div className="flex items-center gap-4 sm:gap-5 shrink-0">

                        {/* Post an ad */}
                        <Link
                            href="/store/add-product"
                            aria-label="Post an ad"
                            className="group flex flex-col items-center gap-1 text-slate-600 hover:text-slate-900 transition"
                        >
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-slate-300 group-hover:ring-slate-500 transition">
                                <Plus size={18} />
                            </span>
                            <span className="text-[10px] sm:text-xs leading-none">Post an ad</span>
                        </Link>

                        {/* Provider dashboard (or apply CTA for non-verified users) */}
                        <Link
                            href={providerHref}
                            aria-label={providerLabel}
                            className="group flex flex-col items-center gap-1 text-slate-600 hover:text-slate-900 transition max-sm:hidden"
                        >
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-slate-300 group-hover:ring-slate-500 transition">
                                <Wrench size={17} />
                            </span>
                            <span className="text-[10px] sm:text-xs leading-none whitespace-nowrap">{providerLabel}</span>
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" aria-label="Cart" className="relative text-slate-600 hover:text-slate-900 transition">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 text-[10px] text-white bg-slate-700 min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Signup */}
                        <Link
                            href="/signup"
                            aria-label="Sign up"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition active:scale-95"
                        >
                            <UserPlus size={18} />
                        </Link>

                    </div>

                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar
