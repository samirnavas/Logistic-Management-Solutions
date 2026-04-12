import React from 'react';
import { Scale, Info } from 'lucide-react';

export interface ChargeableWeightItem {
  weight: number;
  packingVolume: number;
}

export interface ChargeableWeightSummaryProps {
  items: ChargeableWeightItem[];
  /**
   * The volumetric factor used for calculating volumetric weight.
   * Default is 167 (standard sea/road freight factor where 1 CBM = 167 kg).
   */
  volumetricFactor?: number;
}

export const ChargeableWeightSummary: React.FC<ChargeableWeightSummaryProps> = ({
  items,
  volumetricFactor = 167,
}) => {
  const totalActualWeight = items.reduce((acc, item) => acc + (item.weight || 0), 0);
  const totalCBM = items.reduce((acc, item) => acc + (item.packingVolume || 0), 0);
  const volumetricWeight = totalCBM * volumetricFactor;
  const chargeableWeight = Math.max(totalActualWeight, volumetricWeight);

  const isBilledVolumetric = volumetricWeight > totalActualWeight;
  const isBilledActual = totalActualWeight >= volumetricWeight;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
            <Scale className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Chargeable Weight Summary</h3>
            <p className="text-sm text-gray-500">Comparing Actual vs Volumetric Weight</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-lg font-semibold text-gray-900">{items.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actual Weight Card */}
        <div
          className={`relative p-5 rounded-xl border transition-colors ${
            isBilledActual 
              ? 'bg-green-50/50 border-green-200 shadow-sm' 
              : 'bg-gray-50 border-gray-200 opacity-80'
          }`}
        >
          {isBilledActual && (
            <div className="absolute -top-3 right-4">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 shadow-sm">
                Billed
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Actual Weight</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tight ${isBilledActual ? 'text-green-700' : 'text-gray-900'}`}>
                {totalActualWeight.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-gray-500">kg</span>
            </div>
          </div>
        </div>

        {/* Volumetric Weight Card */}
        <div
          className={`relative p-5 rounded-xl border transition-colors ${
            isBilledVolumetric 
              ? 'bg-green-50/50 border-green-200 shadow-sm' 
              : 'bg-gray-50 border-gray-200 opacity-80'
          }`}
        >
          {isBilledVolumetric && (
            <div className="absolute -top-3 right-4">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 shadow-sm">
                Billed
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
              Volumetric Weight
              <div 
                aria-label={`Formula: Total CBM (${totalCBM.toFixed(3)}) × Factor (${volumetricFactor})`} 
                title={`Calculation: ${totalCBM.toFixed(3)} CBM × ${volumetricFactor} = ${volumetricWeight.toFixed(2)} kg`}
                className="group cursor-help relative inline-flex"
              >
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </div>
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tight ${isBilledVolumetric ? 'text-green-700' : 'text-gray-900'}`}>
                {volumetricWeight.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-gray-500">kg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm py-4 px-5 bg-gray-50 rounded-xl border border-gray-200/60 mt-2">
        <div className="flex items-center gap-6 mb-4 sm:mb-0">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Total Volume</span>
            <span className="font-medium text-gray-900">{totalCBM.toFixed(3)} CBM</span>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Volumetric Factor</span>
            <span className="font-medium text-gray-900">1 CBM = {volumetricFactor} kg</span>
          </div>
        </div>
        <div className="flex flex-col text-left sm:text-right w-full sm:w-auto">
          <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold mb-1">Final Chargeable Weight</span>
          <span className="font-extrabold text-gray-900 text-xl">{chargeableWeight.toFixed(2)} kg</span>
        </div>
      </div>
    </div>
  );
};

export default ChargeableWeightSummary;
