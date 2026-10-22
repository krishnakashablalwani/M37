SOFTWARE REQUIREMENTS DOCUMENT (SRD)

Pharmaceutical, Surgical & FMCG Ordering Application

Document purpose: To explain the business requirements, workflows, features and technical expectations to the app development company.

Proposed application type: B2B ordering and distribution management platform.

Business model: Retailers place orders for pharmaceutical products, surgical items and FMCG goods through the app. The system helps route orders to suitable distributors, manage stock, generate invoices and track deliveries.

---

1. OBJECTIVE OF THE APPLICATION

The objective is to develop a user-friendly mobile application, similar in convenience to Zomato, but designed specifically for the pharmaceutical, surgical and FMCG distribution business.

The application should connect:

1. Retailers, medical shops, surgical stores and FMCG retailers.
2. Distributors and stockists.
3. The application administrator and management team.

The system should reduce manual ordering, improve stock visibility, automate repeat orders and make the ordering and distribution process more efficient.

The application should support Android initially, with the option to expand to iOS and a web-based management portal.

2. USER ROLES

The application should have the following user roles.

2.1 Retailer

The retailer should be able to:

- Register and submit business details.
- Search for pharmaceutical, surgical and FMCG products.
- View product prices, available stock and applicable offers.
- Place orders with a preferred distributor or accept a system recommendation.
- Review automatically generated orders before confirmation.
- View invoices, outstanding payments and order history.
- Track order status and delivery.
- Contact the distributor.
- Request returns or report damaged, missing or incorrect goods.

2.2 Distributor

The distributor should be able to:

- Register and submit business and licence details, where applicable.
- Upload or update the product catalogue.
- Maintain stock quantities and batch details.
- Update prices, discounts and schemes.
- Receive and accept or reject orders.
- Generate invoices for accepted orders.
- Update dispatch and delivery status.
- Manage retailer accounts, payments and outstanding balances.
- View sales reports and order history.
- Handle eligible returns and credit notes.

2.3 Administrator

The administrator should have a central dashboard to:

- Approve retailers and distributors.
- Manage products, brands, categories and product codes.
- Configure distributor service areas and retailer assignments.
- Set order-generation rules.
- Monitor inventory, orders, invoices, payments and deliveries.
- Manage commissions or subscription plans, if applicable.
- View business performance and reports.
- Suspend or reactivate accounts.
- Maintain audit logs and resolve disputes.

2.4 Sales representative (optional module)

The application may also support sales representatives who visit retailers, record orders, assist with retailer onboarding and monitor sales targets.

3. AUTOMATIC ORDER GENERATION

This is one of the most important features of the application.

The system should analyse previous order or sales data and generate suggested replenishment orders automatically.

3.1 Basis for order generation

The administrator should be able to configure the order-generation rules using:

- Previous day's sales or orders.
- Sales over the last 7, 15 or 30 days.
- Current retailer stock, where stock data is available.
- Minimum and maximum stock levels.
- Average daily sales and expected demand.
- Existing pending orders.
- Minimum order quantities and distributor order limits.
- Product expiry dates and shelf-life requirements.

The system must distinguish between a retailer's previous orders and actual product sales. If actual sales data is unavailable, the system should use the available order history and clearly identify the estimate.

3.2 Automatic order calculation

The system should calculate a suggested quantity for each product.

For example:

Suggested quantity = Target stock − (Available stock + Confirmed incoming stock)

The suggested quantity should never be negative. The system should also consider pending orders, minimum order quantities and other configured restrictions.

3.3 Two order-generation modes

Mode A: Automatic distributor allocation

The system identifies a suitable distributor using:

- Retailer's preferred distributor.
- Product availability at the distributor's location.
- Price and applicable schemes.
- Delivery area and expected delivery time.
- Distributor service reliability.
- Minimum order value and delivery charges.

The system generates an order proposal for the selected distributor.

Mode B: Retailer-selected distributor

The retailer selects a distributor from the available options and confirms the order.

The system should display relevant information before confirmation, including product price, availability, applicable discounts, delivery charges and expected delivery time.

3.4 Important business rule

Automatic order generation must not automatically mean automatic order confirmation.

The administrator should be able to configure whether a retailer must approve suggested orders before submission. The distributor should receive an order only after the required confirmation process is completed.

4. DISTRIBUTOR SELECTION AND ORDER ROUTING

