/**
 * Client-Side Edge Brand & SKU Registry Cache
 * 
 * Solves:
 * - Eliminates redundant server queries for registered pharmaceutical Brand Names & SKUs.
 * - Stores brand parent-child SKU hierarchies (e.g. DOLO -> 650mg Tab, 325mg Tab, 125mg Tab, 125mg Syrup).
 * - Dynamically indexes brand names and SKUs as and when they are created or ordered.
 * - Sub-millisecond instant search and offline availability.
 */

export interface CachedSku {
  id: string;
  brandName: string;
  genericComposition?: string;
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Suspension' | 'Ointment' | 'Drops' | 'Other';
  strength: string; // e.g. "650mg", "325mg", "125mg/5ml"
  packSize: string; // e.g. "15 Tablets / Strip", "60ml Bottle"
  mrp: number;
  ptr: number;
  gstPct: number;
  hsnCode: string;
  schedule: string;
  registeredAt: string;
}

export interface CachedBrand {
  brandName: string;
  manufacturer: string;
  skus: CachedSku[];
  lastUsedAt: string;
}

const LOCAL_STORAGE_KEY = 'm37_brand_sku_registry_v1';

class BrandSkuCache {
  private cache: Map<string, CachedBrand> = new Map();
  private isLoaded = false;

  constructor() {
    this.initDefaultBrands();
  }

