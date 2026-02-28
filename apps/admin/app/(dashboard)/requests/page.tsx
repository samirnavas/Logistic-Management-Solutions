import { redirect } from 'next/navigation';

// This route is deprecated. All quotation requests are managed under /quotations.
export default function RequestsPage() {
    redirect('/quotations');
}