The application should provide intelligent distributor allocation.

When an order is generated, the system should check the selected distributor's available stock and ability to fulfil the order.

If the preferred distributor does not have sufficient stock, the system should:

1. Identify other eligible distributors.
2. Compare availability, price, delivery time and other configured rules.
3. Recommend an alternative distributor.
4. Inform the retailer if a change is required.
5. Split an order between distributors only if the retailer or configured business rules permit it.

The system should not silently change the distributor after an order is confirmed.

If the distributor cannot fulfil the order, the system should notify the retailer and provide an alternative or cancellation option.

5. PRODUCT SEARCH AND PRODUCT INFORMATION

The application should have a prominent product search bar.

Retailers should be able to search by:

- Product name.
- Brand or manufacturer.
- Generic name, where applicable.
- Product category.
- SKU or product code.
- Barcode, if supported.

Product details page

Each product should display the relevant information available for that product:

- Product name and brand.
- Product image.
- Product category.
- Pack size and unit of measurement.
- Manufacturer.
- Product code or SKU.
- Applicable batch and expiry details.
- Available quantity.
- Retailer purchase price.
- Applicable taxes, discounts and schemes.
- Minimum order quantity.
- Distributor name and contact details.
- Expected delivery information.

For pharmaceutical products, the system must support appropriate prescription, licence and sale restrictions. It must not treat all medicines as freely orderable products.

Distributor contact information

When the retailer searches for a product, the application should display the eligible distributors supplying it.

The retailer should be able to view the distributor's:

- Business name.
- Contact phone number.
- Service area.
- Applicable price and availability.
- Expected delivery time.

A call button may be provided to contact the distributor directly.

The system should display distributor contact information only to authorised users, according to the business's access rules.

6. ORDER PROCESSING AND INVOICING

Once the retailer confirms an order, the system should send it to the selected distributor.

Order workflow

1. Retailer creates or approves the order.
2. System validates product availability and order restrictions.
3. Distributor receives the order notification.
4. Distributor accepts, partially accepts or rejects the order.
5. Stock is reserved according to the configured rules.
6. Distributor prepares the goods.
7. Distributor generates the applicable invoice.
8. Goods are dispatched.
9. Retailer receives the goods and confirms delivery.
10. Order status and payment records are updated.

Invoicing requirements

The invoice should be generated by the distributor or its authorised billing system, not treated as an invoice issued by the platform itself.

The invoice should include the applicable:

- Invoice number and date.
- Seller and buyer details.
- GSTIN and other tax details, where required.
- Product description and quantity.
- Batch and expiry details, where applicable.
- Unit price, discounts and taxable value.
- GST and other applicable charges.
- Total invoice value.
- Payment terms.

The system should support invoice PDF downloads, printing and sharing.

It should also support credit notes, debit notes and cancellations where applicable.

7. INVENTORY MANAGEMENT

Every distributor should have an inventory management module.

Required features:

- Product-wise stock management.
- Batch-wise stock tracking for applicable products.
- Expiry-date tracking.
- Stock receipts and dispatches.
- Stock reservation against confirmed orders.
- Low-stock alerts.
- Near-expiry alerts.
- Damaged and expired stock records.
- Stock adjustments with an audit trail.
- Stock reconciliation.
- Import and export of stock data.

The system must avoid promising the same stock quantity to multiple retailers.

If a distributor's inventory changes, the availability shown to retailers should update promptly.

8. ORDER STATUS AND DELIVERY TRACKING

The retailer should be able to track every order using clear status updates.

Suggested statuses:

- Suggested order.
- Awaiting retailer approval.
- Order placed.
- Awaiting distributor confirmation.
- Accepted.
- Partially accepted.
- Processing.
- Packed.
- Dispatched.
- Out for delivery.
- Delivered.
- Cancelled.
- Return requested.
- Returned or partially returned.

The application should send notifications for important status changes.

Live GPS tracking may be considered as a later-stage feature. Initially, order status updates and estimated delivery information may be sufficient.

9. PAYMENT MANAGEMENT

The application should support configurable payment methods and terms.

Possible payment options include:

- Cash on delivery, if permitted by the business.
- UPI.
- Bank transfer.
- Payment gateway.
- Credit terms approved by the distributor.
- Recording of payments received outside the app.

The system should maintain:

