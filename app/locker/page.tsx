import LockerClient from '@/components/LockerClient';
import { getEvidence } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function LockerPage() {
  const items = await getEvidence();
  return <LockerClient items={items} />;
}
