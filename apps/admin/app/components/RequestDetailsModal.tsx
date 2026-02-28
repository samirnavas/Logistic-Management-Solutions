
import { useEffect, useState } from 'react';
import StatusBadge from './StatusBadge';

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
                discount: Math.max(0, Number(discountAmount) || 0), // Clamp to avoid floating-point negatives
                additionalNotes: combinedNotes,
                validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'QUOTATION_GENERATED' // Valid status for pricing entered but not sent
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
                discount: Math.max(0, Number(discountAmount) || 0), // Clamp to avoid floating-point negatives
                additionalNotes: combinedNotes,
                validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'QUOTATION_GENERATED'
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
                throw new Error(`${errorData.message || 'Failed to update quotation details'}: ${JSON.stringify(errorData.details || errorData.error || '')}`);
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
                        className="bg-white rounded-xl shadow-2xl relative w-full max-w-5xl h-[90vh] md:max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Section (Fixed) */}
                        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 flex justify-between items-center flex-none">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold text-gray-800">Request #{request.quotationId || 'Pending'}</h1>
                                <StatusBadge status={request.status} />
                            </div>
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto w-full">
                            {/* Route & Entity Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                {/* Pickup Detail */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-2">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pickup Information</div>
                                    <div className="mb-3">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name / Client</div>
                                        <div className="text-sm text-gray-900 font-semibold">{request.origin?.name || request.clientId?.fullName || 'N/A'}</div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</div>
                                        <div className="text-sm text-gray-900 font-semibold">{request.origin?.phone || request.clientId?.phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</div>
                                        <div className="text-sm text-gray-900 leading-relaxed font-semibold">
                                            {request.origin?.addressLine}<br />
                                            {request.origin?.city}, {request.origin?.state} {request.origin?.zip}<br />
                                            {request.origin?.country}
                                        </div>
                                    </div>
                                </div>

                                {/* Drop-off Detail */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-2">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Drop-off Information</div>
                                    <div className="mb-3">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</div>
                                        <div className="text-sm text-gray-900 font-semibold">{request.destination?.name === 'To Be Confirmed' ? 'TBC' : (request.destination?.name || 'TBC')}</div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</div>
                                        <div className="text-sm text-gray-900 font-semibold">{(request.destination?.phone && !request.destination.phone.includes('999999')) ? request.destination.phone : 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</div>
                                        {request.destination?.addressLine?.includes('To Be Confirmed') ? (
                                            <div className="text-sm text-gray-500 italic">To Be Confirmed</div>
                                        ) : (
                                            <div className="text-sm text-gray-900 leading-relaxed font-semibold">
                                                {request.destination?.addressLine}<br />
                                                {request.destination?.city}, {request.destination?.state} {request.destination?.zip !== '00000' ? request.destination?.zip : ''}<br />
                                                {request.destination?.country}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Shipment Overview Section */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-t border-b border-gray-100 bg-white shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Shipment Type</span>
                                    <span className="text-sm font-bold text-gray-900">{request.serviceType || 'Standard'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</span>
                                    <span className="text-sm font-bold text-gray-900">{request.cargoType || 'General'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Value</span>
                                    <span className="text-sm font-bold text-gray-900">{request.totalAmount ? `₹ ${request.totalAmount.toLocaleString()}` : 'Pending'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Creation Date</span>
                                    <span className="text-sm font-bold text-gray-900">{request.createdAt ? formatDate(request.createdAt) : (request.pickupDate ? formatDate(request.pickupDate) : 'N/A')}</span>
                                </div>
                            </div>

                            {/* Items List Section */}
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Shipment Items</h3>
                                <div className="space-y-4">
                                    {request.items?.map((item: any, index: number) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-6 bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                            {/* Item Image */}
                                            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 text-gray-400 rounded-md flex items-center justify-center overflow-hidden border border-gray-100">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="Item" className="w-full h-full object-cover rounded-md" />
                                                ) : item.images && item.images.length > 0 ? (
                                                    <img src={item.images[0]} alt="Item" className="w-full h-full object-cover rounded-md" />
                                                ) : (
                                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                )}
                                            </div>
                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-800 break-words leading-tight">{item.description || 'Unnamed Item'}</h4>
                                                        {(item.priority === 'Express' || item.isHazardous) && (
                                                            <div className="flex gap-2 mt-2">
                                                                {item.priority === 'Express' && <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 font-bold tracking-wide">EXPRESS</span>}
                                                                {item.isHazardous && <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-bold tracking-wide">HAZARDOUS</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="text-xl font-bold text-gray-900 leading-tight bg-gray-50 px-3 py-1 rounded-md border border-gray-200">{item.quantity} x</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    <div>
                                                        <span className="block text-xs text-gray-500 mb-1 leading-none uppercase tracking-wider font-semibold">Dimensions (L x W x H)</span>
                                                        <span className="block text-sm font-medium text-gray-900 leading-none">{item.dimensions || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs text-gray-500 mb-1 leading-none uppercase tracking-wider font-semibold">Weight</span>
                                                        <span className="block text-sm font-medium text-gray-900 leading-none">{item.weight ? `${item.weight} kg` : 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs text-gray-500 mb-1 leading-none uppercase tracking-wider font-semibold">Category</span>
                                                        <span className="block text-sm font-medium text-gray-900 leading-none">{item.category || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs text-gray-500 mb-1 leading-none uppercase tracking-wider font-semibold">Value</span>
                                                        <span className="block text-sm font-medium text-gray-900 leading-none">{item.targetRate ? `₹${item.targetRate}` : '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Price Breakdown (Only if Calculated) */}
                            {request.totalAmount > 0 && ['cost_calculated', 'sent', 'accepted', 'ready_for_pickup', 'shipped', 'delivered', 'QUOTATION_SENT', 'ACCEPTED', 'BOOKED'].includes(request.status) && (
                                <div className="mx-6 mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-gray-800">
                                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                        {request.status === 'cost_calculated' ? 'Quotation Summary (Draft)' : 'Quotation Summary'}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                        <div>
                                            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">Subtotal</span>
                                            <div className="text-xl font-bold">₹ {request.subtotal?.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">Tax ({request.taxRate}%)</span>
                                            <div className="text-xl font-bold">₹ {request.tax?.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">Discount</span>
                                            <div className="text-xl font-bold text-red-500">- ₹ {request.discount?.toLocaleString() || 0}</div>
                                        </div>
                                        <div className="bg-emerald-50/80 p-4 rounded-lg border border-emerald-200">
                                            <span className="text-emerald-800 text-sm block mb-1 font-bold tracking-wide uppercase">Grand Total</span>
                                            <div className="text-3xl font-bold text-emerald-900">
                                                ₹ {request.totalAmount?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons (Sticky) */}
                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl z-20">
                            {['PENDING_ADMIN_REVIEW'].includes(request.status) && (
                                <button
                                    onClick={handleApproveRequest}
                                    className="px-6 py-2.5 rounded-md bg-[#0557A5] text-white text-sm font-medium hover:bg-[#044580] transition-colors shadow-sm"
                                >
                                    Approve Request
                                </button>
                            )}

                            {['PENDING_CUSTOMER_APPROVAL'].includes(request.status) && (
                                <div className="bg-yellow-50 text-yellow-800 px-6 py-2.5 rounded-md flex items-center justify-center shadow-sm">
                                    <span className="font-medium text-sm">Waiting for client to review the quotation</span>
                                </div>
                            )}

                            {['details_submitted', 'ADDRESS_PROVIDED'].includes(request.status) && (
                                <button
                                    onClick={() => {
                                        setShowQuoteForm(true);
                                        setQuotationViewMode('create');
                                    }}
                                    className="px-6 py-2.5 rounded-md bg-[#0557A5] text-white text-sm font-medium hover:bg-[#044580] transition-colors shadow-sm"
                                >
                                    Generate Quotation
                                </button>
                            )}

                            {['cost_calculated', 'sent', 'accepted', 'ready_for_pickup', 'shipped', 'delivered'].includes(request.status) && (
                                <button
                                    onClick={() => {
                                        setShowQuoteForm(true);
                                        setQuotationViewMode('view');
                                    }}
                                    className="px-6 py-2.5 rounded-md bg-[#0557A5] text-white text-sm font-medium hover:bg-[#044580] transition-colors shadow-sm"
                                >
                                    View Quotation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quotation Form/Details Modal (Overlay) */}
            {
                showQuoteForm && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60] p-4 sm:p-6"
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
                            className="w-full max-w-4xl bg-gray-50 rounded-xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header (Row 1) */}
                            <div className="flex-none bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-xl font-bold text-gray-800">
                                        {quotationViewMode === 'create' ? 'Create Quotation' : 'Quotation Details'}
                                    </h1>
                                    <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                                        Req {request.quotationId || 'NEW'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (quotationViewMode === 'view') onClose();
                                        else setShowQuoteForm(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                                {quotationViewMode === 'create' ? (
                                    /* CREATE/EDIT FORM */
                                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">

                                        {/* Context Summary (Row 2 - Full Width Card) */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                                            <div className="flex flex-col md:flex-row gap-6 justify-between">
                                                {/* Left Side: Route */}
                                                <div className="flex flex-col gap-2">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Route</h4>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                                            <div className="w-0.5 h-4 bg-gray-200 my-0.5"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-sm font-bold text-gray-800 leading-none">
                                                                {request.origin?.city || 'Origin City'}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-800 leading-none">
                                                                {request.destination?.city || 'Destination City'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side: Details */}
                                                <div className="flex gap-8">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</span>
                                                        <span className="text-sm font-bold text-gray-800">{request.clientId?.fullName || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</span>
                                                        <span className="text-sm font-bold text-gray-800">{request.serviceType || 'Standard'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</span>
                                                        <span className="text-sm font-bold text-gray-800">{request.cargoType || 'General'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Form Inputs (Row 3 - Full Width Card) */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col gap-5">
                                            <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">Cost Breakdown</h3>

                                            <div className="flex flex-row flex-wrap gap-5">
                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Base Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={productBasePrice || ''}
                                                        onChange={(e) => setProductBasePrice(Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Charges (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={deliveryCharges || ''}
                                                        onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Packaging (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={packagingCharges || ''}
                                                        onChange={(e) => setPackagingCharges(Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Insurance (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={insuranceCharges || ''}
                                                        onChange={(e) => setInsuranceCharges(Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tax Rate (%)</label>
                                                    <div className="flex items-center gap-2 w-full">
                                                        <input
                                                            type="number"
                                                            className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                            value={taxPercentage || ''}
                                                            onChange={(e) => setTaxPercentage(Number(e.target.value))}
                                                        />
                                                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-3 py-2.5 rounded-md border border-gray-200">
                                                            ₹ {taxAmount.toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Discount</label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:border-blue-600 outline-none transition-all"
                                                            value={discountType}
                                                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                                        >
                                                            <option value="fixed">₹</option>
                                                            <option value="percentage">%</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            className="w-full rounded-md border border-gray-300 bg-red-50/30 px-4 py-2.5 text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                                            value={discountValue || ''}
                                                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-2 bg-emerald-50/80 border border-emerald-200 rounded-lg px-6 py-4 flex justify-between items-center shadow-sm">
                                                <span className="text-emerald-800 text-sm font-bold uppercase tracking-wider">Grand Total</span>
                                                <span className="text-emerald-900 text-2xl font-bold tracking-tight">
                                                    ₹ {finalQuotedAmount.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Timeline & Terms (Row 4 - Full Width Card) */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col gap-5">
                                            <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">Scheduling & Terms</h3>

                                            <div className="flex flex-row flex-wrap gap-5">
                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Validity Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={validUntil}
                                                        onChange={(e) => setValidUntil(e.target.value)}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Terms</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 50% advance, 50% on delivery"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={paymentTerms}
                                                        onChange={(e) => setPaymentTerms(e.target.value)}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Conditions</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Door to Door, Unloading by client"
                                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                                        value={deliveryConditions}
                                                        onChange={(e) => setDeliveryConditions(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 w-full mt-2">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Other Info</label>
                                                <textarea
                                                    rows={2}
                                                    placeholder="Any other special instructions..."
                                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none"
                                                    value={otherInformation}
                                                    onChange={(e) => setOtherInformation(e.target.value)}
                                                />
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
                                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                                    Financial Summary
                                                </h2>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-500">Base Price</span>
                                                        <span className="font-medium text-gray-900">₹ {(displayValues.productBasePrice || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-500">Delivery</span>
                                                        <span className="font-medium text-gray-900">₹ {(displayValues.deliveryCharges || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-500">Extras (Pkg + Ins)</span>
                                                        <span className="font-medium text-gray-900">₹ {((displayValues.packagingCharges || 0) + (displayValues.insuranceCharges || 0)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <span className="text-gray-800 font-semibold">Total Amount</span>
                                                        <span className="font-bold text-green-700 text-lg">₹ {request.totalAmount?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terms & Info */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                                    Terms & Validity
                                                </h2>
                                                <div className="space-y-4 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valid Until</span>
                                                        <span className="font-medium text-gray-800">{validUntil ? formatDate(validUntil) : 'N/A'}</span>
                                                    </div>
                                                    <div className="h-px bg-gray-100"></div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Terms</span>
                                                        <p className="text-gray-700 italic">{paymentTerms || 'Not specified'}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Conditions</span>
                                                        <p className="text-gray-700 italic">{deliveryConditions || 'Not specified'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer (Action Buttons) (Row 5) */}
                            {quotationViewMode === 'create' && (
                                <div className="flex-none bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 z-10 mt-auto">
                                    <button
                                        onClick={() => setShowQuoteForm(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveDraft}
                                        className="px-6 py-2.5 text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <span>💾</span> Save Draft
                                    </button>
                                    <button
                                        onClick={handleSendToCustomer}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                    >
                                        <span>📨</span> Send to Customer
                                    </button>
                                </div>
                            )}
                            {quotationViewMode === 'view' && (
                                <div className="flex-none bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 z-10 mt-auto">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors text-sm"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

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
