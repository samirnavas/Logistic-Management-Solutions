'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Download } from 'lucide-react';

export default function InvoiceViewerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl = '';

        const fetchPdf = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quotations/${id}/invoice`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const blob = await res.blob();
                    objectUrl = window.URL.createObjectURL(blob);
                    setPdfUrl(objectUrl);
                } else {
                    console.error('Failed to load PDF');
                }
            } catch (error) {
                console.error('Network error', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPdf();
        
        return () => {
            if (objectUrl) {
                window.URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    const handleDownloadInvoice = () => {
        if (!pdfUrl) return;
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `quotation-invoice-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[100]">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/quotations/${id}`)}
                        className="p-2.5 hover:bg-slate-100 rounded-full transition text-slate-500"
                        title="Back to Quotation"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Live Invoice Viewer
                        </h1>
                        <p className="text-sm text-slate-500">Quote #{id.slice(-8).toUpperCase()}</p>
                    </div>
                </div>
                <div>
                    <button
                        onClick={handleDownloadInvoice}
                        disabled={!pdfUrl}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-5 py-2.5 rounded-lg shadow-sm transition active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-600 font-medium">Generating Live Invoice...</p>
                    </div>
                ) : pdfUrl ? (
                    <div className="w-full flex-1 bg-white relative">
                        <iframe
                            src={`${pdfUrl}#toolbar=0`}
                            className="w-full h-full border-none absolute inset-0"
                            title="Invoice PDF Viewer"
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                        <p className="text-red-500 font-medium">Failed to load invoice pdf.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
