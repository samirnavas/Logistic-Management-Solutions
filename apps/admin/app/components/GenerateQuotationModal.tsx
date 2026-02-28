'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface GenerateQuotationModalProps {
    requestId: string;
    quotationId?: string;
    linkedRequestId?: string;
    customerName?: string;
    status: string;
    existingData?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export interface QuotationFormData {
    productBasePrice: number;
    deliveryCharges: number;
    packagingCharges: number;
    insuranceCharges: number;
    taxes: number;
    discount: number;
    finalQuotedAmount: number;
    validUntil: string;
    paymentTerms: string;
    deliveryConditions: string;
    otherInformation: string;
}

export default function GenerateQuotationModal({
    requestId,
    quotationId = 'QT-50422',
    linkedRequestId = 'DR-10245',
    customerName = 'Rahul Sharma',
    status,
    existingData,
    onClose,
    onSuccess
}: GenerateQuotationModalProps) {
    const [formData, setFormData] = useState<QuotationFormData>({
        productBasePrice: 0,
        deliveryCharges: 0,
        packagingCharges: 0,
        insuranceCharges: 0,
        taxes: 0,
        discount: 0,
        finalQuotedAmount: 0,
        validUntil: '',
        paymentTerms: '',
        deliveryConditions: '',
        otherInformation: ''
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'PENDING_REVIEW') {
            setError('Please Mark as Verified before pricing.');
        } else {
            setError(null);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'NEGOTIATION_REQUESTED' && existingData) {
            // Pre-fill logic
            setFormData({
                productBasePrice: existingData.subtotal || 0, // Simplified mapping needs adjustment based on actual data shape
                deliveryCharges: 0, // Assuming these were aggregated or need specific fields
                packagingCharges: 0,
                insuranceCharges: 0,
                taxes: existingData.tax || 0,
                discount: existingData.discount || 0,
                finalQuotedAmount: existingData.totalAmount || 0,
                validUntil: existingData.validUntil ? new Date(existingData.validUntil).toISOString().split('T')[0] : '',
                paymentTerms: existingData.termsAndConditions || '',
                deliveryConditions: '',
                otherInformation: existingData.internalNotes || ''
            });
        }
    }, [status, existingData]);

    const [loading, setLoading] = useState(false);

    // Calculate final quoted amount
    const calculateFinalAmount = () => {
        const {
            productBasePrice,
            deliveryCharges,
            packagingCharges,
            insuranceCharges,
            taxes,
            discount
        } = formData;

        return productBasePrice + deliveryCharges + packagingCharges + insuranceCharges + taxes - discount;
    };

    // Update form field
    const handleInputChange = (field: keyof QuotationFormData, value: string | number) => {
        const newFormData = { ...formData, [field]: value };

        // Recalculate final amount if any price field changes
        if (['productBasePrice', 'deliveryCharges', 'packagingCharges', 'insuranceCharges', 'taxes', 'discount'].includes(field)) {
            const finalAmount =
                (Number(newFormData.productBasePrice) || 0) +
                (Number(newFormData.deliveryCharges) || 0) +
                (Number(newFormData.packagingCharges) || 0) +
                (Number(newFormData.insuranceCharges) || 0) +
                (Number(newFormData.taxes) || 0) -
                (Number(newFormData.discount) || 0);

            newFormData.finalQuotedAmount = finalAmount;
        }

        setFormData(newFormData);
    };

    const handleSubmit = async () => {
        if (status === 'PENDING_REVIEW') return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 1. Update Quotation Details
            const payload = {
                items: [{
                    description: 'Freight Charges', // Using generic description or preserve existing items if possible
                    amount: formData.finalQuotedAmount // Using final amount as the main charge for simplification as per previous implementation
                }],
                taxRate: 10, // hardcoded or derived
                tax: formData.taxes,
                subtotal: formData.productBasePrice, // Mapping base price to subtotal
                discount: formData.discount,
                totalAmount: formData.finalQuotedAmount,
                validUntil: formData.validUntil,
                internalNotes: formData.otherInformation,
                termsAndConditions: formData.paymentTerms
            };

            const updateRes = await fetch(`/api/quotations/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) throw new Error('Failed to update quotation details');

            // 2. Approve
            const approveRes = await fetch(`/api/quotations/${requestId}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!approveRes.ok) throw new Error('Failed to approve quotation');

            // 3. Send
            const sendRes = await fetch(`/api/quotations/${requestId}/send`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!sendRes.ok) throw new Error('Failed to send quotation');

            onSuccess();
            onClose();

        } catch (error) {
            console.error('Error sending quotation:', error);
            alert('Failed to send quotation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
            <div
                className="w-full max-w-5xl bg-white rounded-xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="flex-none flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {status === 'NEGOTIATION_REQUESTED' ? 'Revise Quotation' : 'Create Quotation'}
                        </h1>
                        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                            Req {linkedRequestId}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Two-Column Layout Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0 overflow-hidden">

                    {/* Left Column - Context Summary */}
                    <div className="col-span-1 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2">Request Context</h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</h4>
                                <p className="text-sm font-medium text-gray-900">{customerName}</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Route</h4>
                                <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                        <p className="text-sm text-gray-800">{existingData?.origin?.city || 'Origin City'}</p>
                                    </div>
                                    <div className="w-0.5 h-3 bg-gray-200 ml-1"></div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                                        <p className="text-sm text-gray-800">{existingData?.destination?.city || 'Destination City'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shipment Details</h4>
                                <div className="grid grid-cols-2 gap-y-3">
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Type</span>
                                        <span className="text-sm font-medium text-gray-800">{existingData?.serviceType || 'Standard'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Category</span>
                                        <span className="text-sm font-medium text-gray-800">{existingData?.cargoType || 'General'}</span>
                                    </div>
                                </div>
                            </div>

                            {existingData?.items && existingData.items.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</h4>
                                    <div className="space-y-2">
                                        {existingData.items.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white p-2 rounded border border-gray-100 shadow-sm text-sm flex justify-between items-center">
                                                <span className="text-gray-800 truncate pr-2 font-medium">{item.description}</span>
                                                <span className="text-gray-500 text-xs whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded">{item.quantity}x</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Financial Form */}
                    <div className="col-span-2 bg-white flex flex-col h-full overflow-hidden">
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Details</h3>

                            {/* Financial Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Product Base Price
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.productBasePrice || ''}
                                            onChange={(e) => handleInputChange('productBasePrice', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Delivery Charges
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.deliveryCharges || ''}
                                            onChange={(e) => handleInputChange('deliveryCharges', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Packaging Charges
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.packagingCharges || ''}
                                            onChange={(e) => handleInputChange('packagingCharges', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Insurance Charges
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.insuranceCharges || ''}
                                            onChange={(e) => handleInputChange('insuranceCharges', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Taxes (GST, etc.)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.taxes || ''}
                                            onChange={(e) => handleInputChange('taxes', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Discount Amount
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm text-red-400">-₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.discount || ''}
                                            onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Final Quoted Amount Banner */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg px-6 py-4 mb-8 flex justify-between items-center shadow-md">
                                <span className="text-gray-300 text-sm font-medium uppercase tracking-wider">Grand Total</span>
                                <span className="text-white text-2xl font-bold tracking-tight">
                                    ₹ {formData.finalQuotedAmount.toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Terms & Details Section */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Scheduling & Terms</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Validity Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                            value={formData.validUntil}
                                            onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Payment Terms
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Net 30 days, 50% advance..."
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                        value={formData.paymentTerms}
                                        onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Delivery Conditions
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Detailed delivery terms..."
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
                                        value={formData.deliveryConditions}
                                        onChange={(e) => handleInputChange('deliveryConditions', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Internal / Other Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Additional information..."
                                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm resize-none"
                                        value={formData.otherInformation}
                                        onChange={(e) => handleInputChange('otherInformation', e.target.value)}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Sticky Footer */}
                        <div className="flex-none p-5 border-t border-gray-200 bg-gray-50 z-10 flex justify-end gap-3 mt-auto">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading || !!error}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                onClick={handleSubmit}
                            >
                                {loading && (
                                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {loading ? 'Processing...' : 'Send Quotation'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
