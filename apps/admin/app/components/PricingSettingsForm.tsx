'use client';

import { useState, useEffect } from 'react';

type SurchargeType = 'flat' | 'percentage';

interface Surcharge {
    type: SurchargeType;
    value: number;
}

interface ExchangeRates {
    USD: number;
    EUR: number;
    GBP: number;
    AED: number;
    CNY: number;
    JPY: number;
}

interface PricingConfig {
    baseCurrency: string;
    exchangeRates: ExchangeRates;
    transportRates: {
        air: { pricePerKg: number; pricePerCbm: number };
        sea: { pricePerCbm: number };
    };
    deliveryModes: {
        doorToDoor: number;
        doorToWarehouse: number;
        warehouseToDoor: number;
        warehouseToWarehouse: number;
    };
    itemCategories: {
        general: Surcharge;
        fragile: Surcharge;
        harmfulHazardous: Surcharge;
    };
    standardFees: {
        customsClearance: number;
        handlingFee: number;
        fuelSurchargePercentage: number;
    };
}

const CURRENCY_FLAGS: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', AED: '🇦🇪', CNY: '🇨🇳', JPY: '🇯🇵',
};

const CURRENCY_LABELS: Record<string, string> = {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
    AED: 'UAE Dirham', CNY: 'Chinese Yuan', JPY: 'Japanese Yen',
};

