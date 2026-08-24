export function productPayload(payload: Record<string, unknown>) {
  return {
    product_code: payload.product_code,
    product_name: payload.product_name,
    category: payload.category,
    unit: payload.unit,
    cost_price: payload.cost_price,
    selling_price: payload.selling_price,
    image_url: payload.image_url || null,
    vat_type: payload.vat_type,
    minimum_stock: payload.minimum_stock,
    supplier_id: payload.supplier_id || null,
    status: payload.status
  };
}
