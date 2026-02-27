import React from 'react';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'draft';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const normalizedStatus = status.toUpperCase().replace(/ /g, '_');

    let type: StatusType = 'info';
    let displayLabel = status.replace(/_/g, ' ');

    if (['REQUEST_SENT', 'PENDING_REVIEW', 'NEGOTIATION_REQUESTED'].includes(normalizedStatus)) {
        type = 'warning';
    } else if (['COST_CALCULATED', 'DRAFT'].includes(normalizedStatus)) {
        type = 'draft';
    } else if (['APPROVED', 'VERIFIED', 'QUOTATION_SENT', 'ACCEPTED', 'BOOKED', 'SHIPPED', 'DELIVERED', 'ADDRESS_PROVIDED', 'ACTIVE'].includes(normalizedStatus)) {
        type = 'success';
    } else if (['INFO_REQUIRED', 'REJECTED', 'CANCELLED', 'INACTIVE'].includes(normalizedStatus)) {
        type = 'error';
    }

    const baseStyles = "px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center justify-center tracking-wide";

    const typeStyles = {
        success: "bg-green-50 text-green-800 border-green-200",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        error: "bg-red-50 text-red-800 border-red-200",
        info: "bg-blue-50 text-blue-800 border-blue-200",
        draft: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return (
        <span className={`${baseStyles} ${typeStyles[type]} ${className}`}>
            {displayLabel.toUpperCase()}
        </span>
    );
}
