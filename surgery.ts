import fs from 'fs';

const content = fs.readFileSync('src/routes/dashboard_.leads.tsx', 'utf8');
const lines = content.split('\n');

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

// Lines are 0-indexed in array
// 1-42 are kept -> slice(0, 42)
// 213-813 are kept -> slice(212, 813)
// 814-end replaced

const result = [
    ...lines.slice(0, 42),
    ...lines.slice(212, 813),
    newLeadsPage
].join('\n');

fs.writeFileSync('src/routes/dashboard_.leads.tsx', result);
