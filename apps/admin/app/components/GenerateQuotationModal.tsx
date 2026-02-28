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
                className="w-full max-w-4xl bg-gray-50 rounded-xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Row 1) */}
                <div className="flex-none bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-800">
                            {status === 'NEGOTIATION_REQUESTED' ? 'Revise Quotation' : 'Create Quotation'}
                        </h1>
                        <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-md">
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

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

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
                                            {existingData?.origin?.city || 'Origin City'}
                                        </span>
                                        <span className="text-sm font-bold text-gray-800 leading-none">
                                            {existingData?.destination?.city || 'Destination City'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Details */}
                            <div className="flex gap-8">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</span>
                                    <span className="text-sm font-bold text-gray-800">{customerName}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</span>
                                    <span className="text-sm font-bold text-gray-800">{existingData?.serviceType || 'Standard'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</span>
                                    <span className="text-sm font-bold text-gray-800">{existingData?.cargoType || 'General'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Form Inputs (Row 3 - Full Width Card) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col gap-5">
                        <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">Cost Breakdown</h3>

                        <div className="flex flex-row flex-wrap gap-5">
                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Base Price (₹)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.productBasePrice || ''}
                                    onChange={(e) => handleInputChange('productBasePrice', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Charges (₹)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.deliveryCharges || ''}
                                    onChange={(e) => handleInputChange('deliveryCharges', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Packaging Charges (₹)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.packagingCharges || ''}
                                    onChange={(e) => handleInputChange('packagingCharges', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Insurance Charges (₹)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.insuranceCharges || ''}
                                    onChange={(e) => handleInputChange('insuranceCharges', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Taxes (₹)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.taxes || ''}
                                    onChange={(e) => handleInputChange('taxes', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-red-500 uppercase tracking-wide">Discount Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md border border-red-300 bg-red-50/30 px-4 py-2.5 text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                    value={formData.discount || ''}
                                    onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="mt-2 bg-emerald-50/80 border border-emerald-200 rounded-lg px-6 py-4 flex justify-between items-center shadow-sm">
                            <span className="text-emerald-800 text-sm font-bold uppercase tracking-wider">Grand Total</span>
                            <span className="text-emerald-900 text-2xl font-bold tracking-tight">
                                ₹ {formData.finalQuotedAmount.toLocaleString('en-IN')}
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
                                    value={formData.validUntil}
                                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Terms</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Net 30 days"
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.paymentTerms}
                                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                                />
                            </div>

                            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Conditions</label>
                                <input
                                    type="text"
                                    placeholder="Detailed delivery terms..."
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    value={formData.deliveryConditions}
                                    onChange={(e) => handleInputChange('deliveryConditions', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 w-full mt-2">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Additional Notes/Terms</label>
                            <textarea
                                rows={3}
                                placeholder="Internal information or other notes..."
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none"
                                value={formData.otherInformation}
                                onChange={(e) => handleInputChange('otherInformation', e.target.value)}
                            />
                        </div>
                    </div>

                </div>

                {/* Sticky Footer (Row 5) */}
                <div className="flex-none bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 z-10">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={loading || !!error}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    );
}
