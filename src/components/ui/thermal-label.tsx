"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ThermalLabelProps extends React.ComponentProps<"div"> {
  orderId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: { name: string; quantity: number }[];
  shippingMethod: string;
  totalWeight: number;
  date: string;
}

function ThermalLabel({
  orderId,
  customerName,
  customerAddress,
  customerPhone,
  items,
  shippingMethod,
  totalWeight,
  date,
  className,
  ...props
}: ThermalLabelProps) {
  return (
    <div
      data-slot="thermal-label"
      className={cn(
        "w-[10cm] h-[10cm] p-2 border border-black text-black text-[8pt] font-mono bg-white",
        "flex flex-col justify-between",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="font-bold text-[10pt]">HASAN FURNITURE</div>
        <div className="text-[7pt]">{date}</div>
      </div>

      <div className="mb-1">
        <div className="font-bold">Order ID: {orderId}</div>
        <div>
          <span className="font-bold">Customer:</span> {customerName}
        </div>
        <div>
          <span className="font-bold">Address:</span> {customerAddress}
        </div>
        <div>
          <span className="font-bold">Phone:</span> {customerPhone}
        </div>
      </div>

      <div className="flex-grow border-t border-b border-black py-1 mb-1">
        <div className="font-bold mb-0.5">Items:</div>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>{item.name}</span>
            <span>x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="mb-1">
        <div>
          <span className="font-bold">Shipping Method:</span> {shippingMethod}
        </div>
        <div>
          <span className="font-bold">Total Weight:</span> {totalWeight} kg
        </div>
      </div>

      <div className="text-center text-[7pt] mt-auto">
        Thank you for your purchase!
      </div>
    </div>
  );
}

export { ThermalLabel };
