import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import RoadDetail from '@/components/RoadDetail';

export const dynamic = 'force-dynamic';

export default async function RoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <RoadDetail id={Number(id)} />
      <BottomNav />
    </>
  );
}
