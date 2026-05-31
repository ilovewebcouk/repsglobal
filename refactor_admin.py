import sys

with open('src/routes/admin.tsx', 'r') as f:
    lines = f.readlines()

import_start = -1
import_end = -1
for i, line in enumerate(lines):
    if line.startswith('import {') and 'lucide-react' in ''.join(lines[i:i+30]):
        import_start = i
        for j in range(i, i+30):
            if '} from "lucide-react";' in lines[j]:
                import_end = j
                break
        break

new_lucide_imports = [
    '  ChevronDown,',
    '  ChevronRight,',
    '  FileText,',
    '  GraduationCap,',
    '  ShieldCheck,',
    '  Star,',
    '  TrendingDown,',
    '  TrendingUp,',
    '  UserCheck,',
    '  UserPlus,',
    '  Users,',
    '  Wallet,',
    '  type LucideIcon,',
]

new_imports = lines[:import_start]
new_imports.append('import {\n')
new_imports.extend(new_lucide_imports)
new_imports.append('} from "lucide-react";\n')
new_imports.append('\n')
new_imports.append('import { AdminShell } from "@/components/dashboard/AdminShell";\n')

# Find where Sidebar starts and where PRIMITIVES starts
sidebar_start = -1
primitives_start = -1
for i, line in enumerate(lines):
    if 'SIDEBAR' in line:
        sidebar_start = i
    if 'PRIMITIVES' in line:
        primitives_start = i
        break

# Find where TOP BAR starts
topbar_start = -1
for i, line in enumerate(lines):
    if 'TOP BAR' in line:
        topbar_start = i
        break

# The section to remove is from sidebar_start to primitives_start
# But we need to keep the imports and Route definition

# Middle section: from import_end + 1 to sidebar_start
middle_section = lines[import_end+1:sidebar_start]

# Primitives section: from primitives_start to AdminDashboardPage
page_start = -1
for i, line in enumerate(lines):
    if 'function AdminDashboardPage()' in line:
        page_start = i
        break

primitives_section = lines[primitives_start:page_start]

# New AdminDashboardPage
new_page = [
    'function AdminDashboardPage() {\n',
    '  return (\n',
    '    <AdminShell\n',
    '      active="Overview"\n',
    '      title="Platform Overview"\n',
    '      subtitle="Real-time overview of the REPs platform and key operational metrics."\n',
    '      actions={<RangePill />}\n',
    '    >\n',
    '      <div className="space-y-6">\n',
    '        <KpiRow />\n',
    '        <RegistrationsAndSpecialisms />\n',
    '        <ActivityRow />\n',
    '        <RevenueAndMembership />\n',
    '        <BreakdownRow />\n',
    '        <TopProsTable />\n',
    '      </div>\n',
    '    </AdminShell>\n',
    '  );\n',
    '}\n'
]

final_content = new_imports + middle_section + primitives_section + new_page

with open('src/routes/admin.tsx', 'w') as f:
    f.writelines(final_content)
