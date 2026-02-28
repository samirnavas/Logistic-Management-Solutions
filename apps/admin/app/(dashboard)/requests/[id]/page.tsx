import { redirect } from 'next/navigation';

// This route is deprecated. All quotation detail views are under /quotations/[id].
export default function RequestDetailsPage({ params }: { params: { id: string } }) {
    redirect(`/quotations/${params.id}`);
}
