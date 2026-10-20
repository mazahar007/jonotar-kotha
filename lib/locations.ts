import type { District, Division, Thana, UnionParishad, Upazila } from './types';

/**
 * Fallback seed for the Bangladesh administrative hierarchy
 * (বিভাগ → জেলা → উপজেলা → থানা → ইউনিয়ন). Phase 1 seed = Mymensingh.
 *
 * Verified 2026-10-21 against:
 *  - Divisions & Mymensingh Division districts: Wikipedia "Divisions of Bangladesh"
 *    / "Administrative divisions of Bangladesh" (8 divisions; Mymensingh Division =
 *    Mymensingh, Jamalpur, Netrokona, Sherpur).
 *  - Mymensingh District's 13 upazilas: Wikipedia "Mymensingh District".
 *  - Mymensingh Sadar unions: Wikipedia "Mymensingh Sadar Upazila" — currently
 *    12 union parishads; the former Akua Union was incorporated into the
 *    Mymensingh City Corporation, so it is intentionally NOT seeded.
 *  - Thana: কোতোয়ালী মডেল থানা (Kotwali Model Thana) covers Mymensingh Sadar/city.
 *
 * IDs follow the insert order of supabase/schema-v2-locations.sql on a fresh DB.
 * Other divisions/districts get their data in later phases (admin panel → লোকেশন tab).
 */

export const fallbackDivisions: Division[] = [
  { id: 1, name_bn: 'ঢাকা', name_en: 'Dhaka', slug: 'dhaka', sort_order: 1 },
  { id: 2, name_bn: 'চট্টগ্রাম', name_en: 'Chattogram', slug: 'chattogram', sort_order: 2 },
  { id: 3, name_bn: 'খুলনা', name_en: 'Khulna', slug: 'khulna', sort_order: 3 },
  { id: 4, name_bn: 'রাজশাহী', name_en: 'Rajshahi', slug: 'rajshahi', sort_order: 4 },
  { id: 5, name_bn: 'বরিশাল', name_en: 'Barishal', slug: 'barishal', sort_order: 5 },
  { id: 6, name_bn: 'রংপুর', name_en: 'Rangpur', slug: 'rangpur', sort_order: 6 },
  { id: 7, name_bn: 'সিলেট', name_en: 'Sylhet', slug: 'sylhet', sort_order: 7 },
  { id: 8, name_bn: 'ময়মনসিংহ', name_en: 'Mymensingh', slug: 'mymensingh', sort_order: 8 },
];

export const fallbackDistricts: District[] = [
  { id: 1, division_id: 8, name_bn: 'ময়মনসিংহ', name_en: 'Mymensingh', slug: 'mymensingh', sort_order: 1 },
  { id: 2, division_id: 8, name_bn: 'জামালপুর', name_en: 'Jamalpur', slug: 'jamalpur', sort_order: 2 },
  { id: 3, division_id: 8, name_bn: 'শেরপুর', name_en: 'Sherpur', slug: 'sherpur', sort_order: 3 },
  { id: 4, division_id: 8, name_bn: 'নেত্রকোণা', name_en: 'Netrokona', slug: 'netrokona', sort_order: 4 },
];

export const fallbackUpazilas: Upazila[] = [
  { id: 1, district_id: 1, name_bn: 'ময়মনসিংহ সদর', name_en: 'Mymensingh Sadar', slug: 'mymensingh-sadar', sort_order: 1 },
  { id: 2, district_id: 1, name_bn: 'ভালুকা', name_en: 'Bhaluka', slug: 'bhaluka', sort_order: 2 },
  { id: 3, district_id: 1, name_bn: 'ধোবাউড়া', name_en: 'Dhobaura', slug: 'dhobaura', sort_order: 3 },
  { id: 4, district_id: 1, name_bn: 'ফুলবাড়িয়া', name_en: 'Fulbaria', slug: 'fulbaria', sort_order: 4 },
  { id: 5, district_id: 1, name_bn: 'গফরগাঁও', name_en: 'Gaffargaon', slug: 'gaffargaon', sort_order: 5 },
  { id: 6, district_id: 1, name_bn: 'গৌরীপুর', name_en: 'Gouripur', slug: 'gouripur', sort_order: 6 },
  { id: 7, district_id: 1, name_bn: 'হালুয়াঘাট', name_en: 'Haluaghat', slug: 'haluaghat', sort_order: 7 },
  { id: 8, district_id: 1, name_bn: 'ঈশ্বরগঞ্জ', name_en: 'Ishwarganj', slug: 'ishwarganj', sort_order: 8 },
  { id: 9, district_id: 1, name_bn: 'মুক্তাগাছা', name_en: 'Muktagachha', slug: 'muktagachha', sort_order: 9 },
  { id: 10, district_id: 1, name_bn: 'নান্দাইল', name_en: 'Nandail', slug: 'nandail', sort_order: 10 },
  { id: 11, district_id: 1, name_bn: 'ফুলপুর', name_en: 'Phulpur', slug: 'phulpur', sort_order: 11 },
  { id: 12, district_id: 1, name_bn: 'তারাকান্দা', name_en: 'Tarakanda', slug: 'tarakanda', sort_order: 12 },
  { id: 13, district_id: 1, name_bn: 'ত্রিশাল', name_en: 'Trishal', slug: 'trishal', sort_order: 13 },
];

export const fallbackThanas: Thana[] = [
  { id: 1, upazila_id: 1, name_bn: 'কোতোয়ালী মডেল থানা', name_en: 'Kotwali Model Thana', slug: 'kotwali-model', sort_order: 1 },
];

export const fallbackUnions: UnionParishad[] = [
  { id: 1, upazila_id: 1, name_bn: 'অষ্টধার', name_en: 'Austadhar', slug: 'austadhar', sort_order: 1 },
  { id: 2, upazila_id: 1, name_bn: 'ভাবখালী', name_en: 'Bhabkhali', slug: 'bhabkhali', sort_order: 2 },
  { id: 3, upazila_id: 1, name_bn: 'বড়রচর', name_en: 'Bororchar', slug: 'bororchar', sort_order: 3 },
  { id: 4, upazila_id: 1, name_bn: 'বৈরা', name_en: 'Boyra', slug: 'boyra', sort_order: 4 },
  { id: 5, upazila_id: 1, name_bn: 'চর ঈশ্বরদিয়া', name_en: 'Char Ishwardia', slug: 'char-ishwardia', sort_order: 5 },
  { id: 6, upazila_id: 1, name_bn: 'চর নিলক্ষিয়া', name_en: 'Char Nilakshia', slug: 'char-nilakshia', sort_order: 6 },
  { id: 7, upazila_id: 1, name_bn: 'দাপুনিয়া', name_en: 'Dapunia', slug: 'dapunia', sort_order: 7 },
  { id: 8, upazila_id: 1, name_bn: 'ঘাগড়া', name_en: 'Ghagra', slug: 'ghagra', sort_order: 8 },
  { id: 9, upazila_id: 1, name_bn: 'খাগডহর', name_en: 'Khagdahar', slug: 'khagdahar', sort_order: 9 },
  { id: 10, upazila_id: 1, name_bn: 'কুষ্টিয়া', name_en: 'Kushtia', slug: 'kushtia', sort_order: 10 },
  { id: 11, upazila_id: 1, name_bn: 'পরাণগঞ্জ', name_en: 'Paranganj', slug: 'paranganj', sort_order: 11 },
  { id: 12, upazila_id: 1, name_bn: 'সিরতা', name_en: 'Sirta', slug: 'sirta', sort_order: 12 },
];
