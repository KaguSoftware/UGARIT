import { Categories } from "./categories/categories";
import { Price } from "./price/price";
import { Size } from "./size/size";
import { Sp } from "./specialProducts/specialProducts";

export const Filters = () => {
    return (
        <div className="flex flex-col gap-6">
            <Categories />
            <Size />
            <Sp />
            <Price />
        </div>
    );
};