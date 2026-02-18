# eThekwini Property Research System

A comprehensive property research application for Durban/eThekwini that queries multiple GIS data sources to generate property development feasibility reports.

## Features

- **25+ Data Agents** querying multiple GIS sources
- **Real-time SSE Streaming** of research progress
- **Zoning Analysis** with coverage, FAR, and height restrictions
- **Cadastral Data** from Chief Surveyor General
- **Flood Risk Assessment** (100-year flood zones)
- **Environmental Constraints** (conservation, wetlands, coastal)
- **Utility Infrastructure** (water, sewer, electricity)
- **AI-Powered Analysis** and recommendations

## Data Sources

| Source | Coverage | Data |
|--------|----------|------|
| ArcGIS Online | BEREA SOUTH, ROC-NORTH schemes | Zoning, Parcels, Buildings |
| CSG (Chief Surveyor General) | National | Cadastral, SG Diagrams |
| eThekwini GIS | Municipal | Extended zoning (requires internal access) |

## Installation

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL (for auth features)

### Quick Start

```bash
# 1. Extract the ZIP file
unzip ethekwini-property-research-system.zip

# 2. Navigate to project
cd ethekwini-property-research-system

# 3. Install dependencies
bun install
# OR
npm install

# 4. Create .env file
cp .env.example .env
# Edit .env with your settings

# 5. Run database migrations (if using auth)
bunx prisma migrate dev

# 6. Start development server
bun run dev
# OR
npm run dev

# 7. Open in browser
http://localhost:3000
```

### Environment Variables

```env
# Database (optional - for auth features)
DATABASE_URL="postgresql://user:password@localhost:5432/ethekwini"

# NextAuth (optional - for auth features)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main UI
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Styles
│   │   └── api/
│   │       └── research/
│   │           └── route.ts  # SSE Research API
│   ├── lib/
│   │   ├── agents.ts         # All data agents & API config
│   │   ├── utils.ts          # Utilities
│   │   └── db.ts             # Database client
│   ├── components/ui/        # shadcn/ui components
│   └── hooks/                # React hooks
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/research` | POST | Start property research (SSE stream) |

### Research API Example

```javascript
const response = await fetch('/api/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '85 Florida Road, Durban' })
});

// Read SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const events = text.split('\n\n')
    .filter(e => e.startsWith('data: '))
    .map(e => JSON.parse(e.replace('data: ', '')));
  
  events.forEach(event => {
    console.log(event.type, event.data);
  });
}
```

## Zoning Schemes Supported

| Scheme | Coverage | Source |
|--------|----------|--------|
| BEREA SOUTH | Southern Durban | ArcGIS Online |
| ROC-NORTH | Northern Durban | ArcGIS Online |
| Other schemes | Limited | eThekwini GIS (internal) |

## Known Limitations

1. **Obliviewer** (gis.durban.gov.za/obliviewer) - Requires eThekwini internal network
2. **eThekwini GIS** - Some endpoints may require VPN/internal access
3. **Zoning** - Only BEREA SOUTH and ROC-NORTH schemes publicly available

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Backend**: Next.js API Routes, Server-Sent Events
- **Database**: Prisma ORM, PostgreSQL (optional)
- **AI**: z-ai-web-dev-sdk for analysis

## License

Proprietary - All rights reserved

## Support

For issues with data sources or API access, contact eThekwini Municipality GIS Department.
