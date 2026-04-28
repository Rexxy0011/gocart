'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const Dropdown = ({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    leftIcon = null,
    className = '',
    menuClassName = '',
    buttonClassName = '',
    align = 'left',
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

    const current = options.find(o => o.value === value)

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type='button'
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded-full px-4 py-2 hover:ring-slate-400 focus:outline-none focus:ring-slate-400 transition ${buttonClassName}`}
            >
                {leftIcon}
                <span className={`flex-1 text-sm text-left truncate min-w-0 ${current ? 'text-slate-700' : 'text-slate-400'}`}>
                    {current?.label || placeholder}
                </span>
                <ChevronDown size={14} className={`shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className={`absolute top-full mt-2 z-50 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 py-1 max-h-80 overflow-auto min-w-full ${
                        align === 'right' ? 'right-0' : 'left-0'
                    } ${menuClassName}`}
                >
                    {options.map((opt) => (
                        <button
                            key={opt.value ?? opt.label}
                            type='button'
                            onClick={() => { onChange(opt.value); setOpen(false) }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                                value === opt.value ? 'text-slate-900 font-semibold bg-slate-50' : 'text-slate-700'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Dropdown
