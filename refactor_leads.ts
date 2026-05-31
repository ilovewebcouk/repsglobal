import fs from 'fs';

const content = fs.readFileSync('src/routes/dashboard_.leads.tsx', 'utf8');

const lines = content.split('\n');

// 1. Update imports
const newImports = [
  'import { createFileRoute, Link } from "@tanstack/react-router";',
  'import {',
  '  ArrowUpRight,',
  '  CalendarPlus,',
  '  CheckCircle2,',
  '  FileText,',
  '  Mail,',
  '  MapPin,',
  '  MoreHorizontal,',
  '  Phone,',
  '  Plus,',
  '  Search,',
  '  Send,',
  '  Sparkles,',
  '  Upload,',
  '  UserCheck,',
  '} from "lucide-react";',
  '',
  'import { ProShell } from "@/components/dashboard/ProShell";',
].join('\n');

// Find the end of original imports (including proJames)
let lastImportLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('import')) {
    lastImportLine = i;
  }
}
// Ensure we skip multi-line lucide import
let endOfLucide = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('from "lucide-react"')) {
        endOfLucide = i;
    }
}
lastImportLine = Math.max(lastImportLine, endOfLucide);

// 2. Remove NAV, Sidebar, TopBar
// I'll search for the markers or specific function names
let startOfSidebar = -1;
let endOfTopBar = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('SIDEBAR — mirrors /dashboard exactly')) {
        startOfSidebar = i;
    }
    if (lines[i].includes('function TopBar()')) {
        // Find closing brace of TopBar
        let braceCount = 0;
        let started = false;
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) { braceCount += (lines[j].match(/{/g) || []).length; started = true; }
            if (lines[j].includes('}')) { braceCount -= (lines[j].match(/}/g) || []).length; }
            if (started && braceCount === 0) {
                endOfTopBar = j;
                break;
            }
        }
    }
}

// 3. Update LeadsPage
let startOfLeadsPage = -1;
let endOfLeadsPage = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function LeadsPage()')) {
        startOfLeadsPage = i;
        let braceCount = 0;
        let started = false;
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) { braceCount += (lines[j].match(/{/g) || []).length; started = true; }
            if (lines[j].includes('}')) { braceCount -= (lines[j].match(/}/g) || []).length; }
            if (started && braceCount === 0) {
                endOfLeadsPage = j;
                break;
            }
        }
    }
}

const newLeadsPage = `function LeadsPage() {
  return (
    <ProShell
      active="Leads"
      title="Leads pipeline"
      subtitle="Track enquiries, prioritise follow-ups and convert leads into clients."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Import leads
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
          >
            <Plus className="h-4 w-4" />
            New lead
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Pipeline metric strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {METRICS.map((m) => (
            <MetricCard key={m.label} m={m} />
          ))}
          <RevenueInsight />
        </div>

        {/* Main grid: pipeline + selected lead */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-8">
            <PipelinePanel />
          </div>
          <div className="col-span-12 space-y-5 xl:col-span-4">
            <SelectedLead />
            <AiInsight />
          </div>
        </div>

        {/* Lower supporting cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <FollowUpsCard />
          <LeadSourcesCard />
          <ConversionCard />
        </div>
      </div>
    </ProShell>
  );
}`;

const finalLines = [
    ...lines.slice(0, 1).filter(l => !l.startsWith('import')), // Just keep Route if needed, but wait, Route is after imports
];

// Let's be simpler: rebuild the file.
const part1 = lines.slice(0, 34); // Route definition starts around line 36
// Find where Route starts
const routeStart = lines.findIndex(l => l.includes('export const Route = createFileRoute'));
const primitivesStart = lines.findIndex(l => l.includes('PRIMITIVES'));

const result = [
    newImports,
    '',
    ...lines.slice(routeStart, primitivesStart),
    ...lines.slice(primitivesStart, startOfSidebar),
    ...lines.slice(endOfTopBar + 1, startOfLeadsPage),
    newLeadsPage
].join('\n');

fs.writeFileSync('src/routes/dashboard_.leads.tsx', result);
