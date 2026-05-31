import re

with open('src/routes/dashboard_.profile.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
pro_shell_line = ''
in_lucide_import = False

for line in lines:
    if 'import { ProShell }' in line:
        pro_shell_line = line
        continue
    new_lines.append(line)

final_lines = []
for line in new_lines:
    final_lines.append(line)
    if 'import { createFileRoute' in line:
        final_lines.append(pro_shell_line)

with open('src/routes/dashboard_.profile.tsx', 'w') as f:
    f.writelines(final_lines)
