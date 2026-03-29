"use client";
import { Category } from "./types";
import Cat from "./categoryCard";
interface CatGridProps {
    categories: Category[];
}

const CatGrid = ({ categories }: CatGridProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 md:p-3 p-0 gap-2 z-0 ">
            {categories.map((category) => (
                <Cat key={category.id} category={category} />
            ))}
        </div>
    );
};

export default CatGrid;
