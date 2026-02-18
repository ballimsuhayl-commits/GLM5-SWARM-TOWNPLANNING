import { NextRequest } from 'next/server';
import {
  AGENTS,
  formatSSE,
  SSEEvent,
  geocodeAddress,
  queryCSGParcel,
  queryApprovedParcels,
  queryZoning,
  queryBuildings,
  querySGDiagram,
  queryFloodRisk,
  queryRoads,
  querySuburb,
  calculateDevelopmentRights,
  analyzeFeasibility,
  generateRequirements,
  generateCosts,
  generateRecommendations,
  generateAIAnalysis,
  generateReportId,
  PropertyReport,
} from '@/lib/agents';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return new Response(JSON.stringify({ error: 'Address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    let progress = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = async (event: SSEEvent) => {
          controller.enqueue(encoder.encode(formatSSE(event)));
        };

        const reportId = generateReportId(address);
        const report: PropertyReport = {
          success: false,
          report_id: reportId,
          address_input: address,
          timestamp: new Date().toISOString(),
        };

        try {
          // Get coordinator agent
          const coordinator = AGENTS[0];
          
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: coordinator.id,
              agentName: coordinator.name,
              progress: 0,
            },
          });

          await sendEvent({
            type: 'agent:finding',
            data: {
              agentId: coordinator.id,
              agentName: coordinator.name,
              finding: `Initiating property research for "${address}" in Durban...`,
              progress: 2,
            },
          });

          // =================================================================
          // STEP 1: GEOCODING
          // =================================================================
          const geocoder = AGENTS[1];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: geocoder.id,
              agentName: geocoder.name,
              progress: 2,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: geocoder.id,
              agentName: geocoder.name,
              query: `Geocoding: "${address}, Durban, South Africa"`,
              progress: 3,
            },
          });

          const { location, error: geoError } = await geocodeAddress(address);

          if (geoError || !location) {
            await sendEvent({
              type: 'error',
              data: { message: geoError || 'Failed to geocode address' },
            });
            controller.close();
            return;
          }

          report.location = location;
          progress = 8;

          await sendEvent({
            type: 'agent:finding',
            data: {
              agentId: geocoder.id,
              agentName: geocoder.name,
              finding: `📍 Found: ${location.display_name}`,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: geocoder.id,
              agentName: geocoder.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 2: CSG CADASTRAL DATA
          // =================================================================
          const cadastralAgent = AGENTS[2];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: cadastralAgent.id,
              agentName: cadastralAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: cadastralAgent.id,
              agentName: cadastralAgent.name,
              query: 'Querying Chief Surveyor General database...',
              progress: progress + 1,
            },
          });

          const { data: csgData } = await queryCSGParcel(location.lon, location.lat);
          report.cadastral = csgData || undefined;
          progress = 18;

          if (csgData) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: cadastralAgent.id,
                agentName: cadastralAgent.name,
                finding: `📋 CSG: ERF ${csgData.erf_number || 'N/A'}, ${csgData.township || csgData.farm_name || 'N/A'} (${csgData.extent_sqm?.toFixed(0) || '?'} sqm)`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: cadastralAgent.id,
                agentName: cadastralAgent.name,
                finding: `⚠️ CSG: Property not found in database`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: cadastralAgent.id,
              agentName: cadastralAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 3: APPROVED PARCELS
          // =================================================================
          const approvedAgent = AGENTS[3];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: approvedAgent.id,
              agentName: approvedAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: approvedAgent.id,
              agentName: approvedAgent.name,
              query: 'Checking approved parcels layer...',
              progress: progress + 1,
            },
          });

          const { data: approvedData } = await queryApprovedParcels(location.lon, location.lat);
          report.approved_parcels = approvedData || undefined;
          progress = 28;

          if (approvedData) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: approvedAgent.id,
                agentName: approvedAgent.name,
                finding: `✅ Approved: ${approvedData.status || 'Verified'} - ${approvedData.suburb || approvedData.township || 'Unknown'}`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: approvedAgent.id,
                agentName: approvedAgent.name,
                finding: `📝 Approved Parcels: Not found`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: approvedAgent.id,
              agentName: approvedAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 4: ZONING
          // =================================================================
          const zoningAgent = AGENTS[4];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: zoningAgent.id,
              agentName: zoningAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: zoningAgent.id,
              agentName: zoningAgent.name,
              query: 'Querying town planning scheme...',
              progress: progress + 1,
            },
          });

          const { data: zoningData } = await queryZoning(location.lon, location.lat);
          report.zoning = zoningData || undefined;
          progress = 38;

          if (zoningData) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: zoningAgent.id,
                agentName: zoningAgent.name,
                finding: `🏘️ Zoning: ${zoningData.zone_code} - Coverage: ${zoningData.coverage_percent}%, FAR: ${zoningData.far}`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: zoningAgent.id,
                agentName: zoningAgent.name,
                finding: `⚠️ Zoning: Not found`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: zoningAgent.id,
              agentName: zoningAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 5: BUILDING FOOTPRINTS
          // =================================================================
          const buildingsAgent = AGENTS[5];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: buildingsAgent.id,
              agentName: buildingsAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: buildingsAgent.id,
              agentName: buildingsAgent.name,
              query: 'Analyzing existing building footprints...',
              progress: progress + 1,
            },
          });

          const { data: buildingsData } = await queryBuildings(location.lon, location.lat);
          report.buildings = buildingsData || undefined;
          progress = 48;

          if (buildingsData && buildingsData.length > 0) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: buildingsAgent.id,
                agentName: buildingsAgent.name,
                finding: `🏗️ Buildings: ${buildingsData.length} structure(s) - ${buildingsData.map(b => b.class).join(', ')}`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: buildingsAgent.id,
                agentName: buildingsAgent.name,
                finding: `🏗️ Buildings: No existing structures`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: buildingsAgent.id,
              agentName: buildingsAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 6: SG DIAGRAM
          // =================================================================
          const sgAgent = AGENTS[6];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: sgAgent.id,
              agentName: sgAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: sgAgent.id,
              agentName: sgAgent.name,
              query: 'Retrieving SG diagram link...',
              progress: progress + 1,
            },
          });

          const { data: sgData } = await querySGDiagram(location.lon, location.lat);
          report.sg_diagram = sgData || undefined;
          progress = 58;

          if (sgData) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: sgAgent.id,
                agentName: sgAgent.name,
                finding: `📄 SG Diagram: Available - ${sgData.sg_number}`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: sgAgent.id,
                agentName: sgAgent.name,
                finding: `⚠️ SG Diagram: Not available`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: sgAgent.id,
              agentName: sgAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 7: FLOOD RISK
          // =================================================================
          const floodAgent = AGENTS[7];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: floodAgent.id,
              agentName: floodAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: floodAgent.id,
              agentName: floodAgent.name,
              query: 'Checking flood risk zones...',
              progress: progress + 1,
            },
          });

          const { data: floodData } = await queryFloodRisk(location.lon, location.lat);
          report.flood_risk = floodData || undefined;
          progress = 68;

          if (floodData?.in_flood_zone) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: floodAgent.id,
                agentName: floodAgent.name,
                finding: `⚠️ Flood: Property in 100-year flood zone!`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: floodAgent.id,
                agentName: floodAgent.name,
                finding: `✅ Flood: Outside flood zone`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: floodAgent.id,
              agentName: floodAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 8: ROADS
          // =================================================================
          const roadsAgent = AGENTS[8];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: roadsAgent.id,
              agentName: roadsAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: roadsAgent.id,
              agentName: roadsAgent.name,
              query: 'Analyzing nearby roads...',
              progress: progress + 1,
            },
          });

          const { data: roadsData } = await queryRoads(location.lon, location.lat);
          report.roads = roadsData || undefined;
          progress = 76;

          if (roadsData && roadsData.length > 0) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: roadsAgent.id,
                agentName: roadsAgent.name,
                finding: `🛣️ Roads: ${roadsData.map(r => r.name).filter(Boolean).slice(0, 3).join(', ') || 'Found ' + roadsData.length + ' roads'}`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: roadsAgent.id,
                agentName: roadsAgent.name,
                finding: `🛣️ Roads: No nearby road data`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: roadsAgent.id,
              agentName: roadsAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // STEP 9: SUBURB DATA
          // =================================================================
          const suburbAgent = AGENTS[9];
          await sendEvent({
            type: 'agent:start',
            data: {
              agentId: suburbAgent.id,
              agentName: suburbAgent.name,
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:search',
            data: {
              agentId: suburbAgent.id,
              agentName: suburbAgent.name,
              query: 'Querying suburb overview...',
              progress: progress + 1,
            },
          });

          const { data: suburbData } = await querySuburb(location.lon, location.lat);
          report.suburb = suburbData || undefined;
          progress = 84;

          if (suburbData) {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: suburbAgent.id,
                agentName: suburbAgent.name,
                finding: `📊 Suburb: ${suburbData.suburb_name || 'Unknown'}`,
                progress: progress,
              },
            });
          } else {
            await sendEvent({
              type: 'agent:finding',
              data: {
                agentId: suburbAgent.id,
                agentName: suburbAgent.name,
                finding: `📊 Suburb: Data not available`,
                progress: progress,
              },
            });
          }

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: suburbAgent.id,
              agentName: suburbAgent.name,
              progress: progress,
            },
          });

          // =================================================================
          // ANALYSIS
          // =================================================================
          await sendEvent({
            type: 'agent:finding',
            data: {
              agentId: coordinator.id,
              agentName: coordinator.name,
              finding: '📈 Calculating development rights and feasibility...',
              progress: 86,
            },
          });

          // Calculate development rights
          report.development_rights = calculateDevelopmentRights(
            report.cadastral || null,
            report.zoning || null,
            report.approved_parcels || null
          );

          // Analyze feasibility
          report.feasibility = analyzeFeasibility(
            report.cadastral || null,
            report.zoning || null,
            report.sg_diagram || null,
            report.suburb || null,
            report.buildings || null,
            report.flood_risk || null
          );

          // Generate requirements
          report.requirements = generateRequirements();

          // Generate costs
          report.costs = generateCosts(report.development_rights);

          // Generate recommendations
          report.recommendations = generateRecommendations(
            report.cadastral || null,
            report.zoning || null,
            report.sg_diagram || null,
            report.flood_risk || null,
            report.feasibility
          );

          progress = 90;

          await sendEvent({
            type: 'agent:finding',
            data: {
              agentId: coordinator.id,
              agentName: coordinator.name,
              finding: `🎯 Feasibility Score: ${report.feasibility.score}/100 - ${report.feasibility.rating}`,
              progress: progress,
            },
          });

          // AI Analysis
          progress = 92;
          await sendEvent({
            type: 'agent:finding',
            data: {
              agentId: coordinator.id,
              agentName: coordinator.name,
              finding: '🤖 Generating AI analysis...',
              progress: progress,
            },
          });

          const aiAnalysis = await generateAIAnalysis(address, report);
          
          report.summary = {
            score: report.feasibility.score,
            rating: report.feasibility.rating,
            verdict: report.feasibility.verdict,
            key_findings: [
              `Site Area: ${report.development_rights.site_area_sqm.toLocaleString()} sqm`,
              `Max Coverage: ${report.development_rights.max_coverage_sqm.toLocaleString()} sqm (${report.development_rights.coverage_percent}%)`,
              `Max Floor Area: ${report.development_rights.max_floor_area_sqm.toLocaleString()} sqm`,
              `SG Diagram: ${report.sg_diagram ? '✅ Available' : '❌ Not found'}`,
              `Flood Risk: ${report.flood_risk?.risk_level || 'Unknown'}`,
              `Buildings: ${report.buildings?.length || 0} existing`,
            ],
            ai_analysis: aiAnalysis,
          };

          // Final report
          report.success = true;
          progress = 95;

          await sendEvent({
            type: 'report:section',
            data: {
              section: 'full',
              content: JSON.stringify(report, null, 2),
              progress: progress,
            },
          });

          await sendEvent({
            type: 'agent:complete',
            data: {
              agentId: coordinator.id,
              agentName: coordinator.name,
              progress: 100,
            },
          });

          await sendEvent({
            type: 'done',
            data: {
              message: 'Research complete',
              progress: 100,
            },
          });

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          await sendEvent({
            type: 'error',
            data: {
              message: error instanceof Error ? error.message : 'An error occurred',
            },
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
