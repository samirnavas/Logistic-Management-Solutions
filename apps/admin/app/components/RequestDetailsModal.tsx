
import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface RequestDetailsModalProps {
    requestId: string;
    onClose: () => void;
    onStatusChange?: () => void;
}

export default function RequestDetailsModal({ requestId, onClose, onStatusChange }: RequestDetailsModalProps) {
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showQuoteForm, setShowQuoteForm] = useState(false);

    // Quotation Form State
    const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    const [taxRate, setTaxRate] = useState(10);
    const [discount, setDiscount] = useState(0);
    const [validUntil, setValidUntil] = useState('');
    const [internalNotes, setInternalNotes] = useState('');

    // Summary Calculations
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discount;

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems: any = [...items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quotations/${requestId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRequest(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [requestId]);

    const handleCreateQuotation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                items: items.map(item => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    amount: Number(item.amount)
                })),
                taxRate: Number(taxRate),
                discount: Number(discount),
                validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                internalNotes: internalNotes,
                status: 'cost_calculated' // Intermediate status before sending
            };

            const updateRes = await fetch(`/api/quotations/${requestId}/update-price`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) throw new Error('Failed to update quotation details');

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

            setShowQuoteForm(false);
            if (onStatusChange) onStatusChange();
            onClose();

        } catch (err) {
            console.error(err);
            alert('Error creating quotation: ' + err);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-xl shadow-xl">Loading details...</div>
        </div>
    );

    if (!request) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-[893px] bg-white rounded-lg shadow-2xl relative p-8 max-h-[95vh] overflow-y-auto">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-2">
                    ✕
                </button>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <h1 className="text-xl font-medium text-zinc-800">Request Detail</h1>
                    <div className="flex gap-4">
                        <div className="bg-slate-200 px-4 py-1.5 rounded-2xl text-sky-700 text-sm font-medium">
                            ID : {request.quotationId}
                        </div>
                        <div className="bg-slate-200 px-4 py-1.5 rounded-2xl text-sky-700 text-sm font-medium">
                            Status : {request.status === 'request_sent' ? 'New' : request.status}
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Left Column: Customer Info */}
                    <div className="flex-1 bg-white rounded-lg shadow-[3px_3px_12px_0px_rgba(0,0,0,0.15)] p-6 min-h-[384px] relative">
                        <h2 className="text-lg font-medium text-zinc-800 mb-6">Customer Information</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Name</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.clientId?.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Email</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.clientId?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Mobile Number</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.clientId?.phone || request.origin?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-zinc-500 text-sm">Address</span>
                                <span className="text-zinc-800 text-sm font-medium text-right max-w-[150px]">
                                    {request.origin?.addressLine || '123, Street Name'},<br />
                                    {request.origin?.city}, {request.origin?.state}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Location</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.origin?.city}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Product & Delivery Details */}
                    <div className="flex-1 bg-white rounded-lg shadow-[3px_3px_12px_0px_rgba(0,0,0,0.15)] p-6 min-h-[384px] overflow-y-auto">
                        <h2 className="text-lg font-medium text-zinc-800 mb-6">Product & Delivery Details</h2>

                        <div className="space-y-4">
                            {/* Images Row */}
                            {request.productPhotos?.length > 0 && (
                                <div className="flex gap-4 mb-4">
                                    {request.productPhotos.map((photo: string, i: number) => (
                                        <img key={i} src={photo} alt="Product" className="w-16 h-16 rounded-lg object-cover" />
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Product Name</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.cargoType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Number of Boxes</span>
                                <span className="text-zinc-800 text-sm font-medium">
                                    {request.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Packaging Type</span>
                                <span className="text-zinc-800 text-sm font-medium">Secure Box</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Pickup Location</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.origin?.city}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Delivery Location</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.destination?.city}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Mode</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.serviceType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Expected Delivery Timeline</span>
                                <span className="text-zinc-800 text-sm font-medium">3-4 Business Days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Special Instructions</span>
                                <span className="text-zinc-800 text-sm font-medium text-right">{request.specialInstructions || 'None'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown (for processed quotations) */}
                {request.totalAmount !== undefined && (
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h2 className="text-lg font-medium text-zinc-800 mb-4">Price Breakdown</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-zinc-500 text-sm block mb-1">Total Amount</span>
                                <div className="text-2xl font-bold text-sky-700">
                                    {request.currency || 'USD'} {request.totalAmount?.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-zinc-500 text-sm block mb-1">Subtotal</span>
                                <div className="text-zinc-800 font-medium">{request.subtotal}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-zinc-500 text-sm block mb-1">Tax ({request.taxRate}%)</span>
                                <div className="text-zinc-800 font-medium">{request.tax}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="mt-8 flex justify-center gap-6">
                    {request.status === 'request_sent' && (
                        <button
                            onClick={() => setShowQuoteForm(true)}
                            className="bg-sky-700 text-white px-8 py-2.5 rounded-full text-sm font-normal hover:bg-sky-800 transition-colors"
                        >
                            Create Quotation
                        </button>
                    )}
                    <button className="border border-sky-700 text-sky-700 px-8 py-2.5 rounded-full text-sm font-normal hover:bg-sky-50 transition-colors">
                        Add Internal Notes
                    </button>
                </div>
            </div>

            {/* Quotation Form Modal (Overlay) */}
            {showQuoteForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] overflow-y-auto py-10">
                    <div className="bg-white rounded-xl w-[900px] p-8 shadow-xl relative">
                        <h2 className="text-xl font-semibold mb-6 text-zinc-800">Generate Quotation</h2>

                        <form onSubmit={handleCreateQuotation} className="space-y-6">

                            {/* Line Items Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-medium text-gray-700">Line Items</h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-sky-700 text-sm flex items-center gap-1 hover:text-sky-800"
                                    >
                                        <Plus size={16} /> Add Item
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-start bg-slate-50 p-3 rounded-lg">
                                            <div className="flex-[3]">
                                                <label className="text-xs text-zinc-500 block mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    placeholder="Item description"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-zinc-500 block mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-zinc-500 block mb-1">Unit Price</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-zinc-500 block mb-1">Amount</label>
                                                <div className="w-full px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-right">
                                                    {item.amount.toFixed(2)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="mt-6 text-red-500 hover:text-red-700 p-1"
                                                title="Remove Item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Settings & Summary */}
                            <div className="grid grid-cols-2 gap-8 border-t pt-6">
                                {/* Left: Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            rows={3}
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                            placeholder="Notes for internal team..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={validUntil}
                                                onChange={(e) => setValidUntil(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Summary */}
                                <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                                    <h3 className="font-medium text-zinc-800 mb-2">Summary</h3>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600">Subtotal</span>
                                        <span className="font-medium">{subtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-600">Tax Rate (%)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600">Tax Amount</span>
                                        <span className="font-medium">{taxAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-600">Discount</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                        <span className="text-base font-bold text-zinc-800">Grand Total</span>
                                        <span className="text-xl font-bold text-sky-700">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    className="px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full font-medium"
                                    onClick={() => setShowQuoteForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 text-sm bg-sky-700 text-white rounded-full hover:bg-sky-800 font-medium shadow-lg shadow-sky-700/20"
                                >
                                    Send Quote
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