  private initDefaultBrands() {
    // Seed canonical Indian pharma brand families
    const seedBrands: CachedBrand[] = [
      {
        brandName: 'DOLO',
        manufacturer: 'Micro Labs Ltd',
        lastUsedAt: new Date().toISOString(),
        skus: [
          {
            id: 'sku-dolo-650',
            brandName: 'Dolo 650 Tablet',
            genericComposition: 'Paracetamol 650mg',
            form: 'Tablet',
            strength: '650mg',
            packSize: '15 Tablets / Strip',
            mrp: 34.15,
            ptr: 24.39,
            gstPct: 12,
            hsnCode: '30049060',
            schedule: 'SCHEDULE_H',
            registeredAt: '2026-01-01',
          },
          {
            id: 'sku-dolo-325',
            brandName: 'Dolo 325 Tablet',
            genericComposition: 'Paracetamol 325mg',
            form: 'Tablet',
            strength: '325mg',
            packSize: '15 Tablets / Strip',
            mrp: 22.5,
            ptr: 16.07,
            gstPct: 12,
            hsnCode: '30049060',
            schedule: 'SCHEDULE_H',
            registeredAt: '2026-01-01',
          },
          {
            id: 'sku-dolo-125-tab',
            brandName: 'Dolo 125 DT Tablet',
            genericComposition: 'Paracetamol 125mg Dispersible',
            form: 'Tablet',
            strength: '125mg DT',
            packSize: '10 Tablets / Strip',
            mrp: 18.0,
            ptr: 12.85,
            gstPct: 12,
            hsnCode: '30049060',
            schedule: 'SCHEDULE_H',
            registeredAt: '2026-01-01',
          },
          {
            id: 'sku-dolo-125-syr',
            brandName: 'Dolo 125 Oral Suspension / Syrup',
            genericComposition: 'Paracetamol 125mg/5ml',
            form: 'Syrup',
            strength: '125mg / 5ml',
            packSize: '60ml Bottle',
            mrp: 42.0,
            ptr: 30.0,
            gstPct: 12,
            hsnCode: '30049060',
            schedule: 'SCHEDULE_H',
            registeredAt: '2026-01-01',
          },
        ],
      },
      {
        brandName: 'AZITHRAL',
        manufacturer: 'Alembic Pharmaceuticals',
        lastUsedAt: new Date().toISOString(),
        skus: [
          {
            id: 'sku-azith-500',
            brandName: 'Azithral 500 Tablet',
            genericComposition: 'Azithromycin 500mg',
            form: 'Tablet',
            strength: '500mg',
            packSize: '5 Tablets / Strip',
            mrp: 125.0,
            ptr: 89.25,
            gstPct: 12,
            hsnCode: '30042000',
            schedule: 'SCHEDULE_H1',
            registeredAt: '2026-01-01',
          },
          {
            id: 'sku-azith-250',
            brandName: 'Azithral 250 Tablet',
            genericComposition: 'Azithromycin 250mg',
            form: 'Tablet',
            strength: '250mg',
            packSize: '6 Tablets / Strip',
            mrp: 75.0,
            ptr: 53.5,
            gstPct: 12,
            hsnCode: '30042000',
            schedule: 'SCHEDULE_H1',
            registeredAt: '2026-01-01',
          },
          {
            id: 'sku-azith-syr',
            brandName: 'Azithral 100 Oral Liquid',
            genericComposition: 'Azithromycin 100mg/5ml',
            form: 'Syrup',
            strength: '100mg / 5ml',
            packSize: '15ml Bottle',
            mrp: 55.0,
            ptr: 39.2,
            gstPct: 12,
            hsnCode: '30042000',
            schedule: 'SCHEDULE_H1',
            registeredAt: '2026-01-01',
          },
        ],
      },
      {
        brandName: 'PAN',
        manufacturer: 'Alkem Laboratories',
        lastUsedAt: new Date().toISOString(),
        skus: [
          {
            id: 'sku-pan-40',
            brandName: 'Pan 40 Tablet',
            genericComposition: 'Pantoprazole 40mg',
            form: 'Tablet',
            strength: '40mg',
            packSize: '15 Tablets / Strip',
            mrp: 155.0,
            ptr: 110.7,
            gstPct: 12,
            hsnCode: '30049099',
            schedule: 'SCHEDULE_H',
            registeredAt: '2026-01-01',
          },
          {
            id: 'sku-pan-d',
            brandName: 'Pan-D Capsule',
            genericComposition: 'Pantoprazole 40mg + Domperidone 30mg',
            form: 'Capsule',
            strength: '40mg + 30mg SR',
            packSize: '15 Capsules / Strip',
            mrp: 199.0,
            ptr: 142.1,
            gstPct: 12,
            hsnCode: '30049099',
            schedule: 'SCHEDULE_H',
            registeredAt: '2026-01-01',
          },
        ],
      },
    ];

    seedBrands.forEach((b) => this.cache.set(b.brandName.toUpperCase(), b));
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || this.isLoaded) return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: CachedBrand[] = JSON.parse(stored);
        parsed.forEach((b) => this.cache.set(b.brandName.toUpperCase(), b));
      }
      this.isLoaded = true;
    } catch (e) {
      console.warn('Could not load brand cache from localStorage', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const arrayData = Array.from(this.cache.values());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arrayData));
    } catch (e) {
      console.warn('Could not persist brand cache to localStorage', e);
    }
  }

  /**
   * Registers a brand or SKU dynamically as and when created or ordered
   */
  public registerSku(sku: CachedSku, manufacturer: string = 'Registered Pharma Mfr') {
    this.loadFromStorage();
    const primaryWord = sku.brandName.split(' ')[0].toUpperCase();
    const existing = this.cache.get(primaryWord) || {
      brandName: primaryWord,
      manufacturer,
      skus: [],
      lastUsedAt: new Date().toISOString(),
    };

    const existingSkuIndex = existing.skus.findIndex((s) => s.id === sku.id || s.brandName.toLowerCase() === sku.brandName.toLowerCase());
    if (existingSkuIndex > -1) {
      existing.skus[existingSkuIndex] = sku;
    } else {
      existing.skus.push(sku);
    }
    existing.lastUsedAt = new Date().toISOString();

    this.cache.set(primaryWord, existing);
    this.saveToStorage();
  }

  /**
   * Instant offline search across brands and SKUs (zero network latency)
   */
  public searchLocal(query: string): { brand: CachedBrand; matchedSkus: CachedSku[] }[] {
    this.loadFromStorage();
    const q = query.trim().toUpperCase();
    if (!q) {
      return Array.from(this.cache.values()).map((brand) => ({
        brand,
        matchedSkus: brand.skus,
      }));
    }

    const results: { brand: CachedBrand; matchedSkus: CachedSku[] }[] = [];

    for (const [key, brand] of this.cache.entries()) {
      const brandMatches = key.includes(q) || brand.manufacturer.toUpperCase().includes(q);
      const matchedSkus = brand.skus.filter(
        (sku) =>
          sku.brandName.toUpperCase().includes(q) ||
          sku.strength.toUpperCase().includes(q) ||
          (sku.genericComposition && sku.genericComposition.toUpperCase().includes(q))
      );

      if (brandMatches || matchedSkus.length > 0) {
        results.push({
          brand,
          matchedSkus: matchedSkus.length > 0 ? matchedSkus : brand.skus,
        });
      }
    }

    return results;
  }

  public getAllBrands(): CachedBrand[] {
    this.loadFromStorage();
    return Array.from(this.cache.values());
  }
}

// Export singleton instance
export const brandSkuCache = new BrandSkuCache();
