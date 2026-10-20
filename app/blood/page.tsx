import BloodClient from '@/components/BloodClient';
import { getBloodDonors } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function BloodPage() {
  const donors = await getBloodDonors();
  return <BloodClient donors={donors} />;
}
