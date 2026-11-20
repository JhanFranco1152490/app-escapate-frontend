import { Welcome } from '@/features/panel/components/welcome';
import { FollowUpAlertsBanner } from '@/features/quotes/components/follow-up-alerts-banner';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-7">
      <Welcome />
      <FollowUpAlertsBanner />
    </div>
  );
}
