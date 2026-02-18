import ZAI from 'z-ai-web-dev-sdk';

// =============================================================================
// ETHEKWINI PROPERTY ANALYSIS - PRODUCTION API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  // Geocoding - OpenStreetMap Nominatim
  NOMINATIM: 'https://nominatim.openstreetmap.org/search',
  
  // Chief Surveyor General - National Cadastral (WGS84)
  CSG: {
    ERVEN: 'https://csggis.drdlr.gov.za/server/rest/services/Property_Viewer/MapServer/2/query',
    FARM_PORTION: 'https://csggis.drdlr.gov.za/server/rest/services/Property_Viewer/MapServer/3/query',
    VIEWER: 'https://csggis.drdlr.gov.za/psv/',
  },
  
  // ArcGIS Online - eThekwini Open Data
  // Coordinate System Notes:
  // - Most layers: South Africa WG31 (local projected)
  // - Use inSR=4326 for WGS84 lat/lon input
  // - Use outSR=4326 for WGS84 output
  ARCGIS_ONLINE: {
    // Zoning - Only covers BEREA SOUTH and ROC - NORTH schemes
    ZONING: 'https://services3.arcgis.com/HO0zfySJshlD6Twu/arcgis/rest/services/Zoning/FeatureServer/0/query',
    // Approved Parcels - Layer 5 (CRITICAL!)
    APPROVED_PARCELS: 'https://services3.arcgis.com/HO0zfySJshlD6Twu/arcgis/rest/services/Approved_Parcels/FeatureServer/5/query',
    // Building Footprints
    BUILDING_FOOTPRINTS: 'https://services3.arcgis.com/HO0zfySJshlD6Twu/arcgis/rest/services/Building_Footprints/FeatureServer/0/query',
    // Roads
    ROADS: 'https://services3.arcgis.com/HO0zfySJshlD6Twu/arcgis/rest/services/Roads/FeatureServer/0/query',
    // Suburbs - Just names, no population
    SUBURBS: 'https://services3.arcgis.com/HO0zfySJshlD6Twu/arcgis/rest/services/Suburbs/FeatureServer/0/query',
    // Flood Plain - 100 year
    FLOOD_PLAIN: 'https://services3.arcgis.com/HO0zfySJshlD6Twu/arcgis/rest/services/Flood_Plain_100yr/FeatureServer/0/query',
  },
  
  BOUNDS: { MIN_LAT: -30.25, MAX_LAT: -29.45, MIN_LON: 30.70, MAX_LON: 31.25 },
  TIMEOUT: 30000,
  USER_AGENT: 'EthekwiniPropertyAgent/3.0',
};

// Zoning Definitions
export const ZONING_DEFINITIONS: Record<string, { description: string; coverage: number; far: number; height: number; uses: string[]; density: string; }> = {
  'IPTN Residential': { description: 'Integrated Planning Residential - Medium density', coverage: 60, far: 1.2, height: 3, uses: ['Dwelling', 'Townhouses', 'Home office'], density: '20-40/ha' },
  'IPTN Business': { description: 'Integrated Planning Business - Mixed use', coverage: 80, far: 2.0, height: 5, uses: ['Retail', 'Offices', 'Residential'], density: 'Commercial' },
  'General Residential 1': { description: 'Low density residential', coverage: 50, far: 0.8, height: 2, uses: ['Dwelling house'], density: '1/erf' },
  'General Residential 2': { description: 'Low-medium density', coverage: 55, far: 1.0, height: 2, uses: ['Dwelling', 'Second dwelling'], density: '1-2/erf' },
  'General Residential 3': { description: 'Medium density', coverage: 60, far: 1.4, height: 3, uses: ['Townhouses', 'Flats'], density: '20-40/ha' },
  'Special Residential': { description: 'Site-specific density', coverage: 50, far: 1.0, height: 2, uses: ['Dwelling'], density: 'As specified' },
  'Business 1': { description: 'General business', coverage: 70, far: 2.0, height: 4, uses: ['Retail', 'Offices'], density: 'Commercial' },
  'Business 2': { description: 'Mixed use business', coverage: 65, far: 1.8, height: 4, uses: ['Retail', 'Residential'], density: 'Mixed' },
  'Industrial 1': { description: 'Light industrial', coverage: 75, far: 1.5, height: 3, uses: ['Manufacturing', 'Warehouse'], density: 'Industrial' },
  'Existing Street Reservation': { description: 'Road reserve - No development', coverage: 0, far: 0, height: 0, uses: ['Roads only'], density: 'None' },
  'Open Space': { description: 'Parks and recreation', coverage: 5, far: 0.05, height: 1, uses: ['Parks', 'Sports'], density: 'Open' },
  'Public Open Space Reservation': { description: 'Public open space', coverage: 5, far: 0.05, height: 1, uses: ['Public park'], density: 'Open' },
  'Market Reservation': { description: 'Market area', coverage: 60, far: 1.0, height: 2, uses: ['Market'], density: 'Special' },
  'Agricultural': { description: 'Agricultural land', coverage: 5, far: 0.1, height: 2, uses: ['Farming'], density: 'Agricultural' },
  'Undetermined': { description: 'No formal zoning - verify with municipality', coverage: 40, far: 0.5, height: 2, uses: ['Verify'], density: 'Unknown' },
};

