import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface VariantAttribute {
  name: string;
  value: string;
  attributeValueId: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stockCount: number;
  inStock: boolean;
  attributes: VariantAttribute[];
  images?: string[];
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
  className?: string;
}

interface AttributeOption {
  name: string;
  values: {
    value: string;
    attributeValueId: string;
    available: boolean;
  }[];
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  // Group attributes by name
  const attributeOptions: AttributeOption[] = [];
  const attributeMap = new Map<string, Set<string>>();

  variants.forEach((variant) => {
    variant.attributes.forEach((attr) => {
      if (!attributeMap.has(attr.name)) {
        attributeMap.set(attr.name, new Set());
      }
      attributeMap.get(attr.name)!.add(
        JSON.stringify({
          value: attr.value,
          attributeValueId: attr.attributeValueId,
        })
      );
    });
  });

  attributeMap.forEach((values, name) => {
    const uniqueValues = Array.from(values).map((v) => JSON.parse(v));
    attributeOptions.push({
      name,
      values: uniqueValues.map((v) => ({
        ...v,
        available: variants.some(
          (variant) =>
            variant.attributes.some(
              (attr) => attr.attributeValueId === v.attributeValueId
            ) && variant.inStock
        ),
      })),
    });
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedAttributes = new Map(
    selectedVariant?.attributes.map((attr) => [attr.name, attr.attributeValueId]) || []
  );

  const handleAttributeClick = (attributeName: string, attributeValueId: string) => {
    // Find variant that matches the new selection
    const newSelection = new Map(selectedAttributes);
    newSelection.set(attributeName, attributeValueId);

    const matchingVariant = variants.find((variant) => {
      return Array.from(newSelection.entries()).every(([name, valueId]) =>
        variant.attributes.some(
          (attr) => attr.name === name && attr.attributeValueId === valueId
        )
      );
    });

    if (matchingVariant) {
      onVariantChange(matchingVariant.id);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Attribute Selectors */}
      {attributeOptions.map((attribute) => (
        <div key={attribute.name} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
              {attribute.name}
            </h4>
            <span className="text-xs text-stone-500">
              {selectedAttributes.has(attribute.name)
                ? attribute.values.find(
                    (v) => v.attributeValueId === selectedAttributes.get(attribute.name)
                  )?.value
                : "Select"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {attribute.values.map((option) => {
              const isSelected =
                selectedAttributes.get(attribute.name) === option.attributeValueId;
              const isAvailable = option.available;

              return (
                <motion.button
                  key={option.attributeValueId}
                  whileHover={isAvailable ? { scale: 1.05 } : {}}
                  whileTap={isAvailable ? { scale: 0.95 } : {}}
                  onClick={() =>
                     handleAttributeClick(attribute.name, option.attributeValueId)
                  }
                  // disabled={!isAvailable} // Allow selection to see images
                  className={cn(
                    "relative px-4 py-2.5 rounded-lg border-2 transition-all duration-200",
                    "text-sm font-medium",
                    isSelected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : isAvailable
                      ? "border-stone-200 bg-white text-stone-900 hover:border-stone-400"
                      : "border-stone-100 bg-stone-50 text-stone-400 border-dashed", // OOS style
                     // !isAvailable && "line-through" // Remove line-through for better visibility
                  )}
                >
                  {option.value}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-stone-900 rounded-full p-0.5"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              SKU
            </span>
            <span className="text-sm font-mono font-semibold text-stone-900">
              {selectedVariant.sku}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Stock
            </span>
            <Badge
              variant={
                selectedVariant.stockCount === 0
                  ? "destructive"
                  : selectedVariant.stockCount <= 5
                  ? "secondary"
                  : "default"
              }
              className={cn(
                "text-xs",
                selectedVariant.stockCount > 5 && "bg-green-100 text-green-800 hover:bg-green-100"
              )}
            >
              {selectedVariant.stockCount === 0
                ? "Out of Stock"
                : selectedVariant.stockCount <= 5
                ? `Only ${selectedVariant.stockCount} left`
                : `${selectedVariant.stockCount} available`}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Price
            </span>
            <span className="text-lg font-bold text-stone-900">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(selectedVariant.price)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
