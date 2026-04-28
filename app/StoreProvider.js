'use client'
import { useRef, useState } from 'react'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { makeStore } from '../lib/store'

export default function StoreProvider({ children }) {
    const storeRef = useRef(undefined)
    if (!storeRef.current) {
        storeRef.current = makeStore()
    }

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60_000,
                refetchOnWindowFocus: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={storeRef.current}>{children}</Provider>
        </QueryClientProvider>
    )
}
