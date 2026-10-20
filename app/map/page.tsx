import MapClient from '@/components/MapClient';
import { getAreaRatings, getMapIncidents } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const [incidents, ratings] = await Promise.all([getMapIncidents(), getAreaRatings()]);
  return <MapClient incidents={incidents} ratings={ratings} />;
}
