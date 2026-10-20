import type {
  AreaRating,
  BloodDonor,
  Category,
  EvidenceItem,
  FamilyMember,
  Guide,
  MapIncident,
  MunicipalityUpdate,
  Report,
  Shelter,
  SosAlert,
  Volunteer,
} from './types';

/**
 * Hardcoded fallback data reconstructed from the original single-file app's
 * mock content (ui-strings.txt). Used when Supabase is not configured or a
 * query fails. Bengali copy is kept verbatim from the source app.
 */

export const mockCategories: Category[] = [
  { id: 1, name: 'সব', sort_order: 1 },
  { id: 2, name: 'সামাজিক', sort_order: 2 },
  { id: 3, name: 'নিরাপত্তা', sort_order: 3 },
  { id: 4, name: 'সড়ক ও যানজট', sort_order: 4 },
  { id: 5, name: 'নারী নিরাপত্তা', sort_order: 5 },
  { id: 6, name: 'দুর্যোগ', sort_order: 6 },
  { id: 7, name: 'বন্যা', sort_order: 7 },
  { id: 8, name: 'ভ্রমণ সহায়তা', sort_order: 8 },
  { id: 9, name: 'দুর্নীতি', sort_order: 9 },
  { id: 10, name: 'রক্ত', sort_order: 10 },
  { id: 11, name: 'স্বাস্থ্য', sort_order: 11 },
];

export const mockReports: Report[] = [
  {
    id: 1,
    title: 'গাঙ্গিনাপাড় মোড়ে সন্ধ্যার পর বখাটেদের উৎপাত বাড়ছে',
    description:
      'গত ৩ দিন ধরে সন্ধ্যা ৭টার পর মেয়েদের স্কুল ছুটির সময় বাজে মন্তব্য করা হচ্ছে। পুলিশ টহল বাড়ানোর অনুরোধ।',
    category: 'নারী নিরাপত্তা',
    category_id: 5,
    location_name: 'গাঙ্গিনাপাড়',
    distance_m: 120,
    is_anonymous: false,
    status: 'verified',
    evidence_url: null,
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    time_ago: '১২ মিনিট আগে',
  },
  {
    id: 2,
    title: 'পৌরসভায় জন্ম নিবন্ধনে অতিরিক্ত টাকা চাওয়া হচ্ছে',
    description:
      'সাধারণ ফি ৫০ টাকা হলেও ৩০০ টাকা দাবি করা হচ্ছে, রশিদ ছাড়া। প্রমাণ ভিডিও আছে কিন্তু পরিচয় গোপন রাখতে চাই।',
    category: 'দুর্নীতি',
    category_id: 9,
    location_name: 'পৌরসভা কার্যালয়',
    distance_m: 450,
    is_anonymous: true,
    status: 'pending',
    evidence_url: null,
    created_at: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    time_ago: '৩৪ মিনিট আগে',
  },
  {
    id: 3,
    title: 'ব্রিজ রোডে বিশাল গর্ত, দুর্ঘটনার ঝুঁকি',
    description:
      'গতকাল রাতে একটি অটো উল্টে যায়। দ্রুত মেরামত প্রয়োজন। ছবি ও লোকেশন সংযুক্ত।',
    category: 'সড়ক ও যানজট',
    category_id: 4,
    location_name: 'ব্রিজ রোড',
    distance_m: 800,
    is_anonymous: false,
    status: 'in_progress',
    evidence_url: null,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    time_ago: '১ ঘণ্টা আগে',
  },
  {
    id: 4,
    title: 'রক্ত প্রয়োজন ময়মনসিংহ মেডিকেলে',
    description:
      'আমার বোনের অপারেশন আজ রাত ৯টায়। ২ ব্যাগ রক্ত প্রয়োজন। যোগাযোগ: ০১৭...',
    category: 'রক্ত',
    category_id: 10,
    location_name: 'মমেক হাসপাতাল',
    distance_m: 1200,
    is_anonymous: false,
    status: 'urgent',
    evidence_url: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    time_ago: '২ ঘণ্টা আগে',
  },
];

export const mockVolunteers: Volunteer[] = [
  { id: 1, name: 'সাব্বির হোসেন', role: 'রক্তদাতা', points: 1250, sort_order: 1 },
  { id: 2, name: 'নুসরাত জাহান', role: 'নিরাপত্তা সহায়ক', points: 980, sort_order: 2 },
  { id: 3, name: 'রাকিবুল ইসলাম', role: 'উদ্ধারকর্মী', points: 870, sort_order: 3 },
];

