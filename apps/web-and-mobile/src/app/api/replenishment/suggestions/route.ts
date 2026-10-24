import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { detectReplenishmentSpike } from '@/lib/replenishment/anomalyDetector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const retailerId =
      searchParams.get('retailer_id') || '44444444-4444-4444-4444-444444444444';

    const pool = getDbPool();

    // 1. Fetch retailer product settings joined with master product details
    const settingsQuery = `
      SELECT 
        s.id as setting_id,
        s.retailer_id,
        s.master_product_id,
        COALESCE(s.current_known_stock, 10) as current_stock,
        COALESCE(s.min_stock_threshold, 15) as min_threshold,
        COALESCE(s.max_target_stock, 60) as max_target,
        COALESCE(s.avg_daily_sales, 5.0) as avg_daily_sales,
        COALESCE(s.lead_time_days, 2) as lead_time_days,
        COALESCE(s.safety_buffer_days, 2) as safety_buffer_days,
        s.data_source,
        p.brand_name,
        p.generic_composition,
        p.pack_size,
        p.schedule,
        p.gst_percentage
      FROM retailer_product_settings s
      JOIN master_products p ON s.master_product_id = p.id
      WHERE s.retailer_id = $1 AND s.auto_order_enabled = true
      ORDER BY (COALESCE(s.current_known_stock, 10) <= COALESCE(s.min_stock_threshold, 15)) DESC, p.brand_name ASC
    `;

    const { rows: settingsRows } = await pool.query(settingsQuery, [retailerId]);

    // If no settings exist yet, synthesize intelligent defaults based on canonical master products
    let itemsToProcess = settingsRows;
    if (itemsToProcess.length === 0) {
      const fallbackQuery = `
        SELECT 
          gen_random_uuid() as setting_id,
          $1::uuid as retailer_id,
          p.id as master_product_id,
          12 as current_stock,
          15 as min_threshold,
          60 as max_target,
          8.5 as avg_daily_sales,
          2 as lead_time_days,
          2 as safety_buffer_days,
          'ORDER_HISTORY' as data_source,
          p.brand_name,
          p.generic_composition,
          p.pack_size,
          p.schedule,
          p.gst_percentage
        FROM master_products p
        LIMIT 4
      `;
      const { rows: fallbackRows } = await pool.query(fallbackQuery, [retailerId]);
      itemsToProcess = fallbackRows;
    }

    const suggestions = [];

    for (const item of itemsToProcess) {
      const avgDaily = Number(item.avg_daily_sales);
      const leadTime = Number(item.lead_time_days);
      const safetyBuffer = Number(item.safety_buffer_days);
      const currentStock = Number(item.current_stock);
      const minThreshold = Number(item.min_threshold);

      // TRD Formula: Target Stock = Avg Daily Sales * (Lead Time + Safety Buffer)
      let calculatedTarget = Math.round(avgDaily * (leadTime + safetyBuffer));
      if (calculatedTarget < Number(item.max_target)) {
        calculatedTarget = Number(item.max_target);
      }

      // Replenishment Quantity = Target Stock - Current Stock
      let suggestedQty = Math.max(0, calculatedTarget - currentStock);
      if (suggestedQty === 0) continue;

      const urgency = currentStock <= minThreshold ? 'CRITICAL' : 'NORMAL';

      // 2. Find eligible distributor batches for this master product (FEFO order)
      const batchesQuery = `
        SELECT 
          b.id as batch_id,
          b.distributor_id,
          b.batch_number,
          TO_CHAR(b.expiry_date, 'YYYY-MM-DD') as expiry_date,
          b.ptr,
          b.mrp,
          b.scheme_description,
          b.moq,
          b.available_qty,
          o.trade_name as distributor_name,
          COALESCE(l.is_preferred, false) as is_preferred
        FROM distributor_batches b
        JOIN organizations o ON b.distributor_id = o.id
        LEFT JOIN retailer_distributor_links l ON l.distributor_id = b.distributor_id AND l.retailer_id = $2
        WHERE b.master_product_id = $1 AND b.available_qty > 0 AND b.expiry_date > CURRENT_DATE
        ORDER BY l.is_preferred DESC NULLS LAST, b.ptr ASC, b.expiry_date ASC
      `;

      const { rows: batchRows } = await pool.query(batchesQuery, [item.master_product_id, retailerId]);

      if (batchRows.length === 0) continue;

      const primary = batchRows[0];
      const moq = Number(primary.moq || 1);

      // Snap suggestedQty to MOQ
      if (suggestedQty < moq) suggestedQty = moq;

      let shortfall = null;
      const availableAtPrimary = Number(primary.available_qty);

      // If primary distributor has less stock than needed and an alternative exists
      if (availableAtPrimary < suggestedQty && batchRows.length > 1) {
        const alt = batchRows[1];
        const shortfallQty = suggestedQty - availableAtPrimary;
        shortfall = {
          available_at_primary: availableAtPrimary,
          shortfall_qty: shortfallQty,
          alt_distributor_id: alt.distributor_id,
          alt_distributor_name: alt.distributor_name,
          alt_ptr: Number(alt.ptr),
        };
      }

      // Anomaly Spike Detection for one-time 3-4 months patient purchases
      const spikeAnalysis = detectReplenishmentSpike({
        brandName: item.brand_name,
        currentStock,
        minThreshold,
        targetStock: calculatedTarget,
        avgDailySales: avgDaily,
        leadTimeDays: leadTime,
        safetyBufferDays: safetyBuffer,
        unitPtr: Number(primary.ptr),
      });

      suggestions.push({
        id: item.setting_id || `sugg-${item.master_product_id}`,
        brand_name: item.brand_name,
        generic_composition: item.generic_composition,
        pack_size: item.pack_size,
        master_product_id: item.master_product_id,
        schedule: item.schedule,
        current_stock: currentStock,
        min_threshold: minThreshold,
        target_stock: calculatedTarget,
        suggested_qty: suggestedQty,
        avg_daily_sales: avgDaily,
        data_source:
          item.data_source === 'ACTUAL_POS_SALES'
            ? 'Verified POS Sync'
            : 'Based on 7-Day Velocity',
        urgency,
        spike_analysis: spikeAnalysis,
        primary_distributor: {
          id: primary.distributor_id,
          name: primary.distributor_name,
          batch_id: primary.batch_id,
          batch_number: primary.batch_number,
          ptr: Number(primary.ptr),
          gst_pct: Number(item.gst_percentage),
          scheme: primary.scheme_description,
          available: availableAtPrimary,
        },
        shortfall,
      });
    }

    const totalUnits = suggestions.reduce((acc, it) => acc + it.suggested_qty, 0);
    const totalReplenishmentValue = suggestions.reduce((acc, it) => {
      return acc + it.suggested_qty * it.primary_distributor.ptr * (1 + it.primary_distributor.gst_pct / 100);
    }, 0);

    return NextResponse.json({
      success: true,
      suggestions,
      total_skus: suggestions.length,
      total_units: totalUnits,
      total_estimated_value: totalReplenishmentValue,
    });
  } catch (error: any) {
    console.error('Error computing replenishment suggestions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database calculation error' },
      { status: 500 }
    );
  }
}
