'use client'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { setFavorites } from './cartSlice'

// Mounted once at the root layout. Dispatches the server-side favorite
// IDs into the Redux slice so heart icons start with the correct on/off
// state. Without this, signed-in users would see all hearts empty until
// they manually saved something — even if they saved it on another
// device or last week.
const FavoritesHydrator = ({ favoriteIds = [] }) => {
    const dispatch = useDispatch()
    const hydrated = useRef(false)

    useEffect(() => {
        if (hydrated.current) return
        hydrated.current = true
        dispatch(setFavorites(favoriteIds))
    }, [dispatch, favoriteIds])

    return null
}

export default FavoritesHydrator
