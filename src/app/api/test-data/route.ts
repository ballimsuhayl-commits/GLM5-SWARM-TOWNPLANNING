import { NextRequest, NextResponse } from 'next/server';
import { 
  geocodeAddress, 
  queryCSGParcel, 
  queryApprovedParcels, 
  queryZoning,
  calculateDevelopmentRights,
  API_CONFIG 
} from '@/lib/agents';

export const dynamic = 'force-dynamic';

// Simple test endpoint to verify data fetching
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address') || '85 Florida Road, Durban';
  
  console.log('=== TEST DATA FETCH ===');
  console.log('Address:', address);
  
  try {
    // Step 1: Geocode
    console.log('\n1. GEOCODING...');
    const { location, error: geoError } = await geocodeAddress(address);
    
    if (geoError || !location) {
      return NextResponse.json({ error: 'Geocoding failed', details: geoError });
    }
    
    console.log('Location:', location.lat, location.lon);
    
    // Step 2: Test CSG
    console.log('\n2. CSG PARCEL...');
    const csgResult = await queryCSGParcel(location.lon, location.lat);
    console.log('CSG Error:', csgResult.error);
    console.log('CSG Data:', csgResult.data ? {
      erf: csgResult.data.erf_number,
      area: csgResult.data.extent_sqm,
      source: csgResult.data.source
    } : null);
    
    // Step 3: Test Approved Parcels
    console.log('\n3. APPROVED PARCELS...');
    const approvedResult = await queryApprovedParcels(location.lon, location.lat);
    console.log('Approved Error:', approvedResult.error);
    console.log('Approved Data:', approvedResult.data ? {
      erf: approvedResult.data.erf_number,
      area_ha: approvedResult.data.area_ha,
      area_sqm: approvedResult.data.area_sqm,
      suburb: approvedResult.data.suburb,
      status: approvedResult.data.status
    } : null);
    
    // Step 4: Test Zoning
    console.log('\n4. ZONING...');
    const zoningResult = await queryZoning(location.lon, location.lat);
    console.log('Zoning Error:', zoningResult.error);
    console.log('Zoning Data:', zoningResult.data ? {
      zone: zoningResult.data.zone_code,
      scheme: zoningResult.data.scheme_name,
      coverage: zoningResult.data.coverage_percent,
      far: zoningResult.data.far,
      height: zoningResult.data.height_storeys
    } : null);
    
    // Step 5: Raw API test
    console.log('\n5. RAW API TEST...');
    const testUrl = `${API_CONFIG.ARCGIS_ONLINE.ZONING}?geometry=${location.lon},${location.lat}&geometryType=esriGeometryPoint&inSR=4326&outSR=4326&f=json&outFields=ZONING,SCHEMENAME`;
    console.log('Test URL:', testUrl);
    
    const rawResponse = await fetch(testUrl);
    const rawData = await rawResponse.json();
    console.log('Raw features count:', rawData.features?.length);
    if (rawData.features?.[0]) {
      console.log('Raw attributes:', rawData.features[0].attributes);
    }
    
    return NextResponse.json({
      success: true,
      address,
      location: {
        lat: location.lat,
        lon: location.lon,
        display_name: location.display_name
      },
      csg: csgResult.data ? {
        erf: csgResult.data.erf_number,
        area_sqm: csgResult.data.extent_sqm,
        source: csgResult.data.source,
        error: csgResult.error
      } : { error: csgResult.error },
      approved_parcels: approvedResult.data ? {
        erf: approvedResult.data.erf_number,
        area_ha: approvedResult.data.area_ha,
        area_sqm: approvedResult.data.area_sqm,
        suburb: approvedResult.data.suburb,
        status: approvedResult.data.status,
        error: approvedResult.error
      } : { error: approvedResult.error },
      zoning: zoningResult.data ? {
        zone_code: zoningResult.data.zone_code,
        scheme_name: zoningResult.data.scheme_name,
        coverage_percent: zoningResult.data.coverage_percent,
        far: zoningResult.data.far,
        height_storeys: zoningResult.data.height_storeys,
        error: zoningResult.error
      } : { error: zoningResult.error },
      raw_api: {
        features_count: rawData.features?.length || 0,
        first_feature: rawData.features?.[0]?.attributes || null
      },
      development_rights: calculateDevelopmentRights(
        csgResult.data || null,
        zoningResult.data || null,
        approvedResult.data || null
      )
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
