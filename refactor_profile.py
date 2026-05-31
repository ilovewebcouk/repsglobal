import re

with open('src/routes/dashboard_.profile.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
unused_icons = ['Bell', 'LayoutDashboard', 'MessagesSquare', 'Search', 'Settings', 'Sparkles', 'Target', 'Users', 'Wrench']
for icon in unused_icons:
    content = re.sub(rf'\s+{icon},?\n', '\n', content)
content = re.sub(r'\s+type LucideIcon,?\n', '\n', content)

# 2. Remove NAV, NavItem, Sidebar
content = re.sub(r'/\* =+.*?SIDEBAR .*?=+ \*/.*?(?=/\* =+.*?TOP BAR)', '', content, flags=re.DOTALL)

# 3. Remove TopBar
content = re.sub(r'/\* =+.*?TOP BAR.*?=+ \*/.*?(?=/\* =+.*?ACTION BAR)', '', content, flags=re.DOTALL)

# 4. Remove buttons from ActionBar
# Find the ActionBar function and remove the buttons div
action_bar_match = re.search(r'function ActionBar\(\) \{.*?return \(.*?(<div className="flex items-center gap-2">.*?</div>).*?\);.*?\}', content, flags=re.DOTALL)
if action_bar_match:
    buttons_div = action_bar_match.group(1)
    content = content.replace(buttons_div, '')

# 5. Update ProfileEditorPage
new_profile_page = """function ProfileEditorPage() {
  return (
    <ProShell
      active="Public Profile"
      title="Profile editor"
      subtitle="Manage how your professional profile appears in the REPs directory."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Preview public profile
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ActionBar />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <PhotoAndCover />
            <BasicInfo />
            <PublicBio />
            <Services />
            <Specialisms />
            <Qualifications />
          </div>
          <aside className="flex flex-col gap-4 xl:col-span-4">
            <PublicPreview />
            <ProfileCompletion />
            <VerificationStatus />
          </aside>
        </div>
      </div>
      <DashboardFooter />
    </ProShell>
  );
}"""

content = re.sub(r'function ProfileEditorPage\(\) \{.*?\}', new_profile_page, content, flags=re.DOTALL)

# Clean up multiple newlines
content = re.sub(r'\n{3,}', '\n\n', content)

with open('src/routes/dashboard_.profile.tsx', 'w') as f:
    f.write(content)
