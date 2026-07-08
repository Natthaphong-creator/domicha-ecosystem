export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  category: "ชา" | "ผงเครื่องดื่ม" | "ไซรัป";
  price: number;
  unit: string;
  image: string;
  badge?: string;
};

export const shopProducts: ShopProduct[] = [
  { id: "tea-taiwan", name: "ชาไต้หวัน DomiCha", description: "ใบชาหอมเข้ม สูตรมาตรฐานสำหรับชานม", category: "ชา", price: 220, unit: "ถุง", image: "/products/taiwan-tea.png", badge: "ขายดี" },
  { id: "tea-red", name: "ชาแดง DomiCha", description: "ชาแดงกลิ่นหอม สีสวย เหมาะสำหรับชาไทย", category: "ชา", price: 195, unit: "ถุง", image: "/products/red-tea.png" },
  { id: "tea-green", name: "ชาเขียว DomiCha", description: "ชาเขียวกลิ่นละมุน สีสด ชงได้ทั้งนมและใส", category: "ชา", price: 210, unit: "ถุง", image: "/products/green-tea.png", badge: "แนะนำ" },
  { id: "tea-jasmine", name: "ชามะลิ DomiCha", description: "กลิ่นมะลิสดชื่น เหมาะสำหรับชาผลไม้", category: "ชา", price: 225, unit: "ถุง", image: "/products/jasmine-tea.png" },
  { id: "powder-banana", name: "ผงกล้วย Ding Fong", description: "ผงเครื่องดื่มสำเร็จรูป หอมกล้วยเข้มข้น", category: "ผงเครื่องดื่ม", price: 165, unit: "ถุง", image: "/products/banana-powder.png" },
  { id: "syrup-strawberry", name: "ไซรัปสตรอว์เบอร์รี", description: "ไซรัปผลไม้สำหรับชา โซดา และท็อปปิง", category: "ไซรัป", price: 145, unit: "ขวด", image: "/products/strawberry-syrup.png" }
];

export const shopProductMap = new Map(shopProducts.map((product) => [product.id, product]));
