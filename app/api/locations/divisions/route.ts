import { locationCollection } from '@/lib/location-routes';
import { getDivisions } from '@/lib/store';

export const { GET, POST } = locationCollection('divisions', () => getDivisions());
