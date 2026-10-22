'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SearchHero } from '@/components/SearchHero';
import { ProductCard } from '@/components/ProductCard';
import { DistributorCompareDrawer } from '@/components/DistributorCompareDrawer';
import { ComplianceModal } from '@/components/ComplianceModal';
import { CartDrawer } from '@/components/CartDrawer';
import { AdminCatalogTab } from '@/components/AdminCatalogTab';
import { DistributorUploadTab } from '@/components/DistributorUploadTab';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { MasterProduct, Organization, CartItem, DistributorBatchListing, ProductCategory, DrugSchedule } from '@/types';
import { Pill, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Home() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<'marketplace' | 'admin' | 'distributor'>('marketplace');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [pincode, setPincode] = useState('500003');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [selectedSchedule, setSelectedSchedule] = useState<DrugSchedule | 'ALL'>('ALL');
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Drawers & Modals
  const [compareProduct, setCompareProduct] = useState<MasterProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [complianceBlockedItem, setComplianceBlockedItem] = useState<{ name: string; schedule: string } | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ number: string; total: number } | null>(null);

  // 1. Fetch Organizations for Role Switcher
  useEffect(() => {
    fetch('/api/organizations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.organizations) {
          setOrganizations(data.organizations);
          // Default to Care Chemist (Verified Retailer)
          const careChemist = data.organizations.find((o: Organization) => o.drug_license_no_20 && o.org_type === 'RETAILER');
          if (careChemist) setCurrentOrg(careChemist);
          else if (data.organizations.length > 0) setCurrentOrg(data.organizations[0]);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Fetch Products on Search / Filter changes (Debounced)
  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
    if (selectedSchedule !== 'ALL') params.set('schedule', selectedSchedule);
    if (pincode) params.set('pincode', pincode);

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 150); // Instant 150ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSchedule, pincode]);

  // Cart operations
  const handleAddToCart = (product: MasterProduct, batch: DistributorBatchListing, quantity: number) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((it) => it.batch_id === batch.batch_id);
      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
        return updated;
      }

      return [
        ...prevCart,
        {
          master_product_id: product.id,
          brand_name: product.brand_name,
          generic_composition: product.generic_composition,
          pack_size: product.pack_size,
          category: product.category,
          schedule: product.schedule,
          batch_id: batch.batch_id,
          batch_number: batch.batch_number,
          distributor_id: batch.distributor_id,
          distributor_name: batch.distributor_name,
          unit_ptr: Number(batch.ptr),
          mrp: Number(batch.mrp),
          gst_pct: Number(product.gst_percentage),
          scheme_description: batch.scheme_description,
          moq: batch.moq || 1,
          quantity: quantity,
        },
      ];
    });

    setCompareProduct(null);
    setCartOpen(true);
  };

  const handleQuickAdd = async (product: MasterProduct) => {
    // Check Drug License restriction
    const isRestricted = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(product.schedule);
    const lacksDl = isRestricted && (!currentOrg?.drug_license_no_20 || currentOrg.kyc_state !== 'APPROVED');

    if (lacksDl) {
      setComplianceBlockedItem({ name: product.brand_name, schedule: product.schedule });
      return;
    }

    // Open comparison drawer so user picks or views the best distributor
    setCompareProduct(product);
  };

  const handleUpdateCartQty = (batchId: string, qty: number) => {
    setCart((prev) =>
      prev.map((it) => (it.batch_id === batchId ? { ...it, quantity: qty } : it))
    );
  };

  const handleRemoveCartItem = (batchId: string) => {
    setCart((prev) => prev.filter((it) => it.batch_id !== batchId));
  };

  const handleClearCart = () => setCart([]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Global Header */}
      <Header
        currentOrg={currentOrg}
        organizations={organizations}
        onSelectOrg={(org) => setCurrentOrg(org)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cart={cart}
        onOpenCart={() => setCartOpen(true)}
        pincode={pincode}
        setPincode={setPincode}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'marketplace' && (
          <div>
            {/* Search Hero */}
            <SearchHero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSchedule={selectedSchedule}
              setSelectedSchedule={setSelectedSchedule}
              totalProducts={products.length}
            />

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="h-10 w-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Searching master catalog across active stockists...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
                  <Pill className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">No products found</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Try searching for another brand name, generic salt (e.g. Paracetamol), or clear filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onOpenCompare={(prod) => setCompareProduct(prod)}
                      onQuickAdd={handleQuickAdd}
                      currentOrg={currentOrg}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && <AdminCatalogTab />}

        {activeTab === 'distributor' && (
          <DistributorUploadTab
            currentOrg={currentOrg}
            distributors={organizations}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">PharmaSync B2B</span>
            <span>•</span>
            <span>Telangana Pharmaceutical & Surgical Distribution Network</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-emerald-400 font-semibold">● Live Supabase DB Connected</span>
            <span>•</span>
            <span className="font-mono text-slate-400">PostgreSQL 16 FEFO Ready</span>
          </div>
        </div>
      </footer>

      {/* Zomato-Style Distributor Comparison Drawer */}
      <DistributorCompareDrawer
        product={compareProduct}
        isOpen={Boolean(compareProduct)}
        onClose={() => setCompareProduct(null)}
        pincode={pincode}
        currentOrg={currentOrg}
        onAddToCart={handleAddToCart}
        onComplianceBlocked={(name, sch) => setComplianceBlockedItem({ name, schedule: sch })}
      />

      {/* Multi-Distributor Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentOrg={currentOrg}
        onOrderSuccess={(orderNum, grandTot) => {
          setConfirmedOrder({ number: orderNum, total: grandTot });
          fetchProducts(); // Refresh stock counts in background!
        }}
      />

      {/* Compliance Block Modal */}
      <ComplianceModal
        isOpen={Boolean(complianceBlockedItem)}
        onClose={() => setComplianceBlockedItem(null)}
        productName={complianceBlockedItem?.name || ''}
        schedule={complianceBlockedItem?.schedule || ''}
        currentOrg={currentOrg}
        onSwitchToVerified={() => {
          const verified = organizations.find((o) => o.drug_license_no_20 && o.org_type === 'RETAILER');
          if (verified) setCurrentOrg(verified);
        }}
      />

      {/* Order Confirmed Receipt Modal */}
      <OrderSuccessModal
        orderNumber={confirmedOrder?.number || null}
        grandTotal={confirmedOrder?.total || 0}
        onClose={() => setConfirmedOrder(null)}
      />
    </div>
  );
}
