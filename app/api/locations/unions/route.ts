import { locationCollection } from '@/lib/location-routes';
import { getUnions } from '@/lib/store';

export const { GET, POST } = locationCollection('unions', getUnions, 'upazila_id');
