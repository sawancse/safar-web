'use client';

import { formatPaise } from '@/lib/utils';

interface Props {
  basePricePaise: number;
  pricingUnit: string;
  onSelect?: (categoryId: string, pricePaise: number) => void;
}

export default function RoomCategorySelector({ basePricePaise, pricingUnit }: Props) {
  const unit = pricingUnit === 'HOUR' ? 'hr' : pricingUnit === 'MONTH' ? 'month' : 'night';

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pricing</h2>
      <div className="border rounded-xl p-5 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Standard Room</p>
            <p className="text-xs text-gray-500 mt-1">Base rate for this property</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatPaise(basePricePaise)}
            <span className="text-gray-400 font-normal text-sm"> / {unit}</span>
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Room categories are configured by the host. Contact the property for available room options.
      </p>
    </div>
  );
}
