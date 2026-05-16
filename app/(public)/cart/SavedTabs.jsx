'use client'
import { useState } from 'react'

// Client island for the tab switcher on /cart. The grids themselves are
// rendered by the server page and passed in as ReactNodes - that keeps
// data-fetching server-side while the visual switch stays interactive.
const SavedTabs = ({ productCount, serviceCount, productGrid, serviceGrid }) => {

    // Default to whichever side has saves; if both empty (shouldn't happen
    // - empty state is handled in the parent) fall back to products.
    const [activeTab, setActiveTab] = useState(
        productCount === 0 && serviceCount > 0 ? 'services' : 'products',
    )

    return (
        <>
            <div className='flex border-b-2 border-slate-200 mb-6'>
                <button
                    type='button'
                    onClick={() => setActiveTab('products')}
                    className={`${
                        activeTab === 'products'
                            ? 'text-slate-900 border-b-2 border-emerald-500 -mb-0.5 font-semibold'
                            : 'text-slate-500 hover:text-slate-700'
                    } px-6 py-3 text-sm font-medium transition`}
                >
                    Products
                    {productCount > 0 && (
                        <span className='ml-1.5 text-xs text-slate-400'>({productCount})</span>
                    )}
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('services')}
                    className={`${
                        activeTab === 'services'
                            ? 'text-slate-900 border-b-2 border-emerald-500 -mb-0.5 font-semibold'
                            : 'text-slate-500 hover:text-slate-700'
                    } px-6 py-3 text-sm font-medium transition`}
                >
                    Services
                    {serviceCount > 0 && (
                        <span className='ml-1.5 text-xs text-slate-400'>({serviceCount})</span>
                    )}
                </button>
            </div>

            {activeTab === 'products' ? (
                productCount === 0 ? (
                    <p className='text-sm text-slate-500 py-12 text-center'>No saved products yet.</p>
                ) : productGrid
            ) : (
                serviceCount === 0 ? (
                    <p className='text-sm text-slate-500 py-12 text-center'>No saved services yet.</p>
                ) : serviceGrid
            )}
        </>
    )
}

export default SavedTabs
