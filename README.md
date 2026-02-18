# eThekwini Property Research System

A comprehensive property research application for Durban/eThekwini that queries multiple GIS data sources to generate property development feasibility reports.

## Features

- **Real Property Data** from Chief Surveyor General (CSG) and eThekwini Approved Parcels
- **Zoning Analysis** with coverage, FAR, and height restrictions for 100+ schemes
- **Real-time SSE Streaming** of research progress
- **Flood Risk Assessment** (100-year flood zones)
- **Intelligent Area Selection** - prioritizes accurate parcel sizes

## Data Sources

| Source | Data | Coverage |
|--------|------|----------|
| CSG Cadastral | Parcel area, ERF number, SG code | National |
| ArcGIS Online Zoning | Zone type, scheme, coverage, FAR, height | BEREA NORTH, BEREA SOUTH, UMHLANGA, CENTRAL, ROC-NORTH, + 100 more |
| Approved Parcels | Area, status, suburb | eThekwini |
| Building Footprints | Existing structures | eThekwini |

## Test Results

| Address | Site Area | Zoning | Coverage | FAR |
|---------|-----------|--------|----------|-----|
| 12 Windermere Road, Morningside | 587 sqm | General Residential 2 | 55% | 1.0 |
| 100 Stephen Dlamini Road | 1,988 sqm | Special Residential 900 | 40% | 0.5 |
| Florida Road, Berea | 348 sqm | General Residential 2 | 55% | 1.0 |

## Installation

```bash
# 1. Extract ZIP
unzip ethekwini-property-research-system-v2.zip

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env

# 4. Run development server
bun run dev

# 5. Open browser
http://localhost:3000
```

## Test Endpoint

Test data retrieval directly:
```
GET /api/test-data?address=85 Florida Road, Durban
```

## Key Fixes in v2

1. **Zoning Buffer Query** - Uses 30m distance buffer to handle road centerline geocoding
2. **Smallest Parcel Selection** - Selects smallest valid parcel from CSG results
3. **Intelligent Area Validation** - Uses 200-50,000 sqm as valid urban parcel range
4. **Expanded Zoning Definitions** - Added 30+ zone types including Special Residential, General Business-Central Area

## Zoning Schemes Available

- BEREA NORTH
- BEREA SOUTH  
- UMHLANGA
- CENTRAL (CBD)
- ROC-NORTH
- CATO MANOR
- BLUFF
- CHATSWORTH
- + 90 more schemes

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Backend**: Next.js API Routes, Server-Sent Events
- **AI**: z-ai-web-dev-sdk for analysis

## License

Proprietary - All rights reserved
