'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

// Dropdown that holds an array value. Caps selections at `max`. Used for
// "areas you cover" where a service provider picks up to 4 neighborhoods
// they actually serve, all within the same parent state.
const MultiSelect = ({
    value = [],
    onChange,
    options = [],
    placeholder = 'Select…',
    leftIcon = null,
    max = null,
    disabled = false,
    className = '',
}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const onDocClick = (e) => {
            if (!ref.current?.contains(e.target)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [open])

    const selectedLabels = options
        .filter(o => value.includes(o.value ?? o))
        .map(o => o.label ?? o)

    const toggle = (optValue) => {
        if (value.includes(optValue)) {
            onChange(value.filter(v => v !== optValue))
        } else if (max == null || value.length < max) {
            onChange([...value, optValue])
        }
    }

    const remove = (e, optValue) => {
        e.stopPropagation()
        onChange(value.filter(v => v !== optValue))
    }

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type='button'
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                className={`w-full flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded-full px-4 py-2 text-left transition
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:ring-slate-400 focus:ring-slate-400 cursor-pointer'}`}
            >
                {leftIcon}
                <div className='flex flex-wrap items-center gap-1 flex-1 min-w-0'>
                    {selectedLabels.length === 0 ? (
                        <span className='text-slate-400 text-sm'>{placeholder}</span>
                    ) : (
                        selectedLabels.map((label, i) => {
                            const optValue = options.find(o => (o.label ?? o) === label)?.value ?? label
                            return (
                                <span key={i} className='inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 rounded-full pl-2 pr-1 py-0.5'>
                                    {label}
                                    <span
                                        role='button'
                                        tabIndex={-1}
                                        onClick={(e) => remove(e, optValue)}
                                        className='size-4 inline-flex items-center justify-center rounded-full hover:bg-slate-300'
                                    >
                                        <X size={10} />
                                    </span>
                                </span>
                            )
                        })
                    )}
                </div>
                <ChevronDown size={15} className='text-slate-400 shrink-0' />
            </button>

            {open && (
                <div className='absolute z-20 left-0 right-0 mt-1 bg-white ring-1 ring-slate-200 rounded-xl shadow-lg max-h-72 overflow-auto py-1'>
                    {max != null && (
                        <div className='px-3 py-2 text-[11px] text-slate-500 border-b border-slate-100 flex items-center justify-between'>
                            <span>Pick up to {max}</span>
                            <span>{value.length} / {max}</span>
                        </div>
                    )}
                    {options.length === 0 ? (
                        <p className='px-3 py-3 text-sm text-slate-400'>No options</p>
                    ) : options.map((o) => {
                        const optValue = o.value ?? o
                        const optLabel = o.label ?? o
                        const checked = value.includes(optValue)
                        const atCap = !checked && max != null && value.length >= max
                        return (
                            <button
                                key={optValue}
                                type='button'
                                disabled={atCap}
                                onClick={() => toggle(optValue)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition
                                    ${atCap ? 'text-slate-300 cursor-not-allowed'
                                            : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className={`size-4 rounded ring-1 flex items-center justify-center shrink-0 ${
                                    checked ? 'bg-slate-900 ring-slate-900 text-white' : 'bg-white ring-slate-300'
                                }`}>
                                    {checked && <span className='text-[10px] leading-none'>✓</span>}
                                </span>
                                <span className='flex-1 truncate'>{optLabel}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default MultiSelect
