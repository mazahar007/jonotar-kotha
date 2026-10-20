import { locationCollection } from '@/lib/location-routes';
import { getDistricts } from '@/lib/store';

export const { GET, POST } = locationCollection('districts', getDistricts, 'division_id');
