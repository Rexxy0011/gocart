'use client'
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"

const Avatar = ({ src, alt, size = 80, className = '' }) => {
    if (src) return <Image width={size} height={size} src={src} alt={alt || ''} className={className} />
    const initial = (alt || '?').charAt(0).toUpperCase()
    return (
        <div
            className={`${className} flex items-center justify-center bg-slate-100 ring-1 ring-slate-200 text-slate-500 font-semibold`}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        >
            {initial}
        </div>
    )
}

const StoreInfo = ({store}) => {
    return (
        <div className="flex-1 space-y-2 text-sm">
            <Avatar src={store.logo} alt={store.name} size={80} className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800"> {store.name} </h3>
                <span className="text-sm">@{store.username}</span>

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${store.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : store.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                        }`}
                >
                    {store.status}
                </span>
            </div>

            {store.description && <p className="text-slate-600 my-5 max-w-2xl">{store.description}</p>}
            {store.address && <p className="flex items-center gap-2"> <MapPin size={16} /> {store.address}</p>}
            {store.contact && <p className="flex items-center gap-2"><Phone size={16} /> {store.contact}</p>}
            {store.email && <p className="flex items-center gap-2"><Mail size={16} /> {store.email}</p>}
            {store.createdAt && (
                <p className="text-slate-700 mt-5">Applied on <span className="text-xs">{new Date(store.createdAt).toLocaleDateString()}</span> by</p>
            )}
            {store.user && (
                <div className="flex items-center gap-2 text-sm">
                    <Avatar src={store.user.image} alt={store.user.name} size={36} className="rounded-full" />
                    <div>
                        <p className="text-slate-600 font-medium">{store.user.name}</p>
                        <p className="text-slate-400">{store.user.email}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StoreInfo
