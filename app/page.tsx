import HeroBanner from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import PromoBanner from "@/components/home/PromoBanner";
import ProductSection from "@/components/home/ProductSection";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-2">
        <HeroBanner />
        <CategorySection />
        <PromoBanner />
        <ProductSection
          title="🔥 สินค้าขายดี"
          subtitle="ยอดนิยมจากผู้ซื้อจริง"
          href="/products?sort=best_selling"
          sortBy="best_selling"
        />
        <ProductSection
          title="✨ สินค้ามาใหม่"
          subtitle="อัพเดทล่าสุดจากร้านค้า"
          href="/products?sort=newest"
          sortBy="newest"
          accentColor="text-green-500"
        />
        <ProductSection
          title="💡 แนะนำสำหรับคุณ"
          subtitle="สินค้าคัดสรรตามความสนใจ"
          href="/products"
          sortBy="newest"
          accentColor="text-blue-500"
        />
      </div>
    </div>
  );
}
