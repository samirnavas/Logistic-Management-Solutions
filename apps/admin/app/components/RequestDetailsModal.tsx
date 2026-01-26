
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

        // Extract notes
        if (quotation.internalNotes) {
            const notes = quotation.internalNotes.split('\n');
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
                    category: 'freight'
                });
            }
            if (deliveryCharges > 0) {
                items.push({
                    description: 'Delivery/Transportation Charges',
                    quantity: 1,
                    unitPrice: deliveryCharges,
                    amount: deliveryCharges,
                    category: 'freight'
                });
            }
            if (packagingCharges > 0) {
                items.push({
                    description: 'Packaging Charges',
                    quantity: 1,
                    unitPrice: packagingCharges,
                    amount: packagingCharges,
                    category: 'handling'
                });
            }
            if (insuranceCharges > 0) {
                items.push({
                    description: 'Insurance Charges',
                    quantity: 1,
                    unitPrice: insuranceCharges,
                    amount: insuranceCharges,
                    category: 'insurance'
                });
            }
            if (taxAmount > 0) {
                items.push({
                    description: `Taxes (GST ${taxPercentage}%)`,
                    quantity: 1,
                    unitPrice: taxAmount,
                    amount: taxAmount,
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
                internalNotes: combinedNotes,
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
                    category: 'freight'
                });
            }
            if (deliveryCharges > 0) {
                items.push({
                    description: 'Delivery/Transportation Charges',
                    quantity: 1,
                    unitPrice: deliveryCharges,
                    amount: deliveryCharges,
                    category: 'freight'
                });
            }
            if (packagingCharges > 0) {
                items.push({
                    description: 'Packaging Charges',
                    quantity: 1,
                    unitPrice: packagingCharges,
                    amount: packagingCharges,
                    category: 'handling'
                });
            }
            if (insuranceCharges > 0) {
                items.push({
                    description: 'Insurance Charges',
                    quantity: 1,
                    unitPrice: insuranceCharges,
                    amount: insuranceCharges,
                    category: 'insurance'
                });
            }
            if (taxAmount > 0) {
                items.push({
                    description: `Taxes (GST ${taxPercentage}%)`,
                    quantity: 1,
                    unitPrice: taxAmount,
                    amount: taxAmount,
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
                internalNotes: combinedNotes,
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
                            <span className={`px-3 py-1 rounded-full font-medium border ${request.status === 'request_sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                request.status === 'cost_calculated' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                    request.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                        'bg-gray-50 text-gray-700 border-gray-100'
                                }`}>
                                {request.status === 'request_sent' ? 'New' :
                                    request.status === 'cost_calculated' ? 'Pending' :
                                        request.status === 'approved' ? 'Approved' : request.status}
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
                                        <div className="text-sm font-semibold text-zinc-900 mb-1">{request.destination?.name || 'TBC'}</div>
                                        <div className="text-xs text-zinc-600 mb-2">{request.destination?.phone}</div>
                                        <div className="text-xs text-zinc-800 leading-relaxed">
                                            {request.destination?.addressLine}<br />
                                            {request.destination?.city}, {request.destination?.state}<br />
                                            {request.destination?.zip}, {request.destination?.country}
                                        </div>
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
                        {request.totalAmount > 0 && ['cost_calculated', 'sent', 'accepted', 'ready_for_pickup', 'shipped', 'delivered'].includes(request.status) && (
                            <div className="bg-gradient-to-br from-gray-900 to-zinc-800 rounded-xl shadow-lg p-6 text-white">
                                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                    Quotation Summary
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

                    {request.status === 'request_sent' && (
                        <button
                            onClick={handleApproveRequest}
                            className="w-full sm:w-auto bg-sky-700 text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-sky-800 transition-colors shadow-sm shadow-sky-700/20"
                        >
                            Approve Request
                        </button>
                    )}

                    {request.status === 'approved' && (
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

            {/* Quotation Form/Details Modal (Overlay) */}
            {showQuoteForm && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60] overflow-y-auto py-10 px-4"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowQuoteForm(false);
                    }}
                >
                    {quotationViewMode === 'create' ? (
                        /* CREATE/EDIT FORM */
                        <div
                            className="w-full max-w-[583px] bg-white rounded-lg shadow-2xl relative max-h-[95vh] overflow-y-auto no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowQuoteForm(false)}
                                className="absolute top-5 right-5 text-[#868686] hover:text-[#333333] transition-colors z-10"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>

                            <div className="p-8">
                                {/* Header */}
                                <h1 className="text-[20px] font-medium text-[#333333] leading-7 mb-11">
                                    Create Quotation
                                </h1>

                                <form onSubmit={(e) => e.preventDefault()}>
                                    {/* Quotation Info Card */}
                                    <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#868686] text-base">Quotation ID</span>
                                            <span className="text-[#333333] text-base">{request.quotationId || 'QT-50422'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#868686] text-base">Linked Request ID</span>
                                            <span className="text-[#333333] text-base">{requestId}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#868686] text-base">Customer Name</span>
                                            <span className="text-[#333333] text-base">{request.clientId?.fullName || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Price Breakdown Section */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-medium text-[#333333] leading-[25.2px] mb-4">
                                            Price Breakdown
                                        </h2>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Product Base Price */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Product Base Price
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Product Base Price"
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={productBasePrice || ''}
                                                    onChange={(e) => setProductBasePrice(Number(e.target.value))}
                                                />
                                            </div>

                                            {/* Delivery Charges */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Delivery Charges
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Delivery Charges"
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={deliveryCharges || ''}
                                                    onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                                />
                                            </div>

                                            {/* Packaging Charges */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Packaging Charges
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Packaging Charges"
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={packagingCharges || ''}
                                                    onChange={(e) => setPackagingCharges(Number(e.target.value))}
                                                />
                                            </div>

                                            {/* Insurance Charges */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Insurance Charges
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Insurance Charges"
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={insuranceCharges || ''}
                                                    onChange={(e) => setInsuranceCharges(Number(e.target.value))}
                                                />
                                            </div>

                                            {/* Tax Percentage */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Tax Percentage (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Tax %"
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={taxPercentage || ''}
                                                    onChange={(e) => setTaxPercentage(Number(e.target.value))}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                                {taxAmount > 0 && (
                                                    <div className="text-xs text-[#868686] mt-1">
                                                        = ₹ {taxAmount.toLocaleString('en-IN')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Discount */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Discount
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={discountType}
                                                        onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                                        className="bg-[#F5F5F5] rounded-[20px] px-4 py-2.5 text-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    >
                                                        <option value="fixed">₹</option>
                                                        <option value="percentage">%</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        placeholder={discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                                                        className="flex-1 bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                        value={discountValue || ''}
                                                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                        min="0"
                                                        max={discountType === 'percentage' ? 100 : undefined}
                                                        step={discountType === 'percentage' ? 0.01 : 1}
                                                    />
                                                </div>
                                                {discountAmount > 0 && discountType === 'percentage' && (
                                                    <div className="text-xs text-[#868686] mt-1">
                                                        = ₹ {discountAmount.toLocaleString('en-IN')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Final Quoted Amount */}
                                        <div className="bg-[#F5F5F5] rounded-lg px-6 py-4 mt-6 flex justify-between items-center">
                                            <span className="text-[#868686] text-base">Final Quoted Amount</span>
                                            <span className="text-[#333333] text-lg font-semibold leading-[25.2px]">
                                                ₹ {finalQuotedAmount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Validity Section */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-medium text-[#333333] leading-[25.2px] mb-4">
                                            Validity
                                        </h2>
                                        <label className="block text-sm text-[#333333] mb-2">
                                            Quotation Valid Until
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                        />
                                    </div>

                                    {/* Terms & Notes Section */}
                                    <div className="mb-8">
                                        <h2 className="text-lg font-medium text-[#333333] leading-[25.2px] mb-4">
                                            Terms & Notes
                                        </h2>

                                        <div className="space-y-4">
                                            {/* Payment Terms */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Payment Terms
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Text here...."
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={paymentTerms}
                                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                                />
                                            </div>

                                            {/* Delivery Conditions */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Delivery Conditions
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Text here...."
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={deliveryConditions}
                                                    onChange={(e) => setDeliveryConditions(e.target.value)}
                                                />
                                            </div>

                                            {/* Other Information */}
                                            <div>
                                                <label className="block text-sm text-[#333333] mb-2">
                                                    Other Information
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Text here...."
                                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                                    value={otherInformation}
                                                    onChange={(e) => setOtherInformation(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={handleSaveDraft}
                                            className="flex-1 bg-[#0557A5] text-white rounded-[20px] h-10 text-sm font-normal leading-[19.6px] hover:bg-[#044580] transition-colors"
                                        >
                                            Save as Draft
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSendToCustomer}
                                            className="flex-1 border border-[#0557A5] text-[#0557A5] bg-white rounded-[20px] h-10 text-sm font-normal leading-[19.6px] hover:bg-[#0557A5]/5 transition-colors"
                                        >
                                            Send to Customer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* QUOTATION DETAILS VIEW */
                        <div
                            className="w-full max-w-4xl bg-white rounded-lg border border-black shadow-2xl relative max-h-[95vh] overflow-y-auto no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowQuoteForm(false)}
                                className="absolute top-5 right-5 text-[#868686] hover:text-[#333333] transition-colors z-10"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>

                            <div className="p-8">
                                {/* Header */}
                                <div className="mb-6">
                                    <h1 className="text-[20px] font-medium text-[#333333] leading-7 mb-4">
                                        Quotation Detail
                                    </h1>

                                    {/* Status Badges and Edit Button */}
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="bg-[#E6EEF6] px-4 py-1 rounded-[14px]">
                                            <span className="text-[#0557A5] text-base font-medium">ID : {request.quotationId || 'QT-8891'}</span>
                                        </div>
                                        <div className="bg-[#E6EEF6] px-4 py-1 rounded-[14px]">
                                            <span className="text-[#0557A5] text-base font-medium">
                                                Status : {request.status === 'draft' ? 'Draft' : request.status === 'sent' ? 'Sent to Customer' : 'Pending Customer Action'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQuotationViewMode('create');
                                            }}
                                            className="ml-auto bg-[#0557A5] text-white px-6 py-2 rounded-full text-sm font-normal hover:bg-[#044580] transition-colors"
                                        >
                                            Edit Quotation
                                        </button>
                                    </div>
                                </div>

                                {/* Top Row: Customer Info & Request Summary */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-7">
                                    {/* Customer Information */}
                                    <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                        <h2 className="text-lg font-medium text-[#333333] mb-6">Customer Information</h2>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Name</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.clientId?.fullName || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Email</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.clientId?.email || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Mobile Number</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.clientId?.phone || request.origin?.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[#868686] text-sm">Address</span>
                                                <span className="text-[#333333] text-sm font-medium text-right max-w-[220px]">
                                                    {request.origin?.addressLine || '123, MG Road'}, {request.origin?.city}, {request.origin?.state}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Location</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.origin?.city || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Full Request Summary */}
                                    <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                        <h2 className="text-lg font-medium text-[#333333] mb-6">Full Request Summary</h2>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Product Name</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.cargoType || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Number of Boxes</span>
                                                <span className="text-[#333333] text-sm font-medium">
                                                    {request.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 10}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Packaging Type</span>
                                                <span className="text-[#333333] text-sm font-medium">Secure Box</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Pickup Location</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.origin?.city || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Delivery Location</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.destination?.city || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Mode</span>
                                                <span className="text-[#333333] text-sm font-medium">{request.serviceType || 'Air'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Preferred Date</span>
                                                <span className="text-[#333333] text-sm font-medium">{formatDate(request.preferredDate) || '20 Sep 2025'}</span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[#868686] text-sm">Special Instructions</span>
                                                <span className="text-[#333333] text-sm font-medium text-right max-w-[200px]">{request.specialInstructions || 'Handle with extra care'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Price Breakdown, History & Response Status */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-7">
                                    {/* Complete Price Breakdown */}
                                    <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                        <h2 className="text-lg font-medium text-[#333333] mb-6">Complete Price Breakdown</h2>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Base Product Price</span>
                                                <span className="text-[#333333] text-sm font-medium">₹ {(displayValues.productBasePrice || productBasePrice || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Transportation Charges</span>
                                                <span className="text-[#333333] text-sm font-medium">₹ {(displayValues.deliveryCharges || deliveryCharges || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Packaging Charges</span>
                                                <span className="text-[#333333] text-sm font-medium">₹ {(displayValues.packagingCharges || packagingCharges || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Insurance Charges</span>
                                                <span className="text-[#333333] text-sm font-medium">₹ {(displayValues.insuranceCharges || insuranceCharges || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Taxes (GST {request.taxRate || taxPercentage}%)</span>
                                                <span className="text-[#333333] text-sm font-medium">₹ {(displayValues.taxAmount || taxAmount || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#868686] text-sm">Discount</span>
                                                <span className="text-[#333333] text-sm font-medium">– ₹ {(displayValues.discountAmount || discountAmount || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[#333333] text-base font-semibold">Final Quoted Amount</span>
                                                    <span className="text-[#0557A5] text-xl font-bold">₹ {(displayValues.totalAmount || finalQuotedAmount || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: History & Response Status */}
                                    <div className="space-y-7">
                                        {/* Quotation History */}
                                        <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                            <h2 className="text-lg font-medium text-[#333333] mb-6">Quotation History</h2>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-[#868686]">12 Sep 2025</span>
                                                    <span className="text-[#333333] font-medium">Draft created by Admin A</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[#868686]">13 Sep 2025</span>
                                                    <span className="text-[#333333] font-medium">Edited – price updated</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[#868686]">13 Sep 2025</span>
                                                    <span className="text-[#333333] font-medium">Sent to customer (Email / App)</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[#868686]">15 Sep 2025</span>
                                                    <span className="text-[#333333] font-medium">Resent to customer</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Response Status */}
                                        <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                            <h2 className="text-lg font-medium text-[#333333] mb-4">Customer Response Status</h2>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#868686] text-sm">Current Status</span>
                                                <span className={`text-sm font-medium ${['ready_for_pickup', 'accepted', 'shipped', 'delivered'].includes(request.status) ? 'text-green-600' :
                                                    ['rejected'].includes(request.status) ? 'text-red-600' :
                                                        'text-orange-600'
                                                    }`}>
                                                    {['ready_for_pickup', 'accepted', 'shipped', 'delivered'].includes(request.status) ? 'Accepted' :
                                                        ['rejected'].includes(request.status) ? 'Rejected' :
                                                            'Awaiting Response'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Validity Section */}
                                <div className="mb-7">
                                    <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                        <h2 className="text-lg font-medium text-[#333333] mb-6">Validity</h2>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#868686] text-sm">Quotation Valid Until</span>
                                            <span className="text-[#333333] text-sm font-medium">
                                                {request.validUntil ? formatDate(request.validUntil) : (validUntil ? formatDate(validUntil) : 'N/A')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Notes Section */}
                                <div>
                                    <div className="bg-white shadow-[3px_3px_12px_rgba(0,0,0,0.15)] rounded-lg p-5">
                                        <h2 className="text-lg font-medium text-[#333333] mb-6">Terms & Notes</h2>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[#868686] text-sm">Payment Terms</span>
                                                <span className="text-[#333333] text-sm font-medium text-right max-w-[60%]">
                                                    {paymentTerms || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[#868686] text-sm">Delivery Conditions</span>
                                                <span className="text-[#333333] text-sm font-medium text-right max-w-[60%]">
                                                    {deliveryConditions || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[#868686] text-sm">Other Information</span>
                                                <span className="text-[#333333] text-sm font-medium text-right max-w-[60%]">
                                                    {otherInformation || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
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
