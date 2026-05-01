// Adapt a Supabase `products` row (snake_case, embedded store via PostgREST
// join) into the camelCase shape the existing ProductCard / ProductRow / etc.
// expect. Mirrors the dummy-data structure that's been driving the UI to
// minimize component churn while we migrate reads off Redux.
//
// Pass the Supabase row in the canonical select shape:
//   *,
//   store:stores!inner(id, name, username, status, is_active,
//     user:profiles!stores_user_id_fkey(id, name, image))
export const mapProductRow = (row) => {
    if (!row) return null
    return {
        id:           row.id,
        name:         row.name,
        description:  row.description,
        images:       row.images || [],
        category:     row.category,
        location:     row.location,
        price:        row.price,
        // Existing UI reads `mrp` for the strikethrough price; we now store
        // that as was_price. Map it across so cards continue to render.
        mrp:          row.was_price,
        free:         row.free,
        condition:    row.condition,
        featured:     row.featured,
        urgent:       row.urgent,
        bulkSale:     row.bulk_sale,
        deliveryAvailable: row.delivery_available,
        service:      row.service,
        vehicle:      row.vehicle,
        createdAt:    row.created_at,
        updatedAt:    row.updated_at,
        rating:       [],
        storeId:      row.store_id,
        reviewStatus: row.review_status,
        reviewedAt:   row.reviewed_at,
        // in_stock: true means actively for sale; false = the seller has
        // marked it sold/unavailable. Rendered as a "Sold" overlay on
        // listing cards so buyers can still browse the history.
        inStock:      row.in_stock !== false,
        store:        row.store ? mapStoreRow(row.store) : undefined,
    }
}

export const mapStoreRow = (row) => {
    if (!row) return null
    return {
        id:          row.id,
        name:        row.name,
        username:    row.username,
        description: row.description,
        address:     row.address,
        status:      row.status,
        logo:        row.logo,
        contact:     row.contact,
        email:       row.email,
        createdAt:   row.created_at,
        user:        row.user ? {
            id:    row.user.id,
            name:  row.user.name,
            image: row.user.image,
        } : undefined,
    }
}

// Selector strings — keep here so every read site uses the same join shape.
export const PRODUCT_WITH_STORE_SELECT = `
    id, name, description, images, category, location, price, was_price,
    free, condition, featured, urgent, bulk_sale, delivery_available,
    service, vehicle, created_at, updated_at, store_id, bumped_at,
    review_status, reviewed_at, in_stock,
    store:stores!inner(
        id, name, username, status, is_active, contact,
        user:profiles!stores_user_id_fkey(id, name, image)
    )
`
