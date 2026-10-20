import { locationCollection } from '@/lib/location-routes';
import { getThanas } from '@/lib/store';

export const { GET, POST } = locationCollection('thanas', getThanas, 'upazila_id');
