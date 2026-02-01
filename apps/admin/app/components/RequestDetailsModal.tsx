
import { useEffect, useState } from 'react';

interface RequestDetailsModalProps {
    requestId: string;
    onClose: () => void;
    onStatusChange?: () => void;
}

export default function RequestDetailsModal({ requestId, onClose, onStatusChange }: RequestDetailsModalProps) {
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [quotationViewMode, setQuotationViewMode] = useState<'create' | 'view'>('create'); // Toggle between create form and view details

    // Quotation Form State
    const [productBasePrice, setProductBasePrice] = useState(0);
    const [deliveryCharges, setDeliveryCharges] = useState(0);
    const [packagingCharges, setPackagingCharges] = useState(0);
    const [insuranceCharges, setInsuranceCharges] = useState(0);
    const [taxPercentage, setTaxPercentage] = useState(0); // Tax as percentage
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed'); // Discount type
    const [discountValue, setDiscountValue] = useState(0); // Discount value
    const [validUntil, setValidUntil] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [deliveryConditions, setDeliveryConditions] = useState('');
    const [otherInformation, setOtherInformation] = useState('');

    // Calculate subtotal (sum of all charges before tax and discount)
    const subtotal = productBasePrice + deliveryCharges + packagingCharges + insuranceCharges;

    // Calculate tax amount from percentage
    const taxAmount = (subtotal * taxPercentage) / 100;

    // Calculate discount amount (either percentage or fixed)
    const discountAmount = discountType === 'percentage'
        ? (subtotal * discountValue) / 100
        : discountValue;

    // Calculate final quoted amount
    const finalQuotedAmount = subtotal + taxAmount - discountAmount;

    // Helper function to format dates
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Function to populate form fields from quotation data
    const populateFormFromQuotation = (quotation: any) => {
        if (!quotation.items || quotation.items.length === 0) return;

        // Extract values from line items
        quotation.items.forEach((item: any) => {
            const desc = item.description.toLowerCase();
            if (desc.includes('product base price')) {
                setProductBasePrice(item.amount || 0);
            } else if (desc.includes('delivery') || desc.includes('transportation')) {
                setDeliveryCharges(item.amount || 0);
            } else if (desc.includes('packaging')) {
                setPackagingCharges(item.amount || 0);
            } else if (desc.includes('insurance')) {
                setInsuranceCharges(item.amount || 0);
            }
        });

        // Set tax percentage from taxRate
        if (quotation.taxRate) {
            setTaxPercentage(quotation.taxRate);
        }

        // Set discount
        if (quotation.discount) {
            setDiscountValue(quotation.discount);
            setDiscountType('fixed'); // Default to fixed for existing quotations
        }

        // Set validity
        if (quotation.validUntil) {
            const date = new Date(quotation.validUntil);
            setValidUntil(date.toISOString().split('T')[0]);
        }

        // Extract notes (Prefer additionalNotes, fallback to internalNotes)
        const notesSource = quotation.additionalNotes || quotation.internalNotes;
        if (notesSource) {
            const notes = notesSource.split('\n');
            notes.forEach((note: string) => {
                if (note.includes('Payment Terms:')) {
                    setPaymentTerms(note.replace('Payment Terms:', '').trim());
                } else if (note.includes('Delivery Conditions:')) {
                    setDeliveryConditions(note.replace('Delivery Conditions:', '').trim());
                } else if (note.includes('Other Information:')) {
                    setOtherInformation(note.replace('Other Information:', '').trim());
                }
            });
        }
    };

    // Helper function to get display values from saved quotation
    const getDisplayValues = () => {
        if (!request) return {};

        const values: any = {
            productBasePrice: 0,
            deliveryCharges: 0,
            packagingCharges: 0,
            insuranceCharges: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0
        };

        // If items exist, extract from them
        if (request.items && request.items.length > 0) {
            request.items.forEach((item: any) => {
                const desc = item.description?.toLowerCase() || '';
                if (desc.includes('product base price')) {
                    values.productBasePrice = item.amount || 0;
                } else if (desc.includes('delivery') || desc.includes('transportation')) {
                    values.deliveryCharges = item.amount || 0;
                } else if (desc.includes('packaging')) {
                    values.packagingCharges = item.amount || 0;
                } else if (desc.includes('insurance')) {
                    values.insuranceCharges = item.amount || 0;
                } else if (desc.includes('tax')) {
                    values.taxAmount = item.amount || 0;
                }
            });
        }

        // Get discount and total from request
        values.discountAmount = request.discount || 0;
        values.totalAmount = request.totalAmount || 0;

        return values;
    };

    const displayValues = getDisplayValues();

    // Fetch request data
    const fetchRequest = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${requestId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequest(data);

                // Auto-open quotation details ONLY if quotation has been processed (price calculated or further)
                const processedStatuses = ['cost_calculated', 'sent', 'accepted', 'ready_for_pickup', 'shipped', 'delivered'];
                if (processedStatuses.includes(data.status)) {
                    setShowQuoteForm(true);
                    setQuotationViewMode('view');
                    populateFormFromQuotation(data);
                } else if (data.status === 'details_submitted') {
                    // Pre-fill form if details are submitted (e.g. addresses might have changed)
                    populateFormFromQuotation(data);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
    }, [requestId]);

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Convert price breakdown into line items format
            const items = [];
            if (productBasePrice > 0) {
                items.push({
                    description: 'Product Base Price',
                    quantity: 1,
                    unitPrice: productBasePrice,
                    amount: productBasePrice,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'freight'
                });
            }
            if (deliveryCharges > 0) {
                items.push({
                    description: 'Delivery/Transportation Charges',
                    quantity: 1,
                    unitPrice: deliveryCharges,
                    amount: deliveryCharges,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'freight'
                });
            }
            if (packagingCharges > 0) {
                items.push({
                    description: 'Packaging Charges',
                    quantity: 1,
                    unitPrice: packagingCharges,
                    amount: packagingCharges,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'handling'
                });
            }
            if (insuranceCharges > 0) {
                items.push({
                    description: 'Insurance Charges',
                    quantity: 1,
                    unitPrice: insuranceCharges,
                    amount: insuranceCharges,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'insurance'
                });
            }
            if (taxAmount > 0) {
                items.push({
                    description: `Taxes (GST ${taxPercentage}%)`,
                    quantity: 1,
                    unitPrice: taxAmount,
                    amount: taxAmount,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'other'
                });
            }

            // Prepare notes including payment terms and other information
            const notesArray = [];
            if (paymentTerms) notesArray.push(`Payment Terms: ${paymentTerms}`);
            if (deliveryConditions) notesArray.push(`Delivery Conditions: ${deliveryConditions}`);
            if (otherInformation) notesArray.push(`Other Information: ${otherInformation}`);
            const combinedNotes = notesArray.join('\n');

            const payload = {
                items: items.length > 0 ? items : [{ description: 'Service Charge', quantity: 1, unitPrice: 0, amount: 0, category: 'other' }],
                taxRate: taxPercentage, // Tax percentage
                discount: Number(discountAmount),
                additionalNotes: combinedNotes,
                validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'cost_calculated' // Valid status for pricing entered but not sent
            };

            console.log('Payload being sent:', JSON.stringify(payload, null, 2));

            const updateRes = await fetch(`/api/quotations/${requestId}/update-price`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                console.error('Backend Error Response:', errorData);
                console.error('Payload sent:', payload);
                throw new Error(errorData.message || errorData.error || 'Failed to save draft');
            }

            const updatedData = await updateRes.json();
            setRequest(updatedData.quotation || updatedData);
            setQuotationViewMode('view'); // Switch to view mode
            if (onStatusChange) onStatusChange();

        } catch (err: any) {
            console.error('Full error:', err);
            alert('Error saving draft: ' + (err.message || err));
        }
    };

    const handleSendToCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Convert price breakdown into line items format
            const items = [];
            if (productBasePrice > 0) {
                items.push({
                    description: 'Product Base Price',
                    quantity: 1,
                    unitPrice: productBasePrice,
                    amount: productBasePrice,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'freight'
                });
            }
            if (deliveryCharges > 0) {
                items.push({
                    description: 'Delivery/Transportation Charges',
                    quantity: 1,
                    unitPrice: deliveryCharges,
                    amount: deliveryCharges,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'freight'
                });
            }
            if (packagingCharges > 0) {
                items.push({
                    description: 'Packaging Charges',
                    quantity: 1,
                    unitPrice: packagingCharges,
                    amount: packagingCharges,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'handling'
                });
            }
            if (insuranceCharges > 0) {
                items.push({
                    description: 'Insurance Charges',
                    quantity: 1,
                    unitPrice: insuranceCharges,
                    amount: insuranceCharges,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'insurance'
                });
            }
            if (taxAmount > 0) {
                items.push({
                    description: `Taxes (GST ${taxPercentage}%)`,
                    quantity: 1,
                    unitPrice: taxAmount,
                    amount: taxAmount,
                    weight: 0,
                    dimensions: 'N/A',
                    category: 'other'
                });
            }

            // Prepare notes including payment terms and other information
            const notesArray = [];
            if (paymentTerms) notesArray.push(`Payment Terms: ${paymentTerms}`);
            if (deliveryConditions) notesArray.push(`Delivery Conditions: ${deliveryConditions}`);
            if (otherInformation) notesArray.push(`Other Information: ${otherInformation}`);
            const combinedNotes = notesArray.join('\n');

            const payload = {
                items: items.length > 0 ? items : [{ description: 'Service Charge', quantity: 1, unitPrice: 0, amount: 0, category: 'other' }],
                taxRate: taxPercentage,
                discount: Number(discountAmount),
                additionalNotes: combinedNotes,
                validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'cost_calculated'
            };

            console.log('Send to Customer - Payload being sent:', JSON.stringify(payload, null, 2));

            const updateRes = await fetch(`/api/quotations/${requestId}/update-price`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.message || 'Failed to update quotation details');
            }

            const approveRes = await fetch(`/api/quotations/${requestId}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!approveRes.ok) throw new Error('Failed to approve quotation');

            const sendRes = await fetch(`/api/quotations/${requestId}/send`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!sendRes.ok) throw new Error('Failed to send quotation');

            // Refetch to get updated data
            await fetchRequest();
            setQuotationViewMode('view'); // Switch to view mode
            if (onStatusChange) onStatusChange();

        } catch (err) {
            console.error(err);
            alert('Error sending quotation: ' + err);
        }
    };

    const handleApproveRequest = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${requestId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to approve request');

            // Refetch to get updated data
            await fetchRequest();
            if (onStatusChange) onStatusChange();
            alert('Request approved successfully!');
        } catch (err: any) {
            console.error(err);
            alert('Error approving request: ' + err.message);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-xl shadow-xl">Loading details...</div>
        </div>
    );

    if (!request) return null;

    return (
        <>
            {!showQuoteForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
                    <div
                        className="bg-white rounded-xl shadow-2xl relative w-[95%] sm:w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Section (Fixed) */}
                        <div className="flex-none flex justify-between items-start p-6 border-b border-gray-100 bg-white z-10">
                            <div>
                                <h1 className="text-xl font-bold text-zinc-800 mb-2">Request Detail</h1>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-zinc-600 font-medium border border-slate-200">
                                        ID: <span className="text-zinc-900">{request.quotationId}</span>
                                    </span>
                                    <span className={`px-3 py-1 rounded-full font-medium border ${['request_sent', 'pending_review', 'PENDING_REVIEW'].includes(request.status) ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        ['cost_calculated', 'draft', 'DRAFT'].includes(request.status) ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            ['approved', 'verified', 'VERIFIED'].includes(request.status) ? 'bg-green-50 text-green-700 border-green-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                        }`}>
                                        {['request_sent', 'pending_review', 'PENDING_REVIEW'].includes(request.status) ? 'New Request' :
                                            ['cost_calculated', 'draft', 'DRAFT'].includes(request.status) ? 'Draft' :
                                                ['approved', 'verified', 'VERIFIED'].includes(request.status) ? 'Approved' : request.status}
                                    </span>
                                </div>
                            </div>
                            {/* Close Button */}
                            <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            <div className="space-y-6">
                                {/* Top Row: Client & Route Info (2 Columns) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Client Information */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                                        <h2 className="text-lg font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                                            Client Information
                                        </h2>

                                        <div className="space-y-4">
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <span className="text-zinc-500 text-xs mb-1">Client Name</span>
                                                <span className="text-zinc-900 text-sm font-semibold">{request.clientId?.fullName || 'Guest User'}</span>
                                            </div>
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <span className="text-zinc-500 text-xs mb-1">Email Address</span>
                                                <span className="text-zinc-900 text-sm font-medium break-all">{request.clientId?.email || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <span className="text-zinc-500 text-xs mb-1">Account Phone</span>
                                                <span className="text-zinc-900 text-sm font-medium">{request.clientId?.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Route Information */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                                        <h2 className="text-lg font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                                            Route Information
                                        </h2>

                                        <div className="space-y-4">
                                            {/* Pickup Section */}
                                            <div className="p-3 bg-gray-50 rounded-lg border-l-2 border-green-500">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Pickup</span>
                                                    <span className="text-[10px] text-zinc-500">{request.pickupDate ? formatDate(request.pickupDate) : 'Date Pending'}</span>
                                                </div>
                                                <div className="text-sm font-semibold text-zinc-900 mb-1">{request.origin?.name || request.clientId?.fullName}</div>
                                                <div className="text-xs text-zinc-600 mb-2">{request.origin?.phone}</div>
                                                <div className="text-xs text-zinc-800 leading-relaxed">
                                                    {request.origin?.addressLine}<br />
                                                    {request.origin?.city}, {request.origin?.state}<br />
                                                    {request.origin?.zip}, {request.origin?.country}
                                                </div>
                                            </div>

                                            {/* Delivery Section */}
                                            <div className="p-3 bg-gray-50 rounded-lg border-l-2 border-red-500">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Delivery</span>
                                                </div>
                                                {(request.destination?.name === 'To Be Confirmed' ||
                                                    request.destination?.phone?.includes('999999') ||
                                                    request.destination?.zip === '00000' ||
                                                    request.destination?.addressLine?.includes('To Be Confirmed')) ? (
                                                    <div className="py-2">
                                                        <div className="text-sm font-medium text-zinc-500 italic flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            To Be Confirmed
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm font-semibold text-zinc-900 mb-1">{request.destination?.name || 'TBC'}</div>
                                                        <div className="text-xs text-zinc-600 mb-2">{request.destination?.phone}</div>
                                                        <div className="text-xs text-zinc-800 leading-relaxed">
                                                            {request.destination?.addressLine}<br />
                                                            {request.destination?.city}, {request.destination?.state}<br />
                                                            {request.destination?.zip}, {request.destination?.country}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Full Width: Items & Specs */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                                        Shipment Details
                                    </h2>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Left: General Mode/Special Instructions */}
                                        <div className="lg:col-span-1 space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500 text-sm">Service Mode</span>
                                                    <span className="font-semibold text-zinc-900">{request.serviceType}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500 text-sm">Cargo Type</span>
                                                    <span className="font-semibold text-zinc-900">{request.cargoType}</span>
                                                </div>
                                                <div className="pt-3 border-t border-gray-200">
                                                    <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-2">Special Instructions</span>
                                                    <p className="text-sm text-zinc-800 italic">
                                                        "{request.specialInstructions || 'None provided'}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Items List */}
                                        <div className="lg:col-span-2">
                                            <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                                                <span>Items Manifest</span>
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{request.items?.length || 0}</span>
                                            </h3>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {request.items?.map((item: any, index: number) => (
                                                    <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-bold text-zinc-800">{item.description}</span>
                                                                    {item.priority === 'Express' && (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold tracking-wide">EXPRESS</span>
                                                                    )}
                                                                    {item.isHazardous && (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-bold tracking-wide">HAZARDOUS</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-zinc-500">Category: {item.category}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-mono font-medium text-zinc-900">{item.quantity} x Box</div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                            <div>
                                                                <div className="text-zinc-400 mb-0.5">Weight</div>
                                                                <div className="font-medium text-zinc-900">{item.weight} kg</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-400 mb-0.5">Dims (cm)</div>
                                                                <div className="font-medium text-zinc-900">{item.dimensions}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-400 mb-0.5">Volume</div>
                                                                <div className="font-medium text-zinc-900">{item.packingVolume ? `${item.packingVolume} m³` : '-'}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-400 mb-0.5">Target Rate</div>
                                                                <div className="font-medium text-green-700">{item.targetRate ? `₹${item.targetRate}` : '-'}</div>
                                                            </div>
                                                        </div>

                                                        {/* Visuals */}
                                                        {(item.images?.length > 0 || item.videoUrl) && (
                                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                                                                {item.images?.map((img: string, i: number) => (
                                                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded border border-gray-200 overflow-hidden hover:opacity-80">
                                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                                    </a>
                                                                ))}
                                                                {item.videoUrl && (
                                                                    <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs flex items-center gap-1 text-blue-600 font-medium hover:underline">
                                                                        <span>🎥 Watch Video</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Breakdown (Only if Calculated) */}
                                {request.totalAmount > 0 && ['cost_calculated', 'sent', 'accepted', 'ready_for_pickup', 'shipped', 'delivered', 'QUOTATION_SENT', 'ACCEPTED', 'BOOKED'].includes(request.status) && (
                                    <div className="bg-gradient-to-br from-gray-900 to-zinc-800 rounded-xl shadow-lg p-6 text-white">
                                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                            {request.status === 'cost_calculated' ? 'Quotation Summary (Draft)' : 'Quotation Summary'}
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                            <div>
                                                <span className="text-gray-400 text-sm block mb-1">Subtotal</span>
                                                <div className="text-xl font-medium">₹ {request.subtotal?.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 text-sm block mb-1">Tax ({request.taxRate}%)</span>
                                                <div className="text-xl font-medium">₹ {request.tax?.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 text-sm block mb-1">Discount</span>
                                                <div className="text-xl font-medium text-red-300">- ₹ {request.discount?.toLocaleString() || 0}</div>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                                                <span className="text-green-300 text-sm block mb-1 font-bold tracking-wide uppercase">Grand Total</span>
                                                <div className="text-3xl font-bold">
                                                    ₹ {request.totalAmount?.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons (Fixed) */}
                        <div className="flex-none p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end gap-3 z-10">
                            <button className="order-1 sm:order-none w-full sm:w-auto border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                                Add Internal Notes
                            </button>

                            {['request_sent', 'pending_review', 'PENDING_REVIEW'].includes(request.status) && (
                                <button
                                    onClick={handleApproveRequest}
                                    className="w-full sm:w-auto bg-sky-700 text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-sky-800 transition-colors shadow-sm shadow-sky-700/20"
                                >
                                    Approve Request
                                </button>
                            )}

                            {['approved', 'verified', 'VERIFIED'].includes(request.status) && (
                                <div className="w-full sm:w-auto bg-yellow-50 text-yellow-800 px-6 py-2.5 rounded-lg border border-yellow-200 flex items-center justify-center shadow-sm">
                                    <span className="mr-2">⏳</span>
                                    <span className="font-medium text-sm">Waiting for client to provide details</span>
                                </div>
                            )}

                            {request.status === 'details_submitted' && (
                                <button
                                    onClick={() => {
                                        setShowQuoteForm(true);
                                        setQuotationViewMode('create');
                                    }}
                                    className="w-full sm:w-auto bg-green-600 text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
                                >
                                    Calculate Price
                                </button>
                            )}

                            {['cost_calculated', 'sent', 'accepted', 'ready_for_pickup', 'shipped', 'delivered'].includes(request.status) && (
                                <button
                                    onClick={() => {
                                        setShowQuoteForm(true);
                                        setQuotationViewMode('view');
                                    }}
                                    className="w-full sm:w-auto bg-sky-700 text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-sky-800 transition-colors shadow-sm shadow-sky-700/20"
                                >
                                    View Quotation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quotation Form/Details Modal (Overlay) */}
            {showQuoteForm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4 sm:p-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (quotationViewMode === 'view') {
                            onClose();
                        } else {
                            setShowQuoteForm(false);
                        }
                    }}
                >
                    <div
                        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl relative h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <h1 className="text-xl font-bold text-[#333333] flex items-center gap-3">
                                {quotationViewMode === 'create' ? (
                                    <>
                                        <span className="w-2 h-8 bg-[#0557A5] rounded-full"></span>
                                        Create Quotation
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-8 bg-[#0557A5] rounded-full"></span>
                                        Quotation Details
                                    </>
                                )}
                            </h1>
                            <button
                                onClick={() => {
                                    if (quotationViewMode === 'view') onClose();
                                    else setShowQuoteForm(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F5F5] hover:bg-gray-200 text-[#868686] hover:text-[#333333] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                            {quotationViewMode === 'create' ? (
                                /* CREATE/EDIT FORM */
                                <form onSubmit={(e) => e.preventDefault()} className="h-full">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                                        {/* Left Column (Metadata & Terms) - Spans 5/12 */}
                                        <div className="lg:col-span-5 space-y-6">
                                            {/* Info Card */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                                <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                                    Reference Info
                                                </h2>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-zinc-500 text-sm">Quotation ID</span>
                                                        <span className="text-zinc-900 font-mono font-medium">{request.quotationId || 'QT-NEW'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-zinc-500 text-sm">Client</span>
                                                        <span className="text-zinc-900 font-medium">{request.clientId?.fullName || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wide mb-1.5 block">Valid Until</label>
                                                        <input
                                                            type="date"
                                                            className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 font-medium"
                                                            value={validUntil}
                                                            onChange={(e) => setValidUntil(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terms & Notes */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                                <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                                    Terms & Conditions
                                                </h2>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Payment Terms</label>
                                                        <textarea
                                                            placeholder="e.g. 50% advance, 50% on delivery"
                                                            rows={2}
                                                            className="w-full bg-[#F5F5F5] border-0 rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 resize-none"
                                                            value={paymentTerms}
                                                            onChange={(e) => setPaymentTerms(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Delivery Conditions</label>
                                                        <textarea
                                                            placeholder="e.g. Door to Door, Unloading by client"
                                                            rows={2}
                                                            className="w-full bg-[#F5F5F5] border-0 rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 resize-none"
                                                            value={deliveryConditions}
                                                            onChange={(e) => setDeliveryConditions(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Other Info</label>
                                                        <textarea
                                                            placeholder="Any other special instructions..."
                                                            rows={2}
                                                            className="w-full bg-[#F5F5F5] border-0 rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 resize-none"
                                                            value={otherInformation}
                                                            onChange={(e) => setOtherInformation(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column (Financials) - Spans 7/12 */}
                                        <div className="lg:col-span-7">
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                                                <h2 className="text-lg font-bold text-zinc-800 mb-6 flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">₹</span>
                                                    Price Breakdown
                                                </h2>

                                                <div className="space-y-5 flex-1">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Base Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868686]">₹</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full pl-8 pr-5 py-2.5 bg-[#F5F5F5] border-0 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 transition-all font-medium text-[#333333] placeholder:text-[#868686]"
                                                                    placeholder="0.00"
                                                                    value={productBasePrice || ''}
                                                                    onChange={(e) => setProductBasePrice(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Delivery Charges</label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868686]">₹</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full pl-8 pr-5 py-2.5 bg-[#F5F5F5] border-0 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 transition-all font-medium text-[#333333] placeholder:text-[#868686]"
                                                                    placeholder="0.00"
                                                                    value={deliveryCharges || ''}
                                                                    onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Packaging</label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868686]">₹</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full pl-8 pr-5 py-2.5 bg-[#F5F5F5] border-0 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 transition-all font-medium text-[#333333] placeholder:text-[#868686]"
                                                                    placeholder="0.00"
                                                                    value={packagingCharges || ''}
                                                                    onChange={(e) => setPackagingCharges(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Insurance</label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868686]">₹</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full pl-8 pr-5 py-2.5 bg-[#F5F5F5] border-0 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 transition-all font-medium text-[#333333] placeholder:text-[#868686]"
                                                                    placeholder="0.00"
                                                                    value={insuranceCharges || ''}
                                                                    onChange={(e) => setInsuranceCharges(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-gray-100 my-4"></div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Tax Rate (%)</label>
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="number"
                                                                    className="flex-1 px-5 py-2.5 bg-[#F5F5F5] border-0 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 transition-all font-medium text-[#333333] placeholder:text-[#868686]"
                                                                    placeholder="18"
                                                                    value={taxPercentage || ''}
                                                                    onChange={(e) => setTaxPercentage(Number(e.target.value))}
                                                                />
                                                                <span className="text-[#333333] text-sm font-medium bg-[#F5F5F5] px-4 py-2.5 rounded-[20px]">
                                                                    ₹ {taxAmount.toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Discount</label>
                                                            <div className="flex gap-2">
                                                                <select
                                                                    value={discountType}
                                                                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                                                    className="bg-[#F5F5F5] rounded-[20px] px-4 py-2 text-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                                >
                                                                    <option value="fixed">₹</option>
                                                                    <option value="percentage">%</option>
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    className="flex-1 px-5 py-2.5 bg-[#F5F5F5] border-0 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20 transition-all font-medium text-[#333333] placeholder:text-[#868686]"
                                                                    placeholder="0"
                                                                    value={discountValue || ''}
                                                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-8 bg-zinc-900 rounded-xl p-6 text-white flex justify-between items-center shadow-lg">
                                                    <div>
                                                        <p className="text-gray-400 text-sm mb-1">Total Quotation Value</p>
                                                        <p className="text-2xl font-bold tracking-tight">INR</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-4xl font-bold">₹ {finalQuotedAmount.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                /* QUOTATION DETAILS VIEW */
                                <div className="space-y-6">
                                    {/* Status Banner */}
                                    <div className={`rounded-xl p-4 flex justify-between items-center border ${request.status === 'cost_calculated' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                        request.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' :
                                            request.status === 'sent' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                                'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${request.status === 'cost_calculated' ? 'bg-purple-100' :
                                                request.status === 'approved' ? 'bg-green-100' : 'bg-white'
                                                }`}>
                                                {request.status === 'cost_calculated' ? '📝' : '✓'}
                                            </span>
                                            <div>
                                                <div className="font-bold text-sm uppercase tracking-wide opacity-80">Current Status</div>
                                                <div className="text-lg font-bold">
                                                    {request.status === 'cost_calculated' ? 'Draft Quotation' :
                                                        request.status === 'sent' ? 'Sent to Customer' :
                                                            request.status === 'accepted' ? 'Accepted by Customer' :
                                                                request.status}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setQuotationViewMode('create'); }}
                                            className="px-5 py-2 bg-white rounded-full shadow-sm text-sm font-semibold hover:shadow-md transition-all flex items-center gap-2"
                                            style={{ color: 'inherit' }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            Edit Details
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Financial Summary */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                            <h2 className="text-lg font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                                                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                                Financial Summary
                                            </h2>
                                            <div className="space-y-3">
                                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-zinc-500">Base Price</span>
                                                    <span className="font-medium text-zinc-900">₹ {(displayValues.productBasePrice || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-zinc-500">Delivery</span>
                                                    <span className="font-medium text-zinc-900">₹ {(displayValues.deliveryCharges || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-zinc-500">Extras (Pkg + Ins)</span>
                                                    <span className="font-medium text-zinc-900">₹ {((displayValues.packagingCharges || 0) + (displayValues.insuranceCharges || 0)).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <span className="text-zinc-800 font-semibold">Total Amount</span>
                                                    <span className="font-bold text-green-700 text-lg">₹ {request.totalAmount?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Terms & Info */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                            <h2 className="text-lg font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                                                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                                Terms & Validity
                                            </h2>
                                            <div className="space-y-4 text-sm">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-zinc-400 uppercase">Valid Until</span>
                                                    <span className="font-medium text-zinc-800">{validUntil ? formatDate(validUntil) : 'N/A'}</span>
                                                </div>
                                                <div className="h-px bg-gray-100"></div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-zinc-400 uppercase">Payment Terms</span>
                                                    <p className="text-zinc-700 italic">{paymentTerms || 'Not specified'}</p>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-zinc-400 uppercase">Delivery Conditions</span>
                                                    <p className="text-zinc-700 italic">{deliveryConditions || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer (Action Buttons) - Only for Create Mode or relevant actions */}
                        {quotationViewMode === 'create' && (
                            <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 z-10">
                                <button
                                    onClick={() => setShowQuoteForm(false)}
                                    className="px-6 py-2.5 rounded-[20px] text-[#868686] hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    className="px-6 py-2.5 rounded-[20px] border border-[#0557A5] text-[#0557A5] hover:bg-[#0557A5]/5 font-medium transition-colors flex items-center gap-2"
                                >
                                    <span>💾</span> Save Draft
                                </button>
                                <button
                                    onClick={handleSendToCustomer}
                                    className="px-6 py-2.5 rounded-[20px] bg-[#0557A5] text-white hover:bg-[#044580] font-medium shadow-lg shadow-[#0557A5]/20 transition-all flex items-center gap-2"
                                >
                                    <span>📨</span> Send to Customer
                                </button>
                            </div>
                        )}
                        {quotationViewMode === 'view' && (
                            <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 z-10">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl bg-gray-100 text-zinc-700 hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Close Details
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </>
    );
}

// Add this style to your globals.css or component styles to hide scrollbar
// .no-scrollbar::-webkit-scrollbar {
//     display: none;
// }
// .no-scrollbar {
//     -ms-overflow-style: none;
//     scrollbar-width: none;
// }
