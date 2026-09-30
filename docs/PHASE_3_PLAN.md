# PHASE 3: ASSETS + MAINTENANCE PLAN

## Goal
Implement Cluster 14, 15, 16, 17, and 18 for Asset Tracking, Maintenance, and Inventory.

## Step 1: Database Schema Expansion
Add the following models to Prisma:
- `Asset`: Physical infrastructure tracking (QR Codes, warranty, location, etc.)
- `AssetMaintenance`: Maintenance logs (preventive/corrective), tracking technician and cost.
- `InventoryItem`: Spare parts stock tracking (SKU, quantity, low stock alerts).
- `MaintenancePart`: Join table tracking which spare parts were used in which maintenance job.
Update `Complaint` model to link complaints directly to assets (`assetId`).

## Step 2: Backend Implementation
- `assetService.ts` / `assetRoutes.ts` / `assetController.ts`: CRUD for assets and maintenance history.
- `inventoryService.ts`: CRUD for spare parts, triggering low-stock logic.
- Update AI / Complaint logic: If a complaint is scanned via QR, link it to the asset automatically.

## Step 3: Frontend Implementation (Admin/Technician UI)
- `AdminAssetsPage.tsx`: Data table for tracking campus assets and health.
- `AssetDetailsModal.tsx`: Shows maintenance history, linked complaints, and QR code representation.
- `InventoryPage.tsx`: Tracks spare parts and highlights low stock.

## Step 4: Testing & Verification
- Test creating assets and parts.
- Test logging a preventive maintenance task.
- Test linking a complaint to an asset ID.
