import ProductCard from './ProductCard'
import ServiceCard from './ServiceCard'

const Listing = ({ product }) => {
    if (product?.service) return <ServiceCard product={product} />
    return <ProductCard product={product} />
}

export default Listing
