// Smaller, simpler green check — basic verified status (ID/phone/address passed).
// Distinct from VerifiedTick which is the iconic blue Power Seller badge.
const VerifiedCheck = ({ size = 14, className = 'text-sky-500', title = 'Verified' }) => (
    <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        title={title}
        role="img"
        aria-label={title}
        style={{ width: size, height: size }}
    >
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14.59L6.41 12l1.41-1.41L11 13.76l5.18-5.17 1.41 1.41Z" />
        </svg>
    </span>
)

export default VerifiedCheck
