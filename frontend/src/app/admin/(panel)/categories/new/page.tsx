import CategoryForm from "../CategoryForm";

export default function NewCategoryPage() {
    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold">New category</h1>
            <CategoryForm />
        </div>
    );
}
