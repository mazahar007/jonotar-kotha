import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import BroadcastDetail from '@/components/BroadcastDetail';

export const dynamic = 'force-dynamic';

export default async function BroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4">
        <BroadcastDetail id={Number(id)} />
      </main>
      <BottomNav />
    </>
  );
}