- Invoice-wise outstanding amounts.
- Retailer payment history.
- Distributor receivables.
- Payment due dates.
- Overdue payment alerts.
- Receipts and payment references.
- Partial payments and credit adjustments.

The application should clearly distinguish between an order being delivered, an invoice being issued and payment being received.

10. RETURNS, REPLACEMENTS AND COMPLAINTS

The application should support returns for eligible reasons, such as:

- Damaged products.
- Incorrect products supplied.
- Short supply.
- Expiry or near-expiry issues, where return terms allow.
- Other distributor-approved reasons.

The retailer should be able to submit a return request with the relevant invoice, product, quantity, reason and supporting photographs.

The distributor should review the request and approve or reject it.

Approved returns should update inventory and financial records correctly, including applicable credit notes.

Returns of medicines must follow applicable legal requirements, product handling rules and the agreed commercial policy.

11. REPORTS AND ANALYTICS

The administrator, retailer and distributor should each have reports suited to their role.

Administrator reports

- Total orders and order value.
- Active retailers and distributors.
- Product-wise demand.
- Distributor-wise sales.
- Order fulfilment rate.
- Cancelled and rejected orders.
- Pending deliveries.
- Payment and outstanding summaries.
- Frequently ordered products.
- Sales trends by day, week and month.

Distributor reports

- Daily sales.
- Retailer-wise sales.
- Product-wise sales.
- Current stock and stock movement.
- Pending orders.
- Receivables and overdue payments.
- Returns and expiry-related losses.

Retailer reports

- Purchase history.
- Product-wise purchase quantities.
- Monthly purchase summary.
- Pending orders.
- Invoices and outstanding balances.
- Frequently purchased products.

Reports should be downloadable in Excel or PDF wherever practical.

12. USER INTERFACE AND APPLICATION EXPERIENCE

The application should offer a simple, fast and familiar shopping experience.

The interface may follow the ease of use of Zomato, while being designed for business-to-business transactions.

Suggested screens:

- Login and registration.
- Home dashboard.
- Product search.
- Product details.
- Distributor comparison.
- Cart and order confirmation.
- Order history.
- Order tracking.
- Invoices and payments.
- Returns and complaints.
- Profile and business information.
- Notifications.
- Customer support.

The application should be easy for retailers who are not highly familiar with technology.

Product search, repeat ordering and viewing previous purchases should require minimal steps.

13. PRODUCT CATALOGUE AND DATA IMPORT

The administrator and authorised distributors should be able to upload product and stock data in bulk using Excel or CSV files.

The application should support:

- Standard product codes and SKUs.
- Brand and category mapping.
- Unit and pack-size consistency.
- Price-list updates.
- Stock updates.
- Duplicate product detection.
- Error reports for failed uploads.
- Data validation before publishing.

A common product master should be maintained so that the same product is not incorrectly listed under multiple names by different distributors.

Distributor-specific prices, stock quantities and commercial terms should remain separate.

14. NOTIFICATIONS AND COMMUNICATION

The application should support notifications through in-app alerts and, where appropriate, SMS, WhatsApp or email integrations.

Notifications may cover:

- New order received.
- Order approval required.
- Order accepted or rejected.
- Product unavailable.
- Order dispatched.
- Delivery completed.
- Payment due.
- Payment received.
- Low stock.
- Near-expiry stock.
- Return request updates.

The developer should specify any third-party messaging charges separately.

15. LEGAL, SECURITY AND COMPLIANCE REQUIREMENTS

Since the application covers pharmaceuticals and surgical products, compliance should be built into the design from the beginning.

The system should support:

- Verification of relevant business licences and registrations.
- Appropriate controls for restricted products.
- Prescription-related workflows where required.
- Batch, expiry and traceability records.
- Role-based access permissions.
- Secure authentication and password recovery.
- Encryption of sensitive information.
- Audit logs for orders, inventory and financial changes.
- Data backup and recovery.
- Privacy notices and consent where applicable.
- Secure payment gateway integration.

Applicable Indian drug-sale, GST, data-protection and other requirements must be reviewed with qualified professionals before launch. The app must not permit products to be sold or distributed in ways prohibited by law.

16. TECHNICAL REQUIREMENTS

The developer should propose a reliable architecture that can grow as the number of retailers, distributors and products increases.

The solution should include:

