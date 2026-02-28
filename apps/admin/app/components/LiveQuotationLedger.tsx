import React from 'react';
import { Quotation } from '../../types';

interface LiveQuotationLedgerProps {
    quotation: Quotation;
}

export const LiveQuotationLedger: React.FC<LiveQuotationLedgerProps> = ({ quotation }) => {
    // Determine if prices should be shown
    const isPendingReview = quotation.status === 'PENDING_ADMIN_REVIEW' || quotation.status === 'DRAFT' || quotation.status === 'INFO_REQUIRED';

    const renderPrice = (price: number | undefined) => {
        if (isPendingReview || price === undefined || price === 0) {
            return 'TBD';
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(price);
    };

    const formatDate = (dateString?: Date | string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-white text-black p-8 max-w-4xl mx-auto border border-gray-300 shadow-sm font-sans" style={{ minHeight: '1056px', width: '100%' }}>
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-wider text-blue-600 mb-2">QUOTATION</h1>
                    <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded mb-6 border border-gray-200">
                        {quotation.serviceType === 'Priority' || quotation.serviceType === 'Express' ? 'High Priority Shipment' : quotation.status.replace(/_/g, ' ')}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-1">TO:</h3>
                        <p className="font-semibold text-gray-800">{quotation.destination?.name || 'Customer Name'}</p>
                        <p className="text-gray-600 whitespace-pre-line">
                            {quotation.destination?.addressLine}<br />
                            {quotation.destination?.city}, {quotation.destination?.state} {quotation.destination?.zip}<br />
                            {quotation.destination?.country}
                        </p>
                        <p className="text-gray-600 mt-1">📞 {quotation.destination?.phone}</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-blue-700 m-0 leading-none">B&B</h2>
                        <h2 className="text-xl font-bold text-blue-700 m-0 leading-tight">INTERNATIONAL</h2>
                        <p className="text-xs text-blue-500 font-medium italic">Serving You Beyond Borders</p>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-semibold">Quotation #:</span> {quotation.quotationId || quotation.quotationNumber || quotation.id.substring(0, 8)}</p>
                        <p><span className="font-semibold">Quotation Date:</span> {formatDate(quotation.createdAt)}</p>
                        <p><span className="font-semibold">Revision:</span> {quotation.revisionNumber || 0}</p>
                        <p><span className="font-semibold">Validity:</span> {formatDate(quotation.validUntil)}</p>
                    </div>
                </div>
            </div>

            {/* Main Item Table */}
            <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-16">ITEM NO.</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">COMMODITY DESCRIPTION</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-24">VOL / WGT</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-16">QTY</th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 w-28">UNIT PRICE</th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 w-28">TTL VALUE</th>
                    </tr>
                </thead>
                <tbody>
                    {quotation.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-3 text-center text-gray-800">{index + 1}</td>
                            <td className="border border-gray-300 px-3 py-3 text-gray-800">
                                <div className="font-medium">{item.description}</div>
                                {item.category && <div className="text-xs text-gray-500 mt-1 capitalize">{item.category}</div>}
                            </td>
                            <td className="border border-gray-300 px-3 py-3 text-center text-gray-800">-</td>
                            <td className="border border-gray-300 px-3 py-3 text-center text-gray-800">{item.quantity}</td>
                            <td className="border border-gray-300 px-3 py-3 text-right text-gray-800">{renderPrice(item.unitPrice)}</td>
                            <td className="border border-gray-300 px-3 py-3 text-right text-gray-800 font-medium">{renderPrice(item.amount)}</td>
                        </tr>
                    ))}
                    {(!quotation.items || quotation.items.length === 0) && (
                        <tr>
                            <td colSpan={6} className="border border-gray-300 px-3 py-6 text-center text-gray-500 italic">No items available currently.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pricing & Freight Summary */}
            <div className="flex justify-between items-start">
                <div className="w-1/2 pr-8 text-sm text-gray-600">
                    <p className="mb-2"><span className="font-semibold text-gray-800">Terms & Conditions:</span></p>
                    <p className="whitespace-pre-line text-xs">{quotation.termsAndConditions || 'Standard B&B International shipping terms apply. Liability limited as per standard waybill terms. Rates subject to final verification of weights and dimensions.'}</p>
                </div>

                <div className="w-1/2">
                    <div className="bg-gray-50 p-4 border border-gray-200 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between text-sm text-gray-700">
                            <span>Base Freight Charges</span>
                            <span className="font-medium">{renderPrice(quotation.subtotal)}</span>
                        </div>
                        {quotation.tax > 0 && (
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>Taxes ({quotation.taxRate}%)</span>
                                <span className="font-medium">{renderPrice(quotation.tax)}</span>
                            </div>
                        )}
                        {quotation.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-700">
                                <span>Discount {quotation.discountReason ? `(${quotation.discountReason})` : ''}</span>
                                <span className="font-medium">-{renderPrice(quotation.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-700">
                            <span>Last Mile Delivery</span>
                            <span className="font-medium italic text-gray-500">
                                {quotation.status === 'ADDRESS_PROVIDED' || quotation.status === 'QUOTATION_GENERATED' ? 'Included' : 'Pending Final Address'}
                            </span>
                        </div>

                        <div className="border-t border-gray-300 my-2"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">Final Quoted Amount</span>
                            <span className="text-xl font-bold text-blue-700">{renderPrice(quotation.totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400">
                <p>This is a computer-generated document. No signature is required.</p>
                <p>B&B Logistics & Management Solutions</p>
            </div>
        </div>
    );
};

export default LiveQuotationLedger;
