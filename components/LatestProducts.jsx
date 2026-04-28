'use client'
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const LatestProducts = () => {

    const displayQuantity = 4
    const allProducts = useSelector(state => state.product.list)
    const products = allProducts.filter(p => !p.service)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title title='Top listings' description={`Showing ${products.length < displayQuantity ? products.length : displayQuantity} of ${products.length} listings`} href='/shop' />
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {products.slice().sort((a, b) => {
                    const prio = (p) => p.featured ? 2 : (p.urgent || p.bulkSale) ? 1 : 0
                    const diff = prio(b) - prio(a)
                    if (diff !== 0) return diff
                    return new Date(b.createdAt) - new Date(a.createdAt)
                }).slice(0, displayQuantity).map((product, index) => (
                    <ProductCard key={index} product={product} />
                ))}
            </div>
        </div>
    )
}

export default LatestProducts
