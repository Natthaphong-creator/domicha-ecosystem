export function movement(stock, amount, direction) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('กรอกจำนวนเต็มที่มากกว่า 0');
  if (!['in', 'out'].includes(direction)) throw new Error('ประเภทรายการไม่ถูกต้อง');
  const balance = stock + (direction === 'in' ? amount : -amount);
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('จำนวนคงเหลือไม่เพียงพอ');
  return balance;
}
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const low = p => p.stock <= p.minimum;