// Agent definitions
export const AGENTS = [
  { id: 'coordinator', name: 'Coordinator', role: 'Orchestrator', color: '#8B5CF6', icon: 'Network' },
  { id: 'geocoder', name: 'Location', role: 'Geocoding', color: '#10B981', icon: 'MapPin' },
  { id: 'cadastral', name: 'CSG Cadastral', role: 'Parcel Data', color: '#F59E0B', icon: 'FileText' },
  { id: 'approved_parcels', name: 'Approved Parcels', role: 'Verification', color: '#84CC16', icon: 'CheckCircle' },
  { id: 'zoning', name: 'Zoning', role: 'Planning', color: '#3B82F6', icon: 'Layers' },
  { id: 'buildings', name: 'Buildings', role: 'Structures', color: '#14B8A6', icon: 'Building' },
  { id: 'sg_diagram', name: 'SG Diagram', role: 'Survey', color: '#EF4444', icon: 'FileSearch' },
  { id: 'flood', name: 'Flood Risk', role: 'Risk Analysis', color: '#F97316', icon: 'AlertTriangle' },
  { id: 'roads', name: 'Roads', role: 'Infrastructure', color: '#6366F1', icon: 'Route' },
  { id: 'suburb', name: 'Suburb', role: 'Area Data', color: '#EC4899', icon: 'BarChart3' },
];

// Types
export interface PropertyReport { success: boolean; report_id: string; address_input: string; timestamp: string; location?: LocationData; cadastral?: CadastralData; approved_parcels?: ApprovedParcelData; zoning?: ZoningData; buildings?: BuildingData[]; sg_diagram?: SGDiagramData; flood_risk?: FloodData; roads?: RoadData[]; suburb?: SuburbData; development_rights?: DevelopmentRights; feasibility?: FeasibilityData; requirements?: RequirementsData; costs?: CostsData; recommendations?: string[]; summary?: SummaryData; error?: string; }
export interface LocationData { display_name: string; lat: number; lon: number; suburb?: string; city: string; province: string; country: string; }
export interface CadastralData { source: string; erf_number?: string; township?: string; farm_name?: string; portion?: string; extent_sqm?: number; sg_code?: string; parcel_key?: string; legal_status?: string; attributes: Record<string, unknown>; }
export interface ApprovedParcelData { source: string; status?: string; erf_number?: string; township?: string; suburb?: string; street_number?: string; street_name?: string; property_id?: string; area_ha?: number; area_sqm?: number; attributes: Record<string, unknown>; }
export interface ZoningData { source: string; zone_code?: string; zone_description?: string; scheme_name?: string; region?: string; permitted_uses?: string[]; coverage_percent?: number; far?: number; height_storeys?: number; density?: string; attributes: Record<string, unknown>; }
export interface BuildingData { class: string; year?: number; roof_area_sqm?: number; attributes: Record<string, unknown>; }
export interface SGDiagramData { sg_number: string; sg_code?: string; download_link: string; farm_name?: string; erf?: string; township?: string; portion?: string; extent_ha?: number; }
export interface FloodData { in_flood_zone: boolean; zone_type?: string; risk_level: string; attributes: Record<string, unknown>; }
export interface RoadData { name?: string; type?: string; attributes: Record<string, unknown>; }
export interface SuburbData { suburb_name?: string; attributes: Record<string, unknown>; }
export interface DevelopmentRights { site_area_sqm: number; max_coverage_sqm: number; max_floor_area_sqm: number; max_height_storeys: number; coverage_percent: number; floor_area_ratio: number; parking_bays_required?: number; }
export interface FeasibilityData { score: number; rating: string; verdict: string; issues: string[]; opportunities: string[]; }
export interface RequirementsData { documents: string[]; process_steps: string[]; timeline_weeks: string; municipal_contact: string; }
export interface CostsData { professional_fees_low: number; professional_fees_high: number; municipal_fees_low: number; municipal_fees_high: number; construction_low: number; construction_high: number; total_timeline_weeks: string; }
export interface SummaryData { score: number; rating: string; verdict: string; key_findings: string[]; ai_analysis?: string; }
export interface SSEEvent { type: 'agent:start' | 'agent:search' | 'agent:finding' | 'agent:complete' | 'report:section' | 'done' | 'error'; data: Record<string, unknown>; }
export function formatSSE(event: SSEEvent): string { return `data: ${JSON.stringify(event)}\n\n`; }

