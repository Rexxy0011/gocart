'use client'
import { useEffect, useRef, useState } from 'react'

const AddressInput = ({
    value,
    onChange,
    placeholder = '',
    suggestions = [],
    leftIcon = null,
    className = '',
    state = null,
}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [])

    const q = (value || '').trim().toLowerCase()
    const filtered = q
        ? suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 8)
        : suggestions.slice(0, 8)

    const showStateChip = !!state && (!value || !value.toLowerCase().includes(state.toLowerCase()))
    const fullValue = (suggestion) => state ? `${suggestion}, ${state}` : suggestion

    return (
        <div ref={ref} className={`relative ${className}`}>
            <div className='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded p-2.5 focus-within:ring-2 focus-within:ring-slate-300 transition'>
                {leftIcon}
                <input
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400 min-w-0'
                    autoComplete='off'
                />
                {showStateChip && (
                    <span className='shrink-0 inline-flex items-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-white ring-1 ring-slate-200 px-1.5 py-0.5 rounded-full'>
                        {state}
                    </span>
                )}
            </div>

            {open && filtered.length > 0 && (
                <div className='absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 py-1 max-h-60 overflow-auto'>
                    {filtered.map((s) => (
                        <button
                            key={s}
                            type='button'
                            onClick={() => { onChange(fullValue(s)); setOpen(false) }}
                            className='w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 transition'
                        >
                            <span className='truncate'>{s}</span>
                            {state && <span className='text-xs text-slate-400 shrink-0'>{state}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AddressInput
