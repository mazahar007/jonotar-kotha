import { locationCollection } from '@/lib/location-routes';
import { getUpazilas } from '@/lib/store';

export const { GET, POST } = locationCollection('upazilas', getUpazilas, 'district_id');
