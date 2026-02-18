'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, MapPin, FileText, Layers, FileSearch, BarChart3,
  Search, CheckCircle2, Clock, AlertCircle, Building2, Sparkles,
  Loader2, Map, DollarSign, FileCheck, ExternalLink, Route, 
  AlertTriangle, Building
} from 'lucide-react';

// Agent configuration - matches backend
const AGENTS = [
  { id: 'coordinator', name: 'Coordinator', role: 'Orchestrator', color: '#8B5CF6', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30', icon: Network },
  { id: 'geocoder', name: 'Location', role: 'Geocoding', color: '#10B981', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', icon: MapPin },
  { id: 'cadastral', name: 'CSG Cadastral', role: 'Parcel Data', color: '#F59E0B', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: FileText },
  { id: 'approved_parcels', name: 'Approved Parcels', role: 'Verification', color: '#84CC16', bgColor: 'bg-lime-500/10', borderColor: 'border-lime-500/30', icon: CheckCircle2 },
  { id: 'zoning', name: 'Zoning', role: 'Planning', color: '#3B82F6', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: Layers },
  { id: 'buildings', name: 'Buildings', role: 'Structures', color: '#14B8A6', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30', icon: Building },
  { id: 'sg_diagram', name: 'SG Diagram', role: 'Survey', color: '#EF4444', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: FileSearch },
  { id: 'flood', name: 'Flood Risk', role: 'Risk Analysis', color: '#F97316', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', icon: AlertTriangle },
  { id: 'roads', name: 'Roads', role: 'Infrastructure', color: '#6366F1', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30', icon: Route },
  { id: 'suburb', name: 'Suburb', role: 'Area Data', color: '#EC4899', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30', icon: BarChart3 },
];

type AgentStatus = 'idle' | 'searching' | 'analyzing' | 'complete' | 'error';

interface AgentState {
  status: AgentStatus;
  findings: string[];
}

interface StreamEvent {
  type: string;
  data: Record<string, unknown>;
}

interface PropertyReport {
  success: boolean;
  report_id: string;
  address_input: string;
  timestamp: string;
  location?: {
    display_name: string;
    lat: number;
    lon: number;
    suburb?: string;
    city: string;
  };
  cadastral?: {
    source: string;
    erf_number?: string;
    township?: string;
    farm_name?: string;
    portion?: string;
    extent_sqm?: number;
    sg_code?: string;
    parcel_key?: string;
    legal_status?: string;
  };
  approved_parcels?: {
    source: string;
    status?: string;
    erf_number?: string;
    township?: string;
    suburb?: string;
    street_number?: string;
    street_name?: string;
    property_id?: string;
  };
  zoning?: {
    source: string;
    zone_code?: string;
    zone_description?: string;
    scheme_name?: string;
    region?: string;
    permitted_uses?: string[];
    coverage_percent?: number;
    far?: number;
    height_storeys?: number;
    density?: string;
  };
  buildings?: Array<{
    class: string;
    year?: number;
    roof_area_sqm?: number;
  }>;
  sg_diagram?: {
    sg_number: string;
    sg_code?: string;
    download_link: string;
    farm_name?: string;
    erf?: string;
    township?: string;
  };
  flood_risk?: {
    in_flood_zone: boolean;
    zone_type?: string;
    risk_level: string;
  };
  roads?: Array<{
    name?: string;
    type?: string;
  }>;
  suburb?: {
    suburb_name?: string;
    population?: number;
    households?: number;
    area_sqkm?: number;
  };
  development_rights?: {
    site_area_sqm: number;
    max_coverage_sqm: number;
    max_floor_area_sqm: number;
    max_height_storeys: number;
    coverage_percent: number;
    floor_area_ratio: number;
    parking_bays_required?: number;
  };
  feasibility?: {
    score: number;
    rating: string;
    verdict: string;
    issues: string[];
    opportunities: string[];
  };
  requirements?: {
    documents: string[];
    process_steps: string[];
    timeline_weeks: string;
    municipal_contact: string;
  };
  costs?: {
    professional_fees_low: number;
    professional_fees_high: number;
    municipal_fees_low: number;
    municipal_fees_high: number;
    construction_low: number;
    construction_high: number;
    total_timeline_weeks: string;
  };
  recommendations?: string[];
  summary?: {
    score: number;
    rating: string;
    verdict: string;
    key_findings: string[];
    ai_analysis?: string;
  };
}

const SAMPLE_ADDRESSES = [
  '716 Musgrave Road, Durban',
  '123 Florida Road, Durban',
  '45 Umhlanga Rocks Drive, Umhlanga',
  '78 Brand Road, Glenwood',
];

export default function Home() {
  const [address, setAddress] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(() => {
    const states: Record<string, AgentState> = {};
    AGENTS.forEach(agent => { states[agent.id] = { status: 'idle', findings: [] }; });
    return states;
  });
  const [streamOutput, setStreamOutput] = useState<string[]>([]);
  const [report, setReport] = useState<PropertyReport | null>(null);
  const [rawReport, setRawReport] = useState<string>('');

  const handleResearch = useCallback(async () => {
    if (!address.trim() || isResearching) return;

    setIsResearching(true);
    setProgress(0);
    setReport(null);
    setRawReport('');
    setStreamOutput([]);
    
    const newStates: Record<string, AgentState> = {};
    AGENTS.forEach(agent => { newStates[agent.id] = { status: 'idle', findings: [] }; });
    setAgentStates(newStates);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) throw new Error('Failed to start research');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (error) {
      setStreamOutput(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsResearching(false);
    }
  }, [address, isResearching]);

  const handleEvent = (event: StreamEvent) => {
    const { type, data } = event;
    const agentId = data.agentId as string;
    const agentName = data.agentName as string;

    switch (type) {
      case 'agent:start':
        setAgentStates(prev => ({ ...prev, [agentId]: { status: 'searching', findings: [] } }));
        setStreamOutput(prev => [...prev, `🚀 ${agentName} started...`]);
        break;
      case 'agent:search':
        setAgentStates(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: 'searching' } }));
        setStreamOutput(prev => [...prev, `🔍 ${agentName}: ${data.query}`]);
        setProgress(data.progress as number || 0);
        break;
      case 'agent:finding':
        setAgentStates(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: 'analyzing', findings: [...prev[agentId].findings, data.finding as string] } }));
        setStreamOutput(prev => [...prev, `💡 ${agentName}: ${data.finding}`]);
        setProgress(data.progress as number || 0);
        break;
      case 'agent:complete':
        setAgentStates(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: 'complete' } }));
        setStreamOutput(prev => [...prev, `✅ ${agentName} complete!`]);
        setProgress(data.progress as number || 0);
        break;
      case 'report:section':
        if (data.content) {
          setRawReport(data.content as string);
          try {
            setReport(JSON.parse(data.content as string));
          } catch { /* ignore */ }
        }
        setProgress(data.progress as number || 0);
        break;
      case 'done':
        setProgress(100);
        setStreamOutput(prev => [...prev, '🎉 Research complete!']);
        break;
      case 'error':
        setStreamOutput(prev => [...prev, `❌ Error: ${data.message}`]);
        break;
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'searching': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'analyzing': return <Sparkles className="w-4 h-4 animate-pulse" />;
      case 'complete': return <CheckCircle2 className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4 opacity-50" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'searching': case 'analyzing': return 'text-yellow-400';
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  eThekwini Property Research
                </h1>
                <p className="text-xs text-gray-500">10-Agent System • Real GIS Data</p>
              </div>
            </div>
            <Badge variant="outline" className="border-violet-500/30 text-violet-400">
              Production Ready
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Input */}
        <div className="max-w-3xl mx-auto mb-8">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-violet-400" />
                Comprehensive Property Research
              </CardTitle>
              <CardDescription>Enter a Durban address for complete analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter street address in Durban..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                  className="bg-gray-800/50 border-gray-700 focus:border-violet-500"
                  disabled={isResearching}
                />
                <Button onClick={handleResearch} disabled={!address.trim() || isResearching} className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 min-w-[140px]">
                  {isResearching ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Working</>) : (<><Search className="w-4 h-4 mr-2" />Research</>)}
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Try:</span>
                {SAMPLE_ADDRESSES.map((addr, i) => (
                  <Button key={i} variant="ghost" size="sm" onClick={() => setAddress(addr)} className="h-7 text-xs text-gray-400 hover:text-white" disabled={isResearching}>
                    {addr}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        {(isResearching || progress > 0) && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Overall Progress</span>
              <span className="text-sm font-medium text-violet-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-800" />
          </div>
        )}

        {/* Agent Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 mb-8">
          {AGENTS.map((agent) => {
            const state = agentStates[agent.id];
            const Icon = agent.icon;
            const isActive = state.status === 'searching' || state.status === 'analyzing';
            return (
              <Card key={agent.id} className={`${agent.bgColor} ${agent.borderColor} border transition-all duration-300 ${isActive ? 'ring-2 ring-offset-2 ring-offset-gray-950' : ''} ${state.status === 'complete' ? 'opacity-90' : ''}`}
                style={isActive ? { boxShadow: `0 0 0 2px ${agent.color}` } : undefined}>
                <CardContent className="py-3 px-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
                      <Icon className="w-3 h-3" style={{ color: agent.color }} />
                    </div>
                    <div className={getStatusColor(state.status)}>{getStatusIcon(state.status)}</div>
                  </div>
                  <div className="text-xs font-medium truncate">{agent.name}</div>
                  {state.findings.length > 0 && <div className="text-xs text-gray-500 mt-1">{state.findings.length} finding{state.findings.length > 1 ? 's' : ''}</div>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report or Stream */}
        {report ? (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${report.summary?.score && report.summary.score >= 70 ? 'bg-green-500/10 border border-green-500/30' : report.summary?.score && report.summary.score >= 50 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div className="text-gray-400 text-sm">Feasibility Score</div>
                    <div className={`text-3xl font-bold ${getScoreColor(report.summary?.score || 0)}`}>{report.summary?.score}/100</div>
                    <div className="text-white font-medium mt-1">{report.summary?.rating}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50">
                    <div className="text-gray-400 text-sm">Verdict</div>
                    <div className="text-white font-medium text-sm mt-1">{report.summary?.verdict}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50">
                    <div className="text-gray-400 text-sm">SG Diagram</div>
                    <div className="text-white font-medium text-sm mt-1">
                      {report.sg_diagram ? (<a href={report.sg_diagram.download_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">Available <ExternalLink className="w-4 h-4" /></a>) : 'Not Found'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50">
                    <div className="text-gray-400 text-sm">Flood Risk</div>
                    <div className={`font-medium text-sm mt-1 ${report.flood_risk?.in_flood_zone ? 'text-orange-400' : 'text-green-400'}`}>{report.flood_risk?.risk_level || 'Unknown'}</div>
                  </div>
                </div>
                {report.summary?.ai_analysis && (
                  <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <div className="text-violet-400 font-medium mb-2">🤖 AI Analysis</div>
                    <p className="text-gray-300">{report.summary.ai_analysis}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Cadastral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400" />Location</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="p-2 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Address</div><div className="text-white truncate">{report.location?.display_name}</div></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Suburb</div><div className="text-white">{report.location?.suburb || report.suburb?.suburb_name}</div></div>
                    <div className="p-2 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Area</div><div className="text-white">{report.development_rights?.site_area_sqm.toLocaleString()} sqm</div></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-400" />CSG Cadastral</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">ERF</div><div className="text-white">{report.cadastral?.erf_number || 'N/A'}</div></div>
                    <div className="p-2 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Township</div><div className="text-white">{report.cadastral?.township || report.cadastral?.farm_name || 'N/A'}</div></div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Legal Status</div><div className="text-white">{report.cadastral?.legal_status || 'Unknown'}</div></div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-blue-400" />Zoning</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30"><div className="text-blue-400 text-xs">Zone</div><div className="text-white font-bold">{report.zoning?.zone_code || 'Unknown'}</div><div className="text-gray-400 text-xs truncate">{report.zoning?.zone_description?.substring(0, 60)}...</div></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-gray-800/50 text-center"><div className="text-gray-500 text-xs">Coverage</div><div className="text-white font-bold">{report.development_rights?.coverage_percent}%</div></div>
                    <div className="p-2 rounded bg-gray-800/50 text-center"><div className="text-gray-500 text-xs">FAR</div><div className="text-white font-bold">{report.development_rights?.floor_area_ratio}</div></div>
                    <div className="p-2 rounded bg-gray-800/50 text-center"><div className="text-gray-500 text-xs">Height</div><div className="text-white font-bold">{report.development_rights?.max_height_storeys}</div></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Buildings & Flood */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building className="w-5 h-5 text-teal-400" />Existing Buildings</CardTitle></CardHeader>
                <CardContent>
                  {report.buildings && report.buildings.length > 0 ? (
                    <div className="space-y-2">
                      {report.buildings.map((b, i) => (
                        <div key={i} className="p-3 rounded-lg bg-gray-800/50 flex justify-between items-center">
                          <div><span className="text-white font-medium">{b.class}</span>{b.year && <span className="text-gray-500 ml-2">({b.year})</span>}</div>
                          {b.roof_area_sqm && <Badge variant="outline">{b.roof_area_sqm.toFixed(0)} sqm</Badge>}
                        </div>
                      ))}
                    </div>
                  ) : (<div className="p-4 rounded-lg bg-gray-800/50 text-center text-gray-500">No existing buildings found</div>)}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-400" />Flood & Risk Analysis</CardTitle></CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg ${report.flood_risk?.in_flood_zone ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {report.flood_risk?.in_flood_zone ? <AlertTriangle className="w-5 h-5 text-orange-400" /> : <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      <span className={`font-medium ${report.flood_risk?.in_flood_zone ? 'text-orange-400' : 'text-green-400'}`}>{report.flood_risk?.risk_level}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{report.flood_risk?.in_flood_zone ? 'Property is within the 100-year flood plain. Additional flood mitigation measures may be required for development.' : 'Property is outside the 100-year flood plain.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Roads & Suburb */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Route className="w-5 h-5 text-indigo-400" />Nearby Roads</CardTitle></CardHeader>
                <CardContent>
                  {report.roads && report.roads.length > 0 ? (
                    <div className="space-y-2">{report.roads.slice(0, 5).map((r, i) => (
                      <div key={i} className="p-2 rounded bg-gray-800/50 flex justify-between">
                        <span className="text-white">{r.name || 'Unnamed'}</span>
                        {r.type && <Badge variant="outline" className="text-xs">{r.type}</Badge>}
                      </div>
                    ))}</div>
                  ) : (<div className="p-4 rounded bg-gray-800/50 text-center text-gray-500">No road data</div>)}
                  {report.suburb && (
                    <div className="mt-4 p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                      <div className="text-pink-400 font-medium mb-2">📊 {report.suburb.suburb_name}</div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center"><div className="text-gray-400 text-xs">Population</div><div className="text-white">{report.suburb.population?.toLocaleString() || 'N/A'}</div></div>
                        <div className="text-center"><div className="text-gray-400 text-xs">Households</div><div className="text-white">{report.suburb.households?.toLocaleString() || 'N/A'}</div></div>
                        <div className="text-center"><div className="text-gray-400 text-xs">Area</div><div className="text-white">{report.suburb.area_sqkm?.toFixed(1) || '?'} km²</div></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" />Cost Estimates</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Professional Fees</div><div className="text-green-400 font-medium text-sm">{formatCurrency(report.costs?.professional_fees_low || 0)} - {formatCurrency(report.costs?.professional_fees_high || 0)}</div></div>
                    <div className="p-3 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Municipal Fees</div><div className="text-green-400 font-medium text-sm">{formatCurrency(report.costs?.municipal_fees_low || 0)} - {formatCurrency(report.costs?.municipal_fees_high || 0)}</div></div>
                  </div>
                  <div className="p-3 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Construction (est)</div><div className="text-green-400 font-medium">{formatCurrency(report.costs?.construction_low || 0)} - {formatCurrency(report.costs?.construction_high || 0)}</div></div>
                  <div className="p-3 rounded bg-gray-800/50"><div className="text-gray-500 text-xs">Timeline</div><div className="text-white">{report.costs?.total_timeline_weeks}</div></div>
                </CardContent>
              </Card>
            </div>

            {/* Requirements */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileCheck className="w-5 h-5 text-amber-400" />Requirements</CardTitle></CardHeader>
              <CardContent>
                <div className="p-2 rounded bg-gray-800/50 mb-4"><div className="text-gray-500 text-xs">Municipal Contact</div><div className="text-white text-sm">{report.requirements?.municipal_contact}</div></div>
                <ScrollArea className="h-32">
                  <ul className="text-gray-300 text-xs space-y-1">
                    {report.requirements?.documents.map((doc, i) => (<li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-500" />{doc}</li>))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-violet-400" />Recommendations</CardTitle></CardHeader>
              <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{report.recommendations?.map((rec, i) => (<div key={i} className="p-2 rounded bg-gray-800/50 text-gray-300 text-sm">{rec}</div>))}</div></CardContent>
            </Card>

            {/* Issues & Opportunities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-red-400"><AlertCircle className="w-5 h-5" />Issues ({report.feasibility?.issues.length || 0})</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{report.feasibility?.issues.map((issue, i) => (<li key={i} className="text-gray-300 text-sm flex items-start gap-2"><span className="text-red-400">•</span>{issue}</li>))}</ul></CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-green-400"><Sparkles className="w-5 h-5" />Opportunities ({report.feasibility?.opportunities.length || 0})</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{report.feasibility?.opportunities.map((opp, i) => (<li key={i} className="text-gray-300 text-sm flex items-start gap-2"><span className="text-green-400">•</span>{opp}</li>))}</ul></CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Live Stream */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live Agent Stream</CardTitle>
                <CardDescription>Real-time activity from 10 data sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {streamOutput.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Network className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">Agent activity will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {streamOutput.map((line, i) => (
                        <div key={i} className={`text-sm py-1 px-2 rounded ${line.startsWith('🚀') ? 'bg-violet-500/10 text-violet-300' : line.startsWith('🔍') ? 'bg-blue-500/10 text-blue-300' : line.startsWith('💡') ? 'bg-amber-500/10 text-amber-300' : line.startsWith('✅') ? 'bg-green-500/10 text-green-300' : line.startsWith('❌') ? 'bg-red-500/10 text-red-300' : line.startsWith('🎉') ? 'bg-gradient-to-r from-violet-500/10 to-blue-500/10 text-white font-medium' : 'bg-gray-800/50 text-gray-300'}`}>{line}</div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-violet-400" />Research Report</CardTitle>
                <CardDescription>Complete property analysis JSON</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {rawReport ? (
                    <pre className="text-xs text-gray-300 bg-gray-800/50 p-4 rounded-lg overflow-auto whitespace-pre-wrap">{rawReport}</pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Map className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">Report will appear here</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>eThekwini Property Research Agent Swarm • 10 Data Sources</p>
          <div className="mt-4 flex justify-center flex-wrap gap-4 text-xs">
            <span className="text-gray-500">Sources:</span>
            <span>OpenStreetMap</span>
            <span>Chief Surveyor General</span>
            <span>eThekwini ArcGIS</span>
            <span>Building Footprints</span>
            <span>Flood Data</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
