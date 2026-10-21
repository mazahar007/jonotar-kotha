import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import BroadcastsClient from '@/components/BroadcastsClient';

export const dynamic = 'force-dynamic';

export default function BroadcastsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4">
        <BroadcastsClient />
      </main>
      <BottomNav />
    </>
  );
}
