import { Categories } from "./categories/categories";
import { Size } from "./size/size";
import { Sp } from "./specialProducts/specialProducts";

export const Filters = () => {
    return (
        <div className="flex flex-col gap-6">
            <Categories />
            <Size />
            <Sp />

        </div>
    );
};