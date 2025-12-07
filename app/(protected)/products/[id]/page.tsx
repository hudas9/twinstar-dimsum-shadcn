import ProductForm from "@/components/ProductForm";
import { supabaseServer } from "@/lib/supabaseServer";

interface ProductPage {
  params: Promise<{ id: string }>;
}

async function getProduct(id: number) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error("Product not found");
  }
  return data;
}

export default async function EditProductPage({ params }: ProductPage) {
  const { id } = await params;
  const product = await getProduct(parseInt(id));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>
      <ProductForm initialData={product} isEdit={true} />
    </div>
  );
}
