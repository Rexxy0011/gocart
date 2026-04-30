import BestSelling from "@/components/BestSelling";
import LatestProducts from "@/components/LatestProducts";
import Newsletter from "@/components/Newsletter";
import PlatformIntro from "@/components/PlatformIntro";
import TopCategories from "@/components/TopCategories";

export default function Home() {
    return (
        <div>
            <PlatformIntro />
            <TopCategories />
            <LatestProducts />
            <BestSelling />
            <Newsletter />
        </div>
    );
}
