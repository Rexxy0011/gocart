'use client'
import { createClient } from './client'

const PRODUCT_IMAGES_BUCKET = 'product-images'
const PROVIDER_DOCS_BUCKET = 'provider-docs'

const sanitizeExt = (file) => {
    const fromName = (file.name?.split('.').pop() || '').toLowerCase()
    if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
    // Fall back to mime type if the name is missing/odd.
    const fromType = (file.type || '').split('/')[1] || 'jpg'
    return fromType.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg'
}

// Uploads a list of File objects to product-images/<userId>/... and returns
// the public URLs in the same order, skipping any null/undefined entries.
//
// Throws on the first failed upload so the caller can surface the error and
// abort the product insert. We could collect partial successes but
// half-uploaded listings are worse than none - easier to retry the whole
// post.
export async function uploadProductImages(files, userId, { onProgress } = {}) {
    const supabase = createClient()
    const valid = files.filter(Boolean)
    const urls = []

    for (let i = 0; i < valid.length; i++) {
        const file = valid[i]
        const ext = sanitizeExt(file)
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}.${ext}`

        const { error } = await supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || `image/${ext}`,
            })
        if (error) throw error

        const { data: { publicUrl } } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
        urls.push(publicUrl)
        onProgress?.({ done: i + 1, total: valid.length })
    }

    return urls
}

// Upload report evidence images to the public product-images bucket under
// the reporter's own folder. Path: "<userId>/report-<ts>-<rand>-<i>.<ext>".
// Public URL is fine - direct links require knowing the path, and the
// reports table itself is RLS-locked so the only place URLs surface is
// the admin queue. Throws on first failure so the modal can show an error
// and not insert a half-evidenced report.
export async function uploadReportEvidence(files, userId) {
    const supabase = createClient()
    const valid = files.filter(Boolean)
    const urls = []

    for (let i = 0; i < valid.length; i++) {
        const file = valid[i]
        const ext = sanitizeExt(file)
        const path = `${userId}/report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}.${ext}`

        const { error } = await supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || `image/${ext}`,
            })
        if (error) throw error

        const { data: { publicUrl } } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
        urls.push(publicUrl)
    }

    return urls
}

// Upload a profile picture to the public product-images bucket. Lives at
// product-images/<userId>/avatar-<ts>.<ext> so it's clearly distinguishable
// from listing photos under the same user prefix. Returns the public URL.
//
// Note: the KYC selfie is NEVER reused here - that's stored privately under
// provider-docs and deleted after 30 days. Profile pictures are a separate,
// public, opt-in upload (see AvatarPrompt).
export async function uploadAvatar(file, userId) {
    if (!file) return null
    const supabase = createClient()
    const ext = sanitizeExt(file)
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    const { error } = await supabase
        .storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || `image/${ext}`,
        })
    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
    return publicUrl
}

// Upload a single sensitive doc (ID scan, selfie) to the PRIVATE provider-docs
// bucket. Returns the storage path (NOT a public URL) - admins generate signed
// URLs at view time using the service role.
//
// Files live under provider-docs/<userId>/<purpose>-<timestamp>.<ext>, where
// `purpose` is e.g. 'id-document' or 'selfie' for easy admin-side scanning.
export async function uploadProviderDoc(file, userId, purpose) {
    if (!file) return null
    const supabase = createClient()
    const ext = sanitizeExt(file)
    const path = `${userId}/${purpose}-${Date.now()}.${ext}`

    const { error } = await supabase
        .storage
        .from(PROVIDER_DOCS_BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || `image/${ext}`,
        })
    if (error) throw error

    return path
}
