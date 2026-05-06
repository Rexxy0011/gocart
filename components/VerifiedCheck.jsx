import Image from 'next/image'

// Verified-seller credential — uses the user-provided badge image
// (public/verified-badge.jpg). Square aspect: the image is 8000×8000,
// scaled down by Next/Image to whatever `size` is passed.
//
// The `className` prop is forwarded so callers can adjust margin /
// vertical alignment inline next to text.
const VerifiedCheck = ({ size = 18, className = '', title = 'Verified' }) => (
    <Image
        src='/verified-badge.jpg'
        alt={title}
        width={size}
        height={size}
        className={`inline-block shrink-0 ${className}`}
        priority={false}
    />
)

export default VerifiedCheck
