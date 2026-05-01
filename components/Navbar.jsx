'use client'
import { Search, Heart, UserPlus, ChevronDown, Plus, MapPin, Wrench, LogOut, MessageSquareText, Menu, X, ShoppingBag, Wrench as WrenchIcon, Info, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { categoryGroups } from "@/assets/assets";
import { signOut } from "@/app/actions/auth";

const ALL_LOCATIONS = 'All locations'

const Navbar = ({ user = null, providerStatus = null }) => {

    const router = useRouter();
    const [openUserMenu, setOpenUserMenu] = useState(false)
    const [openMobileMenu, setOpenMobileMenu] = useState(false)
    const userMenuRef = useRef(null)

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || ''
    const userInitial = (userName || 'U').charAt(0).toUpperCase()

    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [location, setLocation] = useState(ALL_LOCATIONS)
    const [openCatDropdown, setOpenCatDropdown] = useState(false)
    const [openLocDropdown, setOpenLocDropdown] = useState(false)
    const catDropdownRef = useRef(null)
    const locDropdownRef = useRef(null)

    const cartCount = useSelector(state => state.cart.total)
    const products = useSelector(state => state.product.list)

    // 'approved' takes them to the live /pro dashboard. Anything else
    // (pending / rejected / no application yet) routes through /pro/apply
    // where they see their status and can submit / resubmit.
    const providerHref = providerStatus === 'approved' ? '/pro' : '/pro/apply'
    const providerLabel = providerStatus === 'approved' ? 'Provider' : 'Offer a service'

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
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setOpenUserMenu(false)
            }
        }
        const onKey = (e) => { if (e.key === 'Escape') setOpenMobileMenu(false) }
        document.addEventListener('mousedown', onClickOutside)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClickOutside)
            document.removeEventListener('keydown', onKey)
        }
    }, [])

    // Lock body scroll while the mobile drawer is open so the page underneath
    // doesn't scroll when the user drags inside the menu.
    useEffect(() => {
        if (openMobileMenu) {
            const prev = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = prev }
        }
    }, [openMobileMenu])

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
                {/* Mobile = two rows (logo+icons / search), Desktop = single row.
                    flex-wrap + order utilities flip the layout at sm: on mobile
                    the search form gets `w-full` and falls to a second line. */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 max-w-7xl mx-auto py-4 transition-all">

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
                        className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 mt-2 sm:mt-0 flex items-center gap-2"
                    >
                        <div className="flex-1 flex items-center text-sm bg-slate-100 rounded-full">

                            {/* Category dropdown */}
                            <div className="relative shrink-0" ref={catDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => { setOpenCatDropdown((o) => !o); setOpenLocDropdown(false) }}
                                    className="flex items-center gap-1 px-2.5 sm:px-4 py-2.5 text-slate-700 hover:text-slate-900 rounded-l-full"
                                >
                                    <span className="truncate max-w-[3rem] sm:max-w-[6rem]">{category}</span>
                                    <ChevronDown size={14} className={`shrink-0 transition ${openCatDropdown ? 'rotate-180' : ''}`} />
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
                                    className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-slate-700 hover:text-slate-900"
                                >
                                    <MapPin size={14} className="shrink-0" />
                                    <span className="truncate max-w-[4rem] sm:max-w-[7rem]">{location === ALL_LOCATIONS ? 'All locations' : location}</span>
                                    <ChevronDown size={14} className={`shrink-0 transition ${openLocDropdown ? 'rotate-180' : ''}`} />
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
                            <div className="flex items-center gap-2 flex-1 px-3 sm:px-4 min-w-0 text-slate-500">
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

                        {/* External Search button — icon only on mobile to
                            keep the row narrow */}
                        <button
                            type="submit"
                            aria-label="Search"
                            className="shrink-0 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white text-sm py-2.5 px-3 sm:px-5 rounded-full active:scale-95 transition"
                        >
                            <Search size={16} className="sm:hidden" />
                            <span className="hidden sm:inline">Search</span>
                        </button>
                    </form>

                    {/* Right-side icon cluster. On mobile: ml-auto pushes it
                        next to the logo on row 1 (search wraps below). Most
                        items are hidden on mobile and live inside the drawer
                        instead — only [+ post] and [☰ menu] stay visible. */}
                    <div className="ml-auto sm:ml-0 sm:order-3 flex items-center gap-3 sm:gap-5 shrink-0">

                        {/* Post an ad — always visible (primary action) */}
                        <Link
                            href="/store/add-product"
                            aria-label="Post an ad"
                            className="group flex flex-col items-center gap-1 text-slate-600 hover:text-slate-900 transition"
                        >
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-slate-300 group-hover:ring-slate-500 transition">
                                <Plus size={18} />
                            </span>
                            <span className="hidden sm:inline text-xs leading-none">Post an ad</span>
                        </Link>

                        {/* Provider dashboard / Offer-a-service — desktop only */}
                        <Link
                            href={providerHref}
                            aria-label={providerLabel}
                            className="hidden sm:flex group flex-col items-center gap-1 text-slate-600 hover:text-slate-900 transition"
                        >
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-slate-300 group-hover:ring-slate-500 transition">
                                <Wrench size={17} />
                            </span>
                            <span className="text-xs leading-none whitespace-nowrap">{providerLabel}</span>
                        </Link>

                        {/* Messages — desktop only (mobile has it in the drawer) */}
                        {user && (
                            <Link href="/messages" aria-label="Messages" className="hidden sm:inline text-slate-600 hover:text-slate-900 transition">
                                <MessageSquareText size={22} />
                            </Link>
                        )}

                        {/* Saved items — desktop only (mobile has it in the drawer) */}
                        <Link href="/cart" aria-label="Saved items" className="hidden sm:inline relative text-slate-600 hover:text-slate-900 transition">
                            <Heart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 text-[10px] text-white bg-rose-500 min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth — desktop only. Mobile auth lives in the drawer. */}
                        {user ? (
                            <div className="hidden sm:block relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setOpenUserMenu((o) => !o)}
                                    className="inline-flex items-center gap-2 ring-1 ring-slate-300 hover:ring-slate-500 rounded-full pl-1 pr-3 py-1 transition"
                                    aria-label="Account menu"
                                >
                                    <span className="inline-flex items-center justify-center size-7 rounded-full bg-slate-900 text-white text-xs font-bold">
                                        {userInitial}
                                    </span>
                                    <span className="text-sm font-medium text-slate-700">{userName.split(' ')[0]}</span>
                                    <ChevronDown size={13} className={`text-slate-500 transition ${openUserMenu ? 'rotate-180' : ''}`} />
                                </button>
                                {openUserMenu && (
                                    <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 py-1.5">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <Link href="/store" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">My listings</Link>
                                        <Link href="/messages" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Messages</Link>
                                        <Link href="/orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">My orders</Link>
                                        <Link href="/cart" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Saved items</Link>
                                        <form action={signOut} className="border-t border-slate-100 mt-1 pt-1">
                                            <button type="submit" className="w-full inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                                <LogOut size={14} className="text-slate-400" />
                                                Sign out
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    aria-label="Sign up"
                                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-4 py-2 transition active:scale-95"
                                >
                                    <UserPlus size={15} />
                                    <span>Sign up</span>
                                </Link>
                            </div>
                        )}

                        {/* Hamburger — mobile only. Opens the drawer below. */}
                        <button
                            type="button"
                            onClick={() => setOpenMobileMenu(true)}
                            aria-label="Open menu"
                            className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-slate-300 text-slate-700 hover:ring-slate-500 transition relative"
                        >
                            <Menu size={18} />
                            {user && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500" />
                            )}
                        </button>

                    </div>

                </div>
            </div>
            <hr className="border-gray-300" />

            {/* Mobile drawer — slides in from the right. Always mounted so the
                close animation can play on its way out. pointer-events-none
                when closed so the invisible layer doesn't intercept taps. */}
            <div
                className={`fixed inset-0 z-[60] sm:hidden ${openMobileMenu ? '' : 'pointer-events-none'}`}
                aria-hidden={!openMobileMenu}
            >
                {/* Backdrop — fades in/out */}
                <div
                    onClick={() => setOpenMobileMenu(false)}
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${openMobileMenu ? 'opacity-100' : 'opacity-0'}`}
                />
                {/* Panel — slides in from the right */}
                <div className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-out ${openMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            {user ? (
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="inline-flex items-center justify-center size-10 rounded-full bg-slate-900 text-white text-sm font-bold shrink-0">
                                        {userInitial}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm font-semibold text-slate-900">Welcome to GoCart</p>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpenMobileMenu(false)}
                                aria-label="Close menu"
                                className="size-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body — scrollable */}
                        <div className="flex-1 overflow-y-auto py-3">

                            {/* Signed-out auth buttons up top */}
                            {!user && (
                                <div className="px-5 pb-3 grid grid-cols-2 gap-2 border-b border-slate-100">
                                    <Link
                                        href="/login"
                                        onClick={() => setOpenMobileMenu(false)}
                                        className="text-center text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:ring-slate-500 rounded-full py-2.5"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setOpenMobileMenu(false)}
                                        className="text-center text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-full py-2.5"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}

                            {/* Browse */}
                            <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Browse</p>
                            <Link href="/shop" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <ShoppingBag size={16} className="text-slate-500" /> All listings
                            </Link>
                            <Link href="/services" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <WrenchIcon size={16} className="text-slate-500" /> Services
                            </Link>

                            {/* Selling */}
                            <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-t border-slate-100 mt-2">Selling</p>
                            <Link href="/store/add-product" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <Plus size={16} className="text-slate-500" /> Post an ad
                            </Link>
                            <Link href={providerHref} onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <Wrench size={16} className="text-slate-500" /> {providerLabel}
                            </Link>
                            {user && (
                                <Link href="/store" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                    <ShoppingBag size={16} className="text-slate-500" /> My listings
                                </Link>
                            )}

                            {/* Account — signed-in only */}
                            {user && (
                                <>
                                    <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-t border-slate-100 mt-2">Account</p>
                                    <Link href="/messages" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                        <MessageSquareText size={16} className="text-slate-500" /> Messages
                                    </Link>
                                    <Link href="/cart" onClick={() => setOpenMobileMenu(false)} className="flex items-center justify-between gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                        <span className="flex items-center gap-3">
                                            <Heart size={16} className="text-slate-500" /> Saved items
                                        </span>
                                        {cartCount > 0 && (
                                            <span className="text-[10px] text-white bg-rose-500 min-w-4 h-4 px-1.5 rounded-full inline-flex items-center justify-center">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link href="/orders" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                        <ShoppingBag size={16} className="text-slate-500" /> My orders
                                    </Link>
                                </>
                            )}

                            {/* Help & Trust */}
                            <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-t border-slate-100 mt-2">Help &amp; Trust</p>
                            <Link href="/about" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <Info size={16} className="text-slate-500" /> About GoCart
                            </Link>
                            <Link href="/safety" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <ShieldCheck size={16} className="text-slate-500" /> Safety tips
                            </Link>
                            <Link href="/contact" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                <Mail size={16} className="text-slate-500" /> Contact us
                            </Link>
                        </div>

                        {/* Sign-out — pinned to bottom for signed-in users */}
                        {user && (
                            <form action={signOut} className="border-t border-slate-200 px-5 py-4">
                                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:ring-slate-500 rounded-full py-2.5">
                                    <LogOut size={14} className="text-slate-500" /> Sign out
                                </button>
                            </form>
                        )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
