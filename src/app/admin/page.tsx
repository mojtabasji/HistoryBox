import type { Metadata } from 'next';
import AdminApp from './AdminApp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HistoryBox Admin',
  description: 'Internal admin console for managing HistoryBox blog posts.',
};

export default function AdminPage() {
  return <AdminApp />;
}