// =============================================================================
// API HELPERS
// =============================================================================

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function arcgisQuery(url: string, params: Record<string, string>): Promise<{ data: unknown; error: string | null }> {
  const finalParams = { ...params, inSR: params.inSR || '4326', outSR: params.outSR || '4326', f: 'json' };
  const fullUrl = `${url}?${new URLSearchParams(finalParams).toString()}`;
  try {
    const response = await fetchWithTimeout(fullUrl, { method: 'GET', headers: { 'User-Agent': API_CONFIG.USER_AGENT } }, API_CONFIG.TIMEOUT);
    if (!response.ok) return { data: null, error: `HTTP ${response.status}` };
    const data = await response.json();
    if (data.error) return { data: null, error: data.error.message || 'ArcGIS error' };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// =============================================================================
// AGENT FUNCTIONS
// =============================================================================

export async function geocodeAddress(address: string): Promise<{ location: LocationData | null; error: string | null }> {
  const url = `${API_CONFIG.NOMINATIM}?${new URLSearchParams({ format: 'json', q: `${address}, Durban, South Africa`, limit: '1', addressdetails: '1' }).toString()}`;
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', headers: { 'User-Agent': API_CONFIG.USER_AGENT } }, API_CONFIG.TIMEOUT);
    if (!response.ok) return { location: null, error: `HTTP ${response.status}` };
    const data = await response.json();
    if (!data?.length) return { location: null, error: 'Address not found' };
    const r = data[0], lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    if (lat < API_CONFIG.BOUNDS.MIN_LAT || lat > API_CONFIG.BOUNDS.MAX_LAT || lon < API_CONFIG.BOUNDS.MIN_LON || lon > API_CONFIG.BOUNDS.MAX_LON) return { location: null, error: 'Outside eThekwini' };
    const a = r.address || {};
    return { location: { display_name: r.display_name, lat, lon, suburb: a.suburb || a.city_district || 'Unknown', city: a.city || 'Durban', province: a.state || 'KZN', country: a.country || 'SA' }, error: null };
  } catch (e) { return { location: null, error: e instanceof Error ? e.message : 'Failed' }; }
}

export async function queryCSGParcel(lon: number, lat: number): Promise<{ data: CadastralData | null; error: string | null }> {
  const params = { geometry: `${lon},${lat}`, outFields: 'PARCEL_NO,SS_NAME,FARM_NAME,PORTION,PRCL_KEY,PRCL_TYPE,LSTATUS,PROVINCE,GEOM_AREA' };
  let result = await arcgisQuery(API_CONFIG.CSG.ERVEN, params);
  if (result.error || !result.data) {
    result = await arcgisQuery(API_CONFIG.CSG.FARM_PORTION, params);
    if (result.data) {
      const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
      if (d.features?.length) { 
        const a = d.features[0].attributes || {}; 
        const area = a.GEOM_AREA as number;
        // Limit reported area to reasonable urban parcel size (max 10,000 sqm for display)
        const displayArea = area > 100000 ? undefined : area;
        return { data: { source: 'CSG Farm', farm_name: a.FARM_NAME as string, portion: a.PORTION?.toString(), extent_sqm: displayArea, sg_code: a.PRCL_KEY as string, parcel_key: a.PRCL_KEY as string, legal_status: a.LSTATUS === 'S' ? 'Registered' : 'Unregistered', attributes: a }, error: null }; 
      }
    }
    return { data: null, error: result.error || 'Not found' };
  }
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  if (!d.features?.length) return { data: null, error: 'Not in CSG' };
  const a = d.features[0].attributes || {};
  const area = a.GEOM_AREA as number;
  // Limit to reasonable urban parcel size
  const displayArea = area > 100000 ? undefined : area;
  return { data: { source: 'Chief Surveyor General', erf_number: a.PARCEL_NO?.toString(), township: (a.SS_NAME as string)?.trim() || undefined, farm_name: a.FARM_NAME as string, portion: a.PORTION?.toString(), extent_sqm: displayArea, sg_code: a.PRCL_KEY as string, parcel_key: a.PRCL_KEY as string, legal_status: a.LSTATUS === 'S' ? 'Registered' : a.LSTATUS === 'R' ? 'Registered' : 'Unregistered', attributes: a }, error: null };
}

export async function queryApprovedParcels(lon: number, lat: number): Promise<{ data: ApprovedParcelData | null; error: string | null }> {
  const params = { geometry: `${lon},${lat}`, outFields: 'ERF,PORTION,FARMTOWNNA,SUBURB,STRNUM,STRNAME,STRTYPE,AREASG,STATUS,DOCREF,PROPERTYID' };
  const result = await arcgisQuery(API_CONFIG.ARCGIS_ONLINE.APPROVED_PARCELS, params);
  if (result.error || !result.data) return { data: null, error: result.error };
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  if (!d.features?.length) return { data: null, error: 'Not found' };
  const a = d.features[0].attributes || {};
  // AREASG is in hectares - convert to sqm (1 ha = 10,000 sqm)
  const areaHa = a.AREASG as number;
  const areaSqm = areaHa ? Math.round(areaHa * 10000) : undefined;
  return { data: { source: 'eThekwini Approved Parcels', status: a.STATUS as string, erf_number: a.ERF as string, township: a.FARMTOWNNA as string, suburb: a.SUBURB as string, street_number: a.STRNUM as string, street_name: `${a.STRNAME || ''} ${a.STRTYPE || ''}`.trim(), property_id: a.PROPERTYID as string, area_ha: areaHa, area_sqm: areaSqm, attributes: a }, error: null };
}

export async function queryZoning(lon: number, lat: number): Promise<{ data: ZoningData | null; error: string | null }> {
  // Note: Only covers BEREA SOUTH and ROC - NORTH schemes
  const params = { geometry: `${lon},${lat}`, outFields: 'ZONING,REGION,SCHEMENAME,REZONEFROM,AMENDDATE,APPROVDATE,SPZONECODE,NOTES' };
  const result = await arcgisQuery(API_CONFIG.ARCGIS_ONLINE.ZONING, params);
  if (result.error || !result.data) return { data: null, error: result.error };
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  if (!d.features?.length) return { data: null, error: 'Not in scheme area' };
  const a = d.features[0].attributes || {};
  const name = a.ZONING as string || 'Undetermined';
  const def = ZONING_DEFINITIONS[name] || ZONING_DEFINITIONS['Undetermined'];
  return { data: { source: 'eThekwini Town Planning', zone_code: a.SPZONECODE as string || name, zone_description: def.description, scheme_name: a.SCHEMENAME as string, region: a.REGION as string, permitted_uses: def.uses, coverage_percent: def.coverage, far: def.far, height_storeys: def.height, density: def.density, attributes: a }, error: null };
}

export async function queryBuildings(lon: number, lat: number): Promise<{ data: BuildingData[] | null; error: string | null }> {
  const b = 0.0005;
  const params = { geometry: `${lon-b},${lat-b},${lon+b},${lat+b}`, geometryType: 'esriGeometryEnvelope', outFields: 'Class,SYear,RoofArea' };
  const result = await arcgisQuery(API_CONFIG.ARCGIS_ONLINE.BUILDING_FOOTPRINTS, params);
  if (result.error || !result.data) return { data: null, error: result.error };
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  if (!d.features?.length) return { data: [], error: null };
  return { data: d.features.slice(0, 5).filter(f => f.attributes?.Class && typeof f.attributes.Class === 'string' && (f.attributes.Class as string).trim()).map(f => ({ class: (f.attributes?.Class as string) || 'Unknown', year: f.attributes?.SYear as number, roof_area_sqm: f.attributes?.RoofArea as number, attributes: f.attributes || {} })), error: null };
}

export async function queryFloodRisk(lon: number, lat: number): Promise<{ data: FloodData | null; error: string | null }> {
  const params = { geometry: `${lon},${lat}`, outFields: '*' };
  const result = await arcgisQuery(API_CONFIG.ARCGIS_ONLINE.FLOOD_PLAIN, params);
  if (result.error || !result.data) return { data: { in_flood_zone: false, risk_level: 'Unknown', attributes: {} }, error: null };
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  const inZone = (d.features?.length ?? 0) > 0;
  return { data: { in_flood_zone: inZone, zone_type: inZone ? (d.features![0].attributes?.TYPE as string) : undefined, risk_level: inZone ? 'High - 100yr flood plain' : 'Low - Outside flood zone', attributes: inZone ? d.features![0].attributes! : {} }, error: null };
}

export async function queryRoads(lon: number, lat: number): Promise<{ data: RoadData[] | null; error: string | null }> {
  const b = 0.002;
  const params = { geometry: `${lon-b},${lat-b},${lon+b},${lat+b}`, geometryType: 'esriGeometryEnvelope', outFields: 'NAME,TYPE,SURFACE' };
  const result = await arcgisQuery(API_CONFIG.ARCGIS_ONLINE.ROADS, params);
  if (result.error || !result.data) return { data: null, error: result.error };
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  if (!d.features?.length) return { data: [], error: null };
  return { data: d.features.slice(0, 5).map(f => ({ name: (f.attributes?.NAME as string), type: f.attributes?.TYPE as string, attributes: f.attributes || {} })), error: null };
}

export async function querySuburb(lon: number, lat: number): Promise<{ data: SuburbData | null; error: string | null }> {
  const params = { geometry: `${lon},${lat}`, outFields: 'SUBURB,DISTRICT' };
  const result = await arcgisQuery(API_CONFIG.ARCGIS_ONLINE.SUBURBS, params);
  if (result.error || !result.data) return { data: null, error: result.error };
  const d = result.data as { features?: Array<{ attributes?: Record<string, unknown> }> };
  if (!d.features?.length) return { data: null, error: 'Not found' };
  const a = d.features[0].attributes || {};
  return { data: { suburb_name: a.SUBURB as string, attributes: a }, error: null };
}

export async function querySGDiagram(lon: number, lat: number): Promise<{ data: SGDiagramData | null; error: string | null }> {
  const p = await queryCSGParcel(lon, lat);
  if (p.data?.sg_code) {
    const c = p.data.sg_code;
    return { data: { sg_number: `SG ${c.substring(0, 20)}`, sg_code: c, download_link: `${API_CONFIG.CSG.VIEWER}?prclkey=${c}`, farm_name: p.data.farm_name, erf: p.data.erf_number, township: p.data.township, portion: p.data.portion, extent_ha: p.data.extent_sqm ? p.data.extent_sqm / 10000 : undefined }, error: null };
  }
  return { data: null, error: 'SG not available' };
}

// =============================================================================
// ANALYSIS
// =============================================================================

export function calculateDevelopmentRights(
  cadastral: CadastralData | null, 
  zoning: ZoningData | null,
  approvedParcels: ApprovedParcelData | null = null
): DevelopmentRights {
  // Try multiple sources for site area, in order of preference:
  // 1. CSG Cadastral GEOM_AREA (in sqm)
  // 2. Approved Parcels AREASG converted from hectares to sqm
  // 3. Return 0 if no data available (user must verify with municipality)
  let site = 0;
  
  if (cadastral?.extent_sqm && cadastral.extent_sqm > 100 && cadastral.extent_sqm < 100000) {
    site = cadastral.extent_sqm;
  } else if (approvedParcels?.area_sqm && approvedParcels.area_sqm > 100) {
    site = approvedParcels.area_sqm;
  }
  
  const cov = zoning?.coverage_percent || 50;
  const far = zoning?.far || 1.0;
  const h = zoning?.height_storeys || 2;
  
  const maxCoverage = site > 0 ? Math.round(site * cov / 100) : 0;
  const maxFloorArea = site > 0 ? Math.round(site * far) : 0;
  const parkingBays = site > 0 ? Math.ceil(site * far / 25) : 0;
  
  return { 
    site_area_sqm: Math.round(site), 
    max_coverage_sqm: maxCoverage, 
    max_floor_area_sqm: maxFloorArea, 
    max_height_storeys: h, 
    coverage_percent: cov, 
    floor_area_ratio: far, 
    parking_bays_required: parkingBays 
  };
}

export function analyzeFeasibility(cadastral: CadastralData | null, zoning: ZoningData | null, sg: SGDiagramData | null, suburb: SuburbData | null, buildings: BuildingData[] | null, flood: FloodData | null): FeasibilityData {
  let score = 100;
  const issues: string[] = [];
  const opps: string[] = [];
  if (cadastral) { opps.push(`Verified: ERF ${cadastral.erf_number || 'N/A'}`); } else { score -= 25; issues.push('Not in CSG database'); }
  if (zoning) { opps.push(`Zoning: ${zoning.zone_code}`); if (zoning.far && zoning.far >= 1.2) opps.push('Good development potential'); } else { score -= 15; issues.push('Zoning not available - verify with municipality'); }
  if (sg) opps.push('SG diagram available'); else { score -= 10; issues.push('SG diagram not found'); }
  if (flood?.in_flood_zone) { score -= 15; issues.push('In 100-year flood zone'); } else { opps.push('Outside flood zone'); }
  if (buildings?.length) opps.push(`${buildings.length} existing structures`);
  if (suburb) opps.push(`Area: ${suburb.suburb_name}`);
  let rating: string, verdict: string;
  if (score >= 80) { rating = 'EXCELLENT'; verdict = '✅ RECOMMENDED: Proceed'; }
  else if (score >= 60) { rating = 'GOOD'; verdict = '✅ VIABLE: Verify details'; }
  else if (score >= 40) { rating = 'MODERATE'; verdict = '⚠️ PROCEED: Assessment needed'; }
  else { rating = 'CHALLENGING'; verdict = '❌ CAUTION: Issues found'; }
  return { score, rating, verdict, issues: issues.length ? issues : ['No major issues'], opportunities: opps };
}

export function generateRequirements(): RequirementsData {
  return { documents: ['SANS Forms', 'Building Plans', 'Site Plan', 'Zoning Cert', 'Title Deed', 'SG Diagram', 'Rates Clearance', 'Engineer Letter'], process_steps: ['Submit', 'Inspect', 'Review', 'Approve'], timeline_weeks: '4-8', municipal_contact: 'eThekwini: (031) 311 1111' };
}

export function generateCosts(dr: DevelopmentRights): CostsData {
  const fa = dr.max_floor_area_sqm;
  return { professional_fees_low: Math.round(Math.max(100000, fa * 1500)), professional_fees_high: Math.round(Math.max(300000, fa * 3000)), municipal_fees_low: Math.round(Math.max(5000, fa * 20)), municipal_fees_high: Math.round(Math.max(20000, fa * 50)), construction_low: Math.round(fa * 8000), construction_high: Math.round(fa * 18000), total_timeline_weeks: '14-27 weeks' };
}

export function generateRecommendations(c: CadastralData | null, z: ZoningData | null, sg: SGDiagramData | null, f: FloodData | null, fe: FeasibilityData): string[] {
  const r = ['1. Obtain zoning certificate from eThekwini Planning'];
  if (sg) r.push(`2. Download SG: ${sg.download_link}`); else r.push('2. Request SG from Surveyor General');
  r.push('3. Commission site survey');
  r.push('4. Verify title deed');
  if (f?.in_flood_zone) r.push('5. ⚠️ Flood study required');
  if (fe.score >= 70) r.push('6. Engage architect', '7. Appoint team'); else r.push('6. Address issues', '7. Consult planner');
  r.push('8. Submit building plans');
  return r;
}

// AI Analysis
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
export async function generateAIAnalysis(address: string, report: PropertyReport): Promise<string> {
  try {
    if (!zaiInstance) zaiInstance = await ZAI.create();
    const prompt = `Property: "${address}" Durban. ERF: ${report.cadastral?.erf_number || '?'}. Area: ${report.development_rights?.site_area_sqm}sqm. Zone: ${report.zoning?.zone_code || 'Unknown'}. Coverage: ${report.development_rights?.coverage_percent}%. FAR: ${report.development_rights?.floor_area_ratio}. Flood: ${report.flood_risk?.risk_level}. Score: ${report.feasibility?.score}/100. Give 4 sentences on potential and next steps.`;
    const c = await zaiInstance.chat.completions.create({ messages: [{ role: 'system', content: 'Durban property consultant.' }, { role: 'user', content: prompt }], temperature: 0.7, max_tokens: 300 });
    return c.choices[0]?.message?.content || 'Verify with eThekwini Planning.';
  } catch { return 'Development potential exists. Contact eThekwini Planning.'; }
}

export function generateReportId(address: string): string { return `report_${address.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${Date.now()}`; }
