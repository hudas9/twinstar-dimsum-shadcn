import ProductForm from "@/components/ProductForm";

export default function CreateProductPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Create Product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