export default function PricingSettingsForm() {
    const [config, setConfig] = useState<PricingConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/pricing-config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setConfig(data.data);
            } else {
                setError(data.message || 'Failed to load pricing configuration.');
            }
        } catch {
            setError('An error occurred while fetching the configuration.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        setError('');
        setSuccessMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/pricing-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessMessage('Pricing configuration saved successfully.');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message || 'Failed to save configuration.');
            }
        } catch {
            setError('An error occurred while saving the configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (path: string, value: unknown) => {
        if (!config) return;
        const newConfig = JSON.parse(JSON.stringify(config)); // deep clone
        const keys = path.split('.');
        let current: Record<string, unknown> = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]] as Record<string, unknown>;
        }
        const lastKey = keys[keys.length - 1];
        if (typeof current[lastKey] === 'number') {
            const numVal = parseFloat(value as string);
            current[lastKey] = isNaN(numVal) || numVal < 0 ? 0 : numVal;
        } else {
            current[lastKey] = value;
        }
        setConfig(newConfig);
    };

    if (isLoading) return <div className="p-6 text-center text-gray-500">Loading pricing configuration...</div>;
    if (error && !config) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!config) return null;

    const currencies = Object.keys(config.exchangeRates || {}) as (keyof ExchangeRates)[];

    return (
        <div className="space-y-8">
            {/* Feedback */}
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {successMessage && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg text-sm">{successMessage}</div>}

            {/* Base Currency Banner */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-2xl">🇮🇳</span>
                <div>
                    <p className="text-sm font-bold text-orange-800">Base Currency: Indian Rupee (₹ INR)</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                        All rates below are in INR. When generating a quotation estimate, the engine
                        automatically converts the total to the client&apos;s selected currency using the
                        exchange rates in Section 5.
                    </p>
                </div>
            </div>

            {/* 1. Transport Rates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-1 border-b pb-2">
                    1. Transport Rates <span className="text-sm font-normal text-gray-400">(Base Freight — in ₹ INR)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    <div className="space-y-4">
                        <h4 className="font-medium text-sky-800">✈️ Air Freight</h4>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Price per KG (₹)</label>
                            <input type="number" min="0" step="1"
                                value={config.transportRates.air.pricePerKg}
                                onChange={e => updateConfig('transportRates.air.pricePerKg', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Price per CBM (₹)</label>
                            <input type="number" min="0" step="1"
                                value={config.transportRates.air.pricePerCbm}
                                onChange={e => updateConfig('transportRates.air.pricePerCbm', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-medium text-sky-800">🚢 Sea Freight</h4>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Price per CBM (₹)</label>
                            <input type="number" min="0" step="1"
                                value={config.transportRates.sea.pricePerCbm}
                                onChange={e => updateConfig('transportRates.sea.pricePerCbm', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Delivery Modes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-1 border-b pb-2">
                    2. Delivery Mode Flat-Rate Addons <span className="text-sm font-normal text-gray-400">(in ₹ INR)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {([
                        ['doorToDoor', 'Door-to-Door'],
                        ['doorToWarehouse', 'Door-to-Warehouse'],
                        ['warehouseToDoor', 'Warehouse-to-Door'],
                        ['warehouseToWarehouse', 'Warehouse-to-Warehouse'],
                    ] as const).map(([key, label]) => (
                        <div key={key}>
                            <label className="block text-sm text-gray-600 mb-1">{label} (₹)</label>
                            <input type="number" min="0" step="1"
                                value={config.deliveryModes[key]}
                                onChange={e => updateConfig(`deliveryModes.${key}`, e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Item Category Surcharges */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-1 border-b pb-2">
                    3. Item Category Surcharges <span className="text-sm font-normal text-gray-400">(flat values in ₹ INR)</span>
                </h3>
                <div className="space-y-6 mt-4">
                    {([
                        ['general', 'General Cargo', 'text-gray-700', 'sky'],
                        ['fragile', 'Fragile Cargo', 'text-amber-700', 'amber'],
                        ['harmfulHazardous', 'Harmful / Hazardous', 'text-red-700', 'red'],
                    ] as const).map(([key, label, textColor, ring]) => (
                        <div key={key} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className={`block text-sm font-medium mb-1 ${textColor}`}>{label}</label>
                                <select
                                    value={config.itemCategories[key].type}
                                    onChange={e => updateConfig(`itemCategories.${key}.type`, e.target.value)}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-${ring}-700/20`}
                                >
                                    <option value="flat">Flat Amount (₹ INR)</option>
                                    <option value="percentage">Percentage (% of base freight)</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">
                                    {config.itemCategories[key].type === 'flat' ? 'Amount (₹)' : 'Percentage (%)'}
                                </label>
                                <input type="number" min="0" step="0.01"
                                    value={config.itemCategories[key].value}
                                    onChange={e => updateConfig(`itemCategories.${key}.value`, e.target.value)}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-${ring}-700/20`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Standard Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-1 border-b pb-2">
                    4. Standard Fees <span className="text-sm font-normal text-gray-400">(flat values in ₹ INR)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Customs Clearance (₹)</label>
                        <input type="number" min="0" step="1"
                            value={config.standardFees.customsClearance}
                            onChange={e => updateConfig('standardFees.customsClearance', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Handling Fee (₹)</label>
                        <input type="number" min="0" step="1"
                            value={config.standardFees.handlingFee}
                            onChange={e => updateConfig('standardFees.handlingFee', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Fuel Surcharge (%)</label>
                        <input type="number" min="0" max="100" step="0.01"
                            value={config.standardFees.fuelSurchargePercentage}
                            onChange={e => updateConfig('standardFees.fuelSurchargePercentage', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20" />
                    </div>
                </div>
            </div>

            {/* 5. Exchange Rates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-zinc-900 mb-1 border-b pb-2">
                    5. Exchange Rates <span className="text-sm font-normal text-gray-400">(1 INR = ?)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-2 mb-4">
                    When a client selects a non-INR currency for their quotation, the engine multiplies the
                    INR total by the rate below. Update these periodically to keep estimates accurate.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currencies.map(currency => (
                        <div key={currency} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <span className="text-lg">{CURRENCY_FLAGS[currency]}</span>
                                <span>{currency}</span>
                                <span className="text-xs font-normal text-gray-400 ml-auto">{CURRENCY_LABELS[currency]}</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 shrink-0">₹1 =</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.0001"
                                    value={config.exchangeRates[currency]}
                                    onChange={e => updateConfig(`exchangeRates.${currency}`, e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-700/20"
                                />
                                <span className="text-xs text-gray-400 shrink-0">{currency}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-sky-700 text-white rounded-xl text-sm font-semibold hover:bg-sky-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? 'Saving...' : '💾 Save Pricing Configuration'}
                </button>
            </div>
        </div>
    );
}
