import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import LiveShareViewer from '@/components/LiveShareViewer';

export const dynamic = 'force-dynamic';

export default async function LiveSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <LiveShareViewer id={id} />
      <BottomNav />
    </>
  );
}
