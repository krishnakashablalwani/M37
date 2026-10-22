'use client';

import React, { useState, useEffect } from 'react';
import { Header, ActiveTabType } from '@/components/Header';
import { SearchHero } from '@/components/SearchHero';
import { ProductSearchCard } from '@/components/ProductSearchCard';
import { DistributorCompareDrawer } from '@/components/DistributorCompareDrawer';
import { AutoReplenishDeck } from '@/components/AutoReplenishDeck';
import { StickyReplenishmentFooter } from '@/components/StickyReplenishmentFooter';
import { ComplianceModal } from '@/components/ComplianceModal';
import { CartDrawer } from '@/components/CartDrawer';
import { AdminCatalogTab } from '@/components/AdminCatalogTab';
import { DistributorUploadTab } from '@/components/DistributorUploadTab';
import { DistributorOrderWorkstation } from '@/components/DistributorOrderWorkstation';
import { LedgerAndRMATab } from '@/components/LedgerAndRMATab';
import { GSTInvoiceModal } from '@/components/GSTInvoiceModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { MasterProduct, Organization, CartItem, DistributorBatchListing, ProductCategory, DrugSchedule } from '@/types';
import { Pill, AlertCircle } from 'lucide-react';

export default function Home() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<ActiveTabType>('marketplace');
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
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);

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
    }, 150);
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
    <div className="min-h-screen bg-[#090D11] text-slate-100 flex flex-col font-sans selection:bg-[#00D2C4] selection:text-slate-950 pb-20">
      {/* Persistent Glanceable Header */}
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

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TAB 1: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div>
            <SearchHero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSchedule={selectedSchedule}
              setSelectedSchedule={setSelectedSchedule}
              totalProducts={products.length}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-8 h-8 border-2 border-[#00D2C4] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Querying canonical Master SKUs...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-[#12181F] rounded-2xl border border-[#1E2631]">
                  <Pill className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white">No products found</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Try searching for &quot;Paracetamol&quot; or clearing active schedule filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <ProductSearchCard
                      key={p.id}
                      product={p}
                      onOpenDistributors={(prod) => setCompareProduct(prod)}
                      onQuickAdd={handleQuickAdd}
                      currentOrg={currentOrg}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AUTO-REPLENISHMENT (THE TRIAGE & APPROVE DECK) */}
        {activeTab === 'replenish' && (
          <AutoReplenishDeck
            currentOrg={currentOrg}
            onPunchOrder={() => fetchProducts()}
          />
        )}

        {/* TAB 3: WORKSTATION */}
        {activeTab === 'orders' && (
          <DistributorOrderWorkstation
            currentOrg={currentOrg}
            distributors={organizations}
            onViewInvoice={(orderId) => setViewInvoiceId(orderId)}
          />
        )}

        {/* TAB 4: CREDIT LEDGER & CLAIMS */}
        {activeTab === 'ledger' && (
          <LedgerAndRMATab
            currentOrg={currentOrg}
            distributors={organizations}
            onViewInvoice={(orderId) => setViewInvoiceId(orderId)}
          />
        )}

        {/* TAB 5: STOCK UPLOAD */}
        {activeTab === 'distributor' && (
          <DistributorUploadTab
            currentOrg={currentOrg}
            distributors={organizations}
          />
        )}

        {/* TAB 6: MASTER SKU */}
        {activeTab === 'admin' && <AdminCatalogTab />}
      </main>

      {/* Footer */}
      <footer className="bg-[#090D11] border-t border-[#1E2631] py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">PharmaSync B2B</span>
            <span>•</span>
            <span>Telangana Pharmaceutical & Surgical Supply Chain</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-[#00D2C4] font-semibold">● Live Supabase DB</span>
            <span>•</span>
            <span>FEFO Stored Procedure Active</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Replenishment Footer */}
      <StickyReplenishmentFooter
        cart={cart}
        onOpenCart={() => setCartOpen(true)}
        onOpenReplenish={() => setActiveTab('replenish')}
      />

      {/* Zomato-Style Distributor Peek Sheet Bottom Drawer */}
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
          fetchProducts();
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

      {/* GST Tax Invoice Printable Modal */}
      <GSTInvoiceModal
        invoiceIdOrOrderId={viewInvoiceId}
        isOpen={Boolean(viewInvoiceId)}
        onClose={() => setViewInvoiceId(null)}
      />
    </div>
  );
}
