export interface Address {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    addressType?: string;
}

export interface SavedAddress {
    _id: string;
    label: string;
    addressLine: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    contactName: string;
    contactPhone: string;
    isDefault: boolean;
    type: 'pickup' | 'delivery' | 'both';
}

export interface User {
    id: string;
    _id?: string;
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    location?: string;
    avatarUrl?: string;
    role: 'client app' | 'manager' | 'admin';
    customerCode?: string;
    savedAddresses?: SavedAddress[];
    isActive: boolean;
    lastLoginAt?: Date | string;
    emailVerified: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    category: string;
    targetRate?: number;
    targetCurrency?: string;
    isHazardous?: boolean;
    weight?: number;
    packingVolume?: number;
    declaredValue?: number;
    value?: number;
    shippingCharge?: number;
}

export type QuotationStatus =
    | 'DRAFT'
    | 'PENDING_ADMIN_REVIEW'
    | 'INFO_REQUIRED'
    | 'VERIFIED'
    | 'ADDRESS_PROVIDED'
    | 'QUOTATION_GENERATED'
    | 'QUOTATION_SENT'
    | 'NEGOTIATION_REQUESTED'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'BOOKED';

export interface Quotation {
    id: string;
    _id?: string;
    quotationNumber?: string;
    quotationId?: string;

    // Relations
    managerId?: string | User;
    clientId: string | User;

    // Shipment Details
    origin: Address;
    destination: Address;
    pickupDate?: Date | string;
    deliveryDate?: Date | string;
    cargoType: string;
    serviceType: 'Standard' | 'Express' | 'Economy' | 'Priority';
    specialInstructions?: string;

    // Product Photos
    productPhotos?: string[];

    // Financial Details
    items: LineItem[];
    subtotal: number;
    baseFreightCharge?: number;
    estimatedHandlingFee?: number;
    firstMileCharge?: number;
    lastMileCharge?: number;
    taxRate: number;
    tax: number;
    discount: number;
    discountReason?: string;
    totalAmount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'AED' | 'INR';

    // Logistics specific
    routingData?: {
        sourceRegion?: string;
        sourceCity?: string;
        destinationRegion?: string;
        destinationCity?: string;
    };
    fulfillmentDetails?: {
        recipientName?: string;
        recipientPhone?: string;
        deliveryAddressLine?: string;
        deliveryCity?: string;
        deliveryState?: string;
        deliveryCountry?: string;
        deliveryZip?: string;
        deliveryType?: string;
        deliveryAddress?: string;
        senderName?: string;
        senderPhone?: string;
        pickupAddressLine?: string;
        pickupCity?: string;
        pickupState?: string;
        pickupCountry?: string;
        pickupZip?: string;
        pickupType?: string;
        pickupAddress?: string;
    };

    // Approval Workflow
    isApprovedByManager: boolean;
    managerApprovedAt?: Date | string;
    isAcceptedByClient: boolean;
    clientAcceptedAt?: Date | string;
    isRejectedByClient: boolean;
    clientRejectedAt?: Date | string;
    clientRejectionReason?: string;

    // Validity
    validUntil?: Date | string;

    // Documents
    pdfUrl?: string;

    // Notes
    internalNotes?: string;
    additionalNotes?: string;
    termsAndConditions?: string;

    // Status
    status: QuotationStatus;

    // Revision Tracking
    revisionNumber?: number;
    revisionCount?: number;
    previousVersionId?: string | Quotation;

    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface QuotationStats {
    totalRequests: number;
    pendingRequests: number;
    totalQuotations: number;
    pendingQuotations: number;
    acceptedQuotations: number;
}
