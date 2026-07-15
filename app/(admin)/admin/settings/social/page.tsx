import SocialSettingsForm from "@/components/admin/social-settings-form";

export const metadata = {
  title: "Admin Settings — Social Links",
};

export default async function SocialSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-4">Social Links</h1>
      <p className="text-sm text-zinc-400 mb-6">Configure platform social links that appear on public tutorial pages.</p>
      <SocialSettingsForm />
    </div>
  );
}
