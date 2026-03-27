import ProductCard from "@/src/components/cards/ProductCard/ProductCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { PRODUCTS } from "@/src/components/cards/ProductCard/constants";
import { constants } from "buffer";
export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center md:p-24 p-3 bg-slate-50 text-slate-900">
            <MaxWidthWrapper>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {PRODUCTS.map((productItem) => (
                        <ProductCard
                            key={productItem.id}
                            product={productItem}
                        />
                    ))}
                </div>
            </MaxWidthWrapper>
        </main>
    );
}