export const mockBloodDonors: BloodDonor[] = [
  { id: 1, name: 'সাব্বির হোসেন', blood_group: 'B+', phone_masked: '০১৭**-***২১', is_active: true, distance_m: 300 },
  { id: 2, name: 'নুসরাত জাহান', blood_group: 'AB+', phone_masked: '০১৮**-***৪৫', is_active: true, distance_m: 520 },
  { id: 3, name: 'রাকিবুল ইসলাম', blood_group: 'A-', phone_masked: '০১৯**-***৭৮', is_active: true, distance_m: 800 },
  { id: 4, name: 'তানিয়া আক্তার', blood_group: 'O+', phone_masked: '০১৬**-***৩৩', is_active: true, distance_m: 950 },
  { id: 5, name: 'মেহেদী হাসান', blood_group: 'B+', phone_masked: '০১৩**-***৬১', is_active: true, distance_m: 1100 },
];

export const mockSosAlerts: SosAlert[] = [];

export const mockEvidence: EvidenceItem[] = [
  {
    id: 1,
    title: '৩০সে ভিডিও — পৌরসভা কার্যালয়',
    media_url: null,
    encrypted: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
  },
];

export const mockFamily: FamilyMember[] = [
  { id: 1, name: 'মা', relation: 'মা', status: 'বাড়িতে', location_name: 'বাড়ি', is_live: false, sort_order: 1 },
  { id: 2, name: 'বাবা', relation: 'বাবা', status: 'বাজারে', location_name: 'বাজার', is_live: false, sort_order: 2 },
  { id: 3, name: 'ছোট বোন', relation: 'ছোট বোন', status: 'স্কুলে', location_name: 'স্কুল', is_live: true, sort_order: 3 },
];

export const mockFamilyNote = 'আজ রাতে দেরি হবে';

export const mockGuides: Guide[] = [
  { id: 1, name: 'রফিক গাইড', rating: 4.9, distance_m: 200, verified: true },
  { id: 2, name: 'আলম ট্যুর', rating: 4.7, distance_m: 450, verified: true },
];

export const mockShelters: Shelter[] = [
  { id: 1, name: 'চায়ের দোকান — গাঙ্গিনাপাড়', shelter_type: 'নিরাপদ আশ্রয়', distance_m: 150 },
  { id: 2, name: 'কমিউনিটি সেন্টার — চরপাড়া', shelter_type: 'নিরাপদ আশ্রয়', distance_m: 600 },
];

export const mockMapIncidents: MapIncident[] = [
  { id: 1, kind: 'flood', label: 'বন্যা স্তর', lat: 24.7471, lng: 90.4203 },
  { id: 2, kind: 'women_safety', label: 'নারী নিরাপত্তা', lat: 24.7501, lng: 90.4253 },
  { id: 3, kind: 'road_broken', label: 'রাস্তা ভাঙা', lat: 24.7441, lng: 90.4153 },
  { id: 4, kind: 'shelter', label: 'নিরাপদ আশ্রয় - চায়ের দোকান রাত ২টা', lat: 24.7481, lng: 90.4223 },
  { id: 5, kind: 'volunteer', label: 'স্বেচ্ছাসেবক', lat: 24.7491, lng: 90.4283 },
];

export const mockAreaRatings: AreaRating[] = [
  { id: 1, area: 'গাঙ্গিনাপাড়', score: 3.8, votes: 124 },
  { id: 2, area: 'ব্রিজ রোড', score: 3.2, votes: 86 },
  { id: 3, area: 'চরপাড়া', score: 4.1, votes: 203 },
  { id: 4, area: 'কাচিঝুলি', score: 3.5, votes: 97 },
];

export const mockMunicipalityUpdates: MunicipalityUpdate[] = [
  {
    id: 1,
    report_id: 3,
    note: '২ দিন আগে পৌরসভা দেখেছে — মেরামতের কাজ শিগগির শুরু হবে',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const SOS_NUMBERS = [
  { id: '999', title: 'জাতীয় জরুরি সেবা', number: '৯৯৯', tel: '999' },
  { id: 'women', title: 'নারী নির্যাতন প্রতিরোধ', number: '১০৯', tel: '109' },
  { id: 'info', title: 'সরকারি তথ্য ও সেবা', number: '৩৩৩', tel: '333' },
];
