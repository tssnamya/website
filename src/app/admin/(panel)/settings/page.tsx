import { PageHeader } from "@/components/admin/page-header"
import { SettingsForm } from "@/components/admin/settings-form"
import { getSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const settings = await getSettings()
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your store details, shipping, and payment information."
      />
      <SettingsForm settings={settings} />
    </div>
  )
}
