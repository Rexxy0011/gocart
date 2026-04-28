'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import ServicePage from "@/components/ServicePage"

export default function ServiceRoute() {

    const { id } = useParams()
    const [product, setProduct] = useState()
    const products = useSelector(state => state.product.list)

    useEffect(() => {
        if (products.length > 0) {
            setProduct(products.find((p) => p.id === id))
        }
        scrollTo(0, 0)
    }, [id, products])

    if (!product) return null
    if (!product.service) {
        return <div className='p-12 text-center text-slate-500 text-sm'>This listing is not a service.</div>
    }

    return <ServicePage product={product} />
}
