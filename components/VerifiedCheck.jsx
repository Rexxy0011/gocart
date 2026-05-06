// Verified-seller credential. Rosette-style award badge — solid emerald
// fill with a white checkmark inside, matching the visual you sent.
// Uses currentColor on the rosette so colour can be swapped via the
// `className` prop (e.g. `text-amber-500` for milestone variants).
const VerifiedCheck = ({ size = 18, className = 'text-emerald-500', title = 'Verified' }) => (
    <svg
        viewBox='0 0 24 24'
        width={size}
        height={size}
        fill='none'
        className={`inline-flex shrink-0 ${className}`}
        role='img'
        aria-label={title}
    >
        <title>{title}</title>
        <path
            d='M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z'
            fill='currentColor'
        />
        <path
            d='m9 12 2 2 4-4'
            stroke='white'
            strokeWidth='2.4'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
)

export default VerifiedCheck
