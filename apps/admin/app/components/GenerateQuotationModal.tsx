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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-[583px] bg-white rounded-lg shadow-2xl relative max-h-[95vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-[#868686] hover:text-[#333333] transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <h1 className="text-[20px] font-medium text-[#333333] leading-7 mb-11">
                        {status === 'NEGOTIATION_REQUESTED' ? 'Revise Quotation' : 'Create Quotation'}
                    </h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Quotation Info Card */}
                    <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[#868686] text-base">Quotation ID</span>
                            <span className="text-[#333333] text-base">{quotationId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#868686] text-base">Linked Request ID</span>
                            <span className="text-[#333333] text-base">{linkedRequestId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#868686] text-base">Customer Name</span>
                            <span className="text-[#333333] text-base">{customerName}</span>
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.productBasePrice || ''}
                                    onChange={(e) => handleInputChange('productBasePrice', Number(e.target.value))}
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.deliveryCharges || ''}
                                    onChange={(e) => handleInputChange('deliveryCharges', Number(e.target.value))}
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.packagingCharges || ''}
                                    onChange={(e) => handleInputChange('packagingCharges', Number(e.target.value))}
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.insuranceCharges || ''}
                                    onChange={(e) => handleInputChange('insuranceCharges', Number(e.target.value))}
                                />
                            </div>

                            {/* Taxes (GST, etc.) */}
                            <div>
                                <label className="block text-sm text-[#333333] mb-2">
                                    Taxes (GST, etc.)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Taxes (GST, etc.)"
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.taxes || ''}
                                    onChange={(e) => handleInputChange('taxes', Number(e.target.value))}
                                />
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm text-[#333333] mb-2">
                                    Discount
                                </label>
                                <input
                                    type="number"
                                    placeholder="Discount"
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.discount || ''}
                                    onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Final Quoted Amount */}
                        <div className="bg-[#F5F5F5] rounded-lg px-6 py-4 mt-6 flex justify-between items-center">
                            <span className="text-[#868686] text-base">Final Quoted Amount</span>
                            <span className="text-[#333333] text-lg font-semibold leading-[25.2px]">
                                ₹ {formData.finalQuotedAmount.toLocaleString('en-IN')}
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
                            value={formData.validUntil}
                            onChange={(e) => handleInputChange('validUntil', e.target.value)}
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.paymentTerms}
                                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.deliveryConditions}
                                    onChange={(e) => handleInputChange('deliveryConditions', e.target.value)}
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
                                    className="w-full bg-[#F5F5F5] rounded-[20px] px-5 py-2.5 text-sm text-[#868686] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-[#0557A5]/20"
                                    value={formData.otherInformation}
                                    onChange={(e) => handleInputChange('otherInformation', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            disabled={loading || !!error}
                            className="flex-1 bg-[#0557A5] text-white rounded-[20px] h-10 text-sm font-normal leading-[19.6px] hover:bg-[#044580] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSubmit}
                        >
                            {loading ? 'Processing...' : 'Send Quotation'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
