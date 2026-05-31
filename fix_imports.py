import sys

with open('src/routes/admin.tsx', 'r') as f:
    lines = f.readlines()

# Find the end of imports (should be before proJames)
pro_james_index = -1
for i, line in enumerate(lines):
    if 'import proJames' in line:
        pro_james_index = i
        break

new_content = [
    'import { createFileRoute, Link } from "@tanstack/react-router";\n',
    'import {\n',
    '  ChevronDown,\n',
    '  ChevronRight,\n',
    '  FileText,\n',
    '  GraduationCap,\n',
    '  ShieldCheck,\n',
    '  Star,\n',
    '  TrendingDown,\n',
    '  TrendingUp,\n',
    '  UserCheck,\n',
    '  UserPlus,\n',
    '  Users,\n',
    '  Wallet,\n',
    '  type LucideIcon,\n',
    '} from "lucide-react";\n',
    '\n',
    'import { AdminShell } from "@\/components\/dashboard\/AdminShell";\n',
    '\n'
]

# The remaining content from pro_james_index
final_content = new_content + lines[pro_james_index:]

with open('src/routes/admin.tsx', 'w') as f:
    f.writelines(final_content)
