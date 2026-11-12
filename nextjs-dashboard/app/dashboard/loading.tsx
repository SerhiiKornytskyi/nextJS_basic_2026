import DashboardSkeleton from '@/app/ui/skeletons';
 
// loading implemented ot top of React Suspense 
// This loading template applied to all the pages in the dashboard route (customers, invoices, etc.) and will be displayed while the data is being fetched from the database.
export default function Loading() {
  return <DashboardSkeleton />;
}