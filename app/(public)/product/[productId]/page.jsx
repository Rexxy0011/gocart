'use client'
import ProductDetails from "@/components/ProductDetails";
import RelatedListings from "@/components/RelatedListings";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const products = useSelector(state => state.product.list);

    useEffect(() => {
        if (products.length > 0) {
            setProduct(products.find((p) => p.id === productId))
        }
        scrollTo(0, 0)
    }, [productId, products]);

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto py-6">

                {/* Breadcrumbs */}
                <nav className="text-slate-600 text-sm mb-4 flex flex-wrap items-center gap-1">
                    <Link href="/" className="text-sky-700 hover:underline">Home</Link>
                    <span className="text-slate-400">/</span>
                    <Link href="/shop" className="text-sky-700 hover:underline">Listings</Link>
                    {product?.category && (
                        <>
                            <span className="text-slate-400">/</span>
                            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-sky-700 hover:underline">
                                {product.category}
                            </Link>
                        </>
                    )}
                </nav>

                {product && (
                    <>
                        <ProductDetails product={product} />
                        <RelatedListings product={product} />
                    </>
                )}
            </div>
        </div>
    );
}
