import re

with open('src/routes/dashboard_.check-ins.tsx', 'r') as f:
    content = f.read()

# 1. Add ProShell import
content = content.replace(
    'import proJames from "@/assets/pro-james.jpg";',
    'import { ProShell } from "@/components/dashboard/ProShell";'
)

# 2. Clean up lucide-react imports
# Remove: Apple, AreaChart, Bell, Calendar as CalendarIcon, ClipboardList, CreditCard, Dumbbell, GraduationCap, LayoutDashboard, MessagesSquare, Settings, Target, Users, Wrench, type LucideIcon
content = re.sub(r'\s+Apple,', '', content)
content = re.sub(r'\s+AreaChart,', '', content)
content = re.sub(r'\s+Bell,', '', content)
content = re.sub(r'\s+Calendar as CalendarIcon,', '', content)
content = re.sub(r'\s+ClipboardList,', '', content)
content = re.sub(r'\s+CreditCard,', '', content)
content = re.sub(r'\s+Dumbbell,', '', content)
content = re.sub(r'\s+GraduationCap,', '', content)
content = re.sub(r'\s+LayoutDashboard,', '', content)
content = re.sub(r'\s+MessagesSquare,', '', content)
content = re.sub(r'\s+Settings,', '', content)
content = re.sub(r'\s+Target,', '', content)
content = re.sub(r'\s+Users,', '', content)
content = re.sub(r'\s+Wrench,', '', content)
content = re.sub(r'\s+type LucideIcon,', '', content)

# 3. Delete Sidebar, TopBar, NAV, NavItem
# These are between /* === SIDEBAR === */ and /* === PRIMITIVES === */
# Actually they are lines 56 to 230 approx.
content = re.sub(r'/\* =+.*?SIDEBAR.*?=+ \*/.*?type NavItem = \{.*?\}\[\] = \[.*?\];.*?function Sidebar\(\) \{.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'/\* =+.*?TOP BAR.*?=+ \*/.*?function TopBar\(\) \{.*?\}', '', content, flags=re.DOTALL)

# 4. Replace CheckInsReviewPage
new_component = """
function CheckInsReviewPage() {
  return (
    <ProShell
      active="Check-Ins"
      title="Check-ins"
      subtitle="Review client updates, track adherence and respond with clear next steps."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
          >
            <FileText className="h-4 w-4" />
            Create template
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
          >
            <Send className="h-4 w-4" />
            Send check-in
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <KpiRow />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-3">
            <Inbox />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <ReviewPanel />
          </div>
          <div className="col-span-12 space-y-5 xl:col-span-3">
            <AISummaryCard />
            <CoachResponseCard />
            <RiskIndicators />
            <NextActions />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <AtRiskClients />
          <Templates />
          <AdherenceTrends />
        </div>
      </div>
    </ProShell>
  );
}
"""

content = re.sub(r'function CheckInsReviewPage\(\) \{.*?\}', new_component, content, flags=re.DOTALL)

with open('src/routes/dashboard_.check-ins.tsx', 'w') as f:
    f.write(content)