- Android application.
- Web-based administrator dashboard.
- Distributor and retailer interfaces.
- Central backend and database.
- Secure APIs.
- Product search and filtering.
- Inventory and order-management engine.
- Invoice and report generation.
- Notification service.
- Backup and recovery facilities.

The system should provide a documented database structure, API documentation and source-code handover as agreed in the development contract.

The developer should specify hosting costs, maintenance costs, security arrangements, supported devices and expected performance.

17. PHASE-WISE DEVELOPMENT

To control initial investment, the application should be developed in phases.

Phase 1: Minimum Viable Product (MVP)

Essential features:

- Retailer and distributor registration.
- Product catalogue and search.
- Distributor-wise prices and availability.
- Manual order placement.
- Preferred distributor selection.
- Order acceptance and rejection.
- Basic stock management.
- Invoice upload or generation.
- Order status tracking.
- Administrator dashboard.
- Basic notifications and reports.

Phase 2: Automation

- Suggested orders based on sales and purchase history.
- Automatic distributor recommendations.
- Stock-based order allocation.
- Low-stock and near-expiry alerts.
- Bulk data imports.
- Payment and outstanding management.
- Returns and credit-note workflows.

Phase 3: Advanced features

- Predictive demand forecasting.
- Advanced distributor performance scoring.
- Sales representative management.
- Accounting software integration.
- ERP and distributor billing-system integration.
- Barcode scanning.
- Delivery route optimisation.
- Advanced analytics and business intelligence.

The exact phases should be finalised after understanding the business's existing processes and budget.

18. DELIVERABLES REQUIRED FROM THE DEVELOPER

The development company should provide:

1. Requirement analysis and final scope document.
2. UI/UX designs and screen prototypes.
3. Technical architecture and database design.
4. Android application.
5. Administrator dashboard.
6. Distributor and retailer modules.
7. Testing and bug-fixing.
8. Deployment and production setup.
9. Source code and agreed intellectual-property rights.
10. Documentation and administrator training.
11. Warranty and post-launch support.
12. Itemised development, hosting, maintenance and third-party service costs.

The contract should clearly state ownership of the source code, database, domain, cloud accounts and business data.

19. QUESTIONS TO BE FINALISED BEFORE DEVELOPMENT

The developer must not assume the answers to these questions.

1. Business coverage: Will the app operate within one city initially or across multiple states?
2. Customer type: Will only registered retailers and businesses be allowed to order, or will individual consumers also be allowed?
3. Order generation: Should suggested orders be based on previous-day sales, previous-day orders, or actual retailer inventory?
4. Distributor selection: Should the system choose the cheapest distributor, the preferred distributor, the distributor with the best availability, or a configurable combination?
5. Stock data: Will distributors update stock manually, upload Excel files or integrate existing billing software?
6. Pricing: Will each distributor set independent prices, or will the administrator control a common price list?
7. Payments: Will the app collect payments, or will retailers pay distributors directly?
8. Delivery: Will distributors deliver themselves, or will the platform manage a delivery network?
9. Revenue model: Will the platform charge a subscription, a transaction fee, a commission or another fee?
10. Existing systems: Is there any existing billing, accounting, inventory or ERP software that must be integrated?
11. Initial scale: How many retailers, distributors and products are expected at launch?
12. Budget and timeline: What are the maximum development budget and target launch date?

20. ACCEPTANCE CRITERIA

Before the project is considered complete, the developer should demonstrate that:

- A retailer can register, search products and place an order.
- The system displays distributor-specific prices and stock.
- Suggested orders follow the agreed calculation rules.
- The system prevents invalid quantities and inappropriate allocations.
- Distributors can accept, reject and fulfil orders.
- Stock updates correctly after configured reservation, dispatch and return events.
- Invoices and payment records reconcile correctly.
- Retailers can track orders and access their documents.
- Administrators can manage users, products and distributor assignments.
- Access permissions, backups and audit logs work as agreed.
- The application passes the agreed functional, security and performance tests.

FINAL EXPECTATION

I want a dependable B2B ordering platform for pharmaceutical, surgical and FMCG distribution. The system should simplify repeat ordering, improve product availability visibility, route orders intelligently, support distributor-level invoicing and provide complete operational control through a central dashboard.

The application should be developed with a modular architecture so that additional products, distributors, locations, integrations and automation features can be introduced without rebuilding the entire system.