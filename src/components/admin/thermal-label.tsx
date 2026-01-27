import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // I need to add this dependency too
import { Package, Truck, AlertTriangle, ArrowUp } from 'lucide-react';

interface ThermalLabelProps {
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    weight: number;
    volumetricWeight: number;
    dimensions: string;
    vendor: string;
    trackingNumber: string;
    isFragile: boolean;
    topSideUp: boolean;
    qrCode: string;
  };
}

export const ThermalLabel: React.FC<ThermalLabelProps> = ({ order }) => {
  return (
    <div className="w-[10cm] h-[10cm] p-4 bg-white border-2 border-black flex flex-col font-sans text-black">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
        <div>
          <h1 className="text-xl font-bold">HARKAT</h1>
          <p className="text-[10px]">FURNITURE</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold bg-black text-white px-2 py-1 rounded">
            {order.vendor}
          </div>
          <p className="text-[10px] mt-1">{order.trackingNumber}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Recipient Info */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase">Penerima:</p>
          <p className="text-xs font-bold">{order.customerName}</p>
          <p className="text-[10px]">{order.customerPhone}</p>
          <p className="text-[10px] leading-tight mt-1 line-clamp-4">
            {order.customerAddress}
          </p>
        </div>

        {/* QR and Weight */}
        <div className="flex flex-col items-center justify-center border-l border-black pl-4">
          <QRCodeSVG value={order.qrCode} size={80} />
          <p className="text-[8px] mt-1 text-center">SCAN TO TRACK</p>
          <div className="mt-2 text-center">
            <p className="text-[10px]">Berat Akhir:</p>
            <p className="text-sm font-bold">{order.weight} KG</p>
            {order.volumetricWeight > 0 && (
              <p className="text-[8px]">Vol: {order.volumetricWeight} KG</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Icons */}
      <div className="mt-2 border-t-2 border-black pt-2 flex justify-between items-center">
        <div className="flex gap-2">
          {order.isFragile && (
            <div className="flex flex-col items-center">
              <AlertTriangle size={24} />
              <p className="text-[8px] font-bold">FRAGILE</p>
            </div>
          )}
          {order.topSideUp && (
            <div className="flex flex-col items-center">
              <ArrowUp size={24} />
              <p className="text-[8px] font-bold">TOP SIDE UP</p>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold">RESI PESANAN</p>
          <p className="text-lg font-black">{order.orderNumber}</p>
        </div>
      </div>
    </div>
  );
};
