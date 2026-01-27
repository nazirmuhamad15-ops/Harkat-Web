import { z } from 'zod'

/**
 * Validation schema for creating an order
 */
export const createOrderSchema = z.object({
  customerName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters')
    .transform(val => val.trim()),
  
  customerEmail: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase()),
  
  customerPhone: z.string()
    .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Invalid Indonesian phone number format')
    .transform(val => {
      // Normalize to +62 format
      if (val.startsWith('0')) {
        return '+62' + val.slice(1)
      }
      if (val.startsWith('62')) {
        return '+' + val
      }
      return val
    }),
  
  shippingAddress: z.string()
    .min(10, 'Shipping address too short')
    .max(500, 'Shipping address too long')
    .refine(val => {
      try {
        const parsed = JSON.parse(val)
        return typeof parsed === 'object' && parsed !== null
      } catch {
        return false
      }
    }, 'Shipping address must be valid JSON')
    .transform(val => {
      const parsed = JSON.parse(val)
      // Sanitize each field - support both old and new format
      return JSON.stringify({
        address: String(parsed.address || parsed.street || '').slice(0, 200),
        city: String(parsed.city || '').slice(0, 100),
        province: String(parsed.province || '').slice(0, 100),
        zip: String(parsed.zip || parsed.postalCode || '').slice(0, 10),
        district: String(parsed.district || '').slice(0, 100),
        notes: String(parsed.notes || '').slice(0, 200)
      })
    }),
  
  billingAddress: z.string()
    .max(500, 'Billing address too long')
    .optional()
    .nullable(),
  
  items: z.array(z.object({
    productVariantId: z.string()
      .min(1, 'Product variant ID required')
      .max(50, 'Invalid product variant ID'),
    
    quantity: z.number()
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(100, 'Quantity cannot exceed 100 per item'),
    
    price: z.number()
      .positive('Price must be positive')
      .max(1000000000, 'Price too high'),
    
    weight: z.number()
      .nonnegative('Weight cannot be negative')
      .max(10000, 'Weight too high')
      .optional(),
    
    length: z.number()
      .nonnegative('Length cannot be negative')
      .max(1000, 'Length too high')
      .optional(),
    
    width: z.number()
      .nonnegative('Width cannot be negative')
      .max(1000, 'Width too high')
      .optional(),
    
    height: z.number()
      .nonnegative('Height cannot be negative')
      .max(1000, 'Height too high')
      .optional(),
  }))
    .min(1, 'At least one item is required')
    .max(50, 'Cannot order more than 50 different items at once'),
  
  shippingCost: z.number()
    .nonnegative('Shipping cost cannot be negative')
    .max(100000000, 'Shipping cost too high'),
  
  notes: z.string()
    .max(1000, 'Notes too long')
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return null
      // Remove HTML tags and trim
      return val.replace(/<[^>]*>/g, '').trim().slice(0, 1000)
    }),
  
  shippingVendor: z.string()
    .min(1, 'Shipping vendor required')
    .max(100, 'Shipping vendor name too long')
    .transform(val => val.trim()),
  
  volumetricWeight: z.number()
    .nonnegative('Volumetric weight cannot be negative')
    .max(10000, 'Volumetric weight too high')
    .optional()
    .default(0),
  
  finalWeight: z.number()
    .nonnegative('Final weight cannot be negative')
    .max(10000, 'Final weight too high')
    .optional()
    .default(0),

  couponCode: z.string()
    .max(20, 'Coupon code too long')
    .optional()
    .nullable(),

  discountAmount: z.number()
    .nonnegative('Discount cannot be negative')
    .optional()
    .default(0),
  
  paymentMethod: z.string().optional().default('all'), // Allow passing payment method preference
})

/**
 * Type inference from schema
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>

/**
 * Validation schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ]),
  notes: z.string()
    .max(500, 'Notes too long')
    .optional()
    .nullable()
})

/**
 * Validation schema for payment confirmation
 */
export const paymentConfirmationSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  paymentMethod: z.string().min(1, 'Payment method required'),
  transactionId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
})
