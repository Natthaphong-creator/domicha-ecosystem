import type { QuotationItem } from "@/lib/types";

export function calculateQuotation(items: QuotationItem[]) {
  let subtotal = 0;
  let discount_total = 0;
  let vat_total = 0;

  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const unit_price = Number(item.unit_price || 0);
    const discount = Number(item.discount || 0);
    const beforeVat = Math.max(quantity * unit_price - discount, 0);
    const vat_amount = Number((beforeVat * 0.07).toFixed(2));
    const line_total = Number((beforeVat + vat_amount).toFixed(2));

    subtotal += quantity * unit_price;
    discount_total += discount;
    vat_total += vat_amount;

    return {
      ...item,
      quantity,
      unit_price,
      discount,
      vat_amount,
      line_total
    };
  });

  const grand_total = Number((subtotal - discount_total + vat_total).toFixed(2));

  return {
    items: calculatedItems,
    subtotal: Number(subtotal.toFixed(2)),
    discount_total: Number(discount_total.toFixed(2)),
    vat_total: Number(vat_total.toFixed(2)),
    grand_total
  };
}
