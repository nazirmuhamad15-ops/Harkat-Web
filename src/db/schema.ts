import { pgTable, text, integer, boolean, timestamp, doublePrecision, uniqueIndex, index, json } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ENUMS (as const objects or pgEnum if using native Postgres enums, but text is safer for Edge compat)
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  CUSTOMER: 'CUSTOMER',
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const PaymentStatus = {
  PENDING: 'PENDING',
  CONFIRMING: 'CONFIRMING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const ProductStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DRAFT: 'DRAFT',
} as const;

export const TaskStatus = {
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

// USERS
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password'), // Nullable for OAuth users
  role: text('role').notNull().default(UserRole.CUSTOMER),
  phone: text('phone'),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  verificationToken: text('verification_token'),
  tokenExpiry: timestamp('token_expiry'),
  otpCode: text('otp_code'),
  otpExpiry: timestamp('otp_expiry'),
  image: text('image'), // For OAuth profile picture
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    phoneIdx: index('users_phone_idx').on(table.phone),
  };
});

// NextAuth Required Tables
export const accounts = pgTable('account', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => {
  return {
    compoundKey: uniqueIndex('account_provider_providerAccountId_key').on(
      table.provider,
      table.providerAccountId
    ),
  };
});

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => {
  return {
    compoundKey: uniqueIndex('verificationToken_identifier_token_key').on(
      table.identifier,
      table.token
    ),
  };
});

// SYSTEM SETTINGS
export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// WHATSAPP SESSIONS
export const whatsappSessions = pgTable('whatsapp_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  phone: text('phone').notNull().unique(),
  sessionId: text('session_id').notNull().unique(),
  isActive: boolean('is_active').default(false),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// WHATSAPP TEMPLATES
export const whatsappTemplates = pgTable('whatsapp_templates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// CATEGORIES
export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  description: text('description'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PRODUCTS
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(),
  images: text('images'), // JSON string in Prisma, kept as text or use json()
  isFragile: boolean('is_fragile').default(false),
  topSideUp: boolean('top_side_up').default(true),
  featured: boolean('featured').default(false),
  status: text('status').default(ProductStatus.ACTIVE),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productAttributes = pgTable('product_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
});

export const productAttributeValues = pgTable('product_attribute_values', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  value: text('value').notNull(),
  attributeId: text('attribute_id').notNull().references(() => productAttributes.id),
}, (table) => {
    return {
        uniqueAttrValue: uniqueIndex('attr_value_unique').on(table.attributeId, table.value)
    }
});

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id),
  sku: text('sku').notNull().unique(),
  price: doublePrecision('price').notNull(),
  costPrice: doublePrecision('cost_price'),
  stockCount: integer('stock_count').default(0),
  images: text('images'),
  weight: doublePrecision('weight'),
  length: doublePrecision('length'),
  width: doublePrecision('width'),
  height: doublePrecision('height'),
  inStock: boolean('in_stock').default(true),
  shelfLocation: text('shelf_location'),
  lowStockThreshold: integer('low_stock_threshold'),
  salesCount: integer('sales_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    salesCountIdx: index('product_variants_sales_count_idx').on(table.salesCount),
  };
});

export const productVariantAttributes = pgTable('product_variant_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  variantId: text('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  attributeValueId: text('attribute_value_id').notNull().references(() => productAttributeValues.id),
}, (table) => {
    return {
        uniqueVariantAttr: uniqueIndex('var_attr_unique').on(table.variantId, table.attributeValueId)
    }
});

// ORDERS
export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderNumber: text('order_number').notNull().unique(),
  userId: text('user_id').references(() => users.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(), // JSON
  billingAddress: text('billing_address'), // JSON
  subtotal: doublePrecision('subtotal').notNull(),
  shippingCost: doublePrecision('shipping_cost').notNull(),
  volumetricWeight: doublePrecision('volumetric_weight').notNull(),
  finalWeight: doublePrecision('final_weight').notNull(),
  total: doublePrecision('total').notNull(),
  couponCode: text('coupon_code'),
  discountAmount: doublePrecision('discount_amount').default(0),
  status: text('status').default(OrderStatus.PENDING),
  paymentStatus: text('payment_status').default(PaymentStatus.PENDING),
  paymentMethod: text('payment_method'),
  paymentUrl: text('payment_url'), // Pakasir payment page URL
  paymentVaNumber: text('payment_va_number'),
  paymentQrUrl: text('payment_qr_url'),
  paymentFee: doublePrecision('payment_fee'), // Payment gateway fee
  paymentExpiredAt: timestamp('payment_expired_at'),
  notes: text('notes'),
  shippingVendor: text('shipping_vendor'),
  trackingNumber: text('tracking_number'),
  estimatedDelivery: timestamp('estimated_delivery'),
  actualDelivery: timestamp('actual_delivery'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index('orders_status_idx').on(table.status),
    paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
    trackingNumberIdx: index('orders_tracking_number_idx').on(table.trackingNumber),
    userIdIdx: index('orders_user_id_idx').on(table.userId),
  };
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productVariantId: text('product_variant_id').notNull().references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
  total: doublePrecision('total').notNull(),
});

// SHIPPING & RATES
export const shippingRates = pgTable('shipping_rates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  region: text('region').notNull().unique(),
  province: text('province').notNull(),
  ratePerKg: doublePrecision('rate_per_kg').notNull(),
  minWeight: doublePrecision('min_weight').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// FLEET & DRIVERS
export const driverTasks = pgTable('driver_tasks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id),
  driverId: text('driver_id').notNull().references(() => users.id),
  status: text('status').default(TaskStatus.ASSIGNED),
  notes: text('notes'),
  pickupAddress: text('pickup_address'),
  deliveryAddress: text('delivery_address'),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  currentLat: doublePrecision('current_lat'),
  currentLng: doublePrecision('current_lng'),
  lastGpsPing: timestamp('last_gps_ping'),
  deliveryPhotoUrl: text('delivery_photo_url'),
  signatureUrl: text('signature_url'),
  scheduledDate: timestamp('scheduled_date'),
  estimatedDelivery: timestamp('estimated_delivery'),
  deliveredAt: timestamp('delivered_at'),
  deliveryNotes: text('delivery_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  licensePlate: text('license_plate').notNull().unique(),
  type: text('type').notNull(),
  capacityKg: doublePrecision('capacity_kg').notNull(),
  status: text('status').default('AVAILABLE'),
  lastService: timestamp('last_service'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fuelLogs = pgTable('fuel_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  driverId: text('driver_id').notNull().references(() => users.id),
  orderId: text('order_id').references(() => orders.id),
  liters: doublePrecision('liters').notNull(),
  cost: doublePrecision('cost').notNull(),
  odometer: integer('odometer').notNull(),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const maintenanceLogs = pgTable('maintenance_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  description: text('description').notNull(),
  cost: doublePrecision('cost').notNull(),
  odometer: integer('odometer').notNull(),
  serviceDate: timestamp('service_date').notNull(),
  garageName: text('garage_name'),
  invoiceUrl: text('invoice_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});



// ACTIVITY LOGS
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  status: text('status').default('ai_active'), // ai_active, human_manual
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  unreadCount: integer('unread_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// COUPONS
export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  code: text('code').notNull().unique(), // e.g. "WELCOME10"
  description: text('description'), // "10% Off New User"
  discountType: text('discount_type').notNull().default('PERCENTAGE'), // PERCENTAGE, FIXED
  discountValue: doublePrecision('discount_value').notNull(), // 10 or 50000
  minOrderAmount: doublePrecision('min_order_amount').default(0),
  maxDiscountAmount: doublePrecision('max_discount_amount'), // Max discount for percentage
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  usageLimit: integer('usage_limit'), // Global usage limit
  usedCount: integer('used_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// MESSAGES
export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  conversationId: text('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  sender: text('sender').notNull(), // USER, ADMIN, SYSTEM
  type: text('type').default('text'), // text, image, document, location
  content: text('content'),
  mediaUrl: text('media_url'),
  status: text('status').default('SENT'), // SENT, DELIVERED, READ, PENDING_SEND, FAILED
  messageId: text('message_id'), // External ID from WhatsApp
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // ActivityType Enum
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  oldValues: text('old_values'), // JSON
  newValues: text('new_values'), // JSON
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('activity_logs_user_id_idx').on(table.userId),
    entityTypeIdx: index('activity_logs_entity_type_idx').on(table.entityType),
  };
});

// RELATIONS DEFINITIONS
export const usersRelations = relations(users, ({ many }) => ({
    orders: many(orders),
    driverTasks: many(driverTasks),
    fuelLogs: many(fuelLogs),
    activityLogs: many(activityLogs),
    addresses: many(userAddresses),
    accounts: many(accounts),
    sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const productsRelations = relations(products, ({ many }) => ({
    variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
    attributes: many(productVariantAttributes),
    orderItems: many(orderItems),
}));

export const productAttributeValuesRelations = relations(productAttributeValues, ({ one, many }) => ({
    attribute: one(productAttributes, {
        fields: [productAttributeValues.attributeId],
        references: [productAttributes.id],
    }),
    variants: many(productVariantAttributes),
}));

export const productVariantAttributesRelations = relations(productVariantAttributes, ({ one }) => ({
    variant: one(productVariants, {
        fields: [productVariantAttributes.variantId],
        references: [productVariants.id],
    }),
    attributeValue: one(productAttributeValues, {
        fields: [productVariantAttributes.attributeValueId],
        references: [productAttributeValues.id]
    })
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    items: many(orderItems),
    driverTasks: many(driverTasks),
    fuelLogs: many(fuelLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    productVariant: one(productVariants, {
        fields: [orderItems.productVariantId],
        references: [productVariants.id],
    }),
}));

export const driverTasksRelations = relations(driverTasks, ({ one, many }) => ({
    order: one(orders, {
        fields: [driverTasks.orderId],
        references: [orders.id],
    }),
    driver: one(users, {
        fields: [driverTasks.driverId],
        references: [users.id],
    }),
    trackingLogs: many(trackingLogs),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
    fuelLogs: many(fuelLogs),
    maintenanceLogs: many(maintenanceLogs),
}));

export const fuelLogsRelations = relations(fuelLogs, ({ one }) => ({
    vehicle: one(vehicles, {
        fields: [fuelLogs.vehicleId],
        references: [vehicles.id],
    }),
    driver: one(users, {
        fields: [fuelLogs.driverId],
        references: [users.id],
    }),
    order: one(orders, {
        fields: [fuelLogs.orderId],
        references: [orders.id],
    }),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
    vehicle: one(vehicles, {
        fields: [maintenanceLogs.vehicleId],
        references: [vehicles.id],
    }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    user: one(users, {
        fields: [activityLogs.userId],
        references: [users.id],
    }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    user: one(users, {
        fields: [conversations.userId],
        references: [users.id],
    }),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));

// GPS TRACKING LOGS
export const trackingLogs = pgTable('tracking_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  taskId: text('task_id').notNull().references(() => driverTasks.id),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  accuracy: doublePrecision('accuracy'), // GPS accuracy in meters
  speed: doublePrecision('speed'), // Speed in m/s
  heading: doublePrecision('heading'), // Direction in degrees
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    taskIdIdx: index('tracking_logs_task_id_idx').on(table.taskId),
    timestampIdx: index('tracking_logs_timestamp_idx').on(table.timestamp),
  };
});

export const trackingLogsRelations = relations(trackingLogs, ({ one }) => ({
    task: one(driverTasks, {
        fields: [trackingLogs.taskId],
        references: [driverTasks.id],
    }),
}));

// ADDRESSES
export const userAddresses = pgTable('user_addresses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(), // "Rumah", "Kantor"
  recipientName: text('recipient_name').notNull(),
  phone: text('phone').notNull(),
  addressLine: text('address_line').notNull(),
  province: text('province').notNull(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  postalCode: text('postal_code').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
    user: one(users, {
        fields: [userAddresses.userId],
        references: [users.id],
    }),
}));

// SCRAPED PRODUCTS (from marketplace scraper)
export const ScrapedProductStatus = {
  PENDING: 'PENDING',
  IMPORTED: 'IMPORTED',
  REJECTED: 'REJECTED',
} as const;

export const scrapedProducts = pgTable('scraped_products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  source: text('source').notNull(), // shopee, tiktok, tokopedia
  sourceUrl: text('source_url'),
  sourceProductId: text('source_product_id'),
  name: text('name').notNull(),
  description: text('description'),
  price: doublePrecision('price'),
  originalPrice: doublePrecision('original_price'),
  images: text('images'), // JSON array
  category: text('category'),
  variants: text('variants'), // JSON array
  specifications: text('specifications'), // JSON object
  status: text('status').default(ScrapedProductStatus.PENDING),
  importedProductId: text('imported_product_id').references(() => products.id),
  scrapedById: text('scraped_by_id').references(() => users.id),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
}, (table) => {
  return {
    sourceIdx: index('scraped_products_source_idx').on(table.source),
    statusIdx: index('scraped_products_status_idx').on(table.status),
  };
});

export const scrapedProductsRelations = relations(scrapedProducts, ({ one }) => ({
  importedProduct: one(products, {
    fields: [scrapedProducts.importedProductId],
    references: [products.id],
  }),
  scrapedBy: one(users, {
    fields: [scrapedProducts.scrapedById],
    references: [users.id],
  }),
}));

// PRODUCT REVIEWS
export const productReviews = pgTable('product_reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: text('order_id').references(() => orders.id),
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  helpfulCount: integer('helpful_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('reviews_product_id_idx').on(table.productId),
  userIdIdx: index('reviews_user_id_idx').on(table.userId),
  ratingIdx: index('reviews_rating_idx').on(table.rating),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [productReviews.orderId],
    references: [orders.id],
  }),
}));

// WISHLISTS
export const wishlists = pgTable('wishlists', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userProductUnique: uniqueIndex('wishlist_user_product_unique').on(table.userId, table.productId),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [wishlists.variantId],
    references: [productVariants.id],
  }),
}));

// BANNERS (Hero Slider)
export const banners = pgTable('banners', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  image: text('image').notNull(),
  link: text('link'),
  ctaText: text('cta_text').default('Shop Now'),
  order: integer('order').default(0),
  isActive: boolean('is_active').default(true),
  bgColor: text('bg_color').default('bg-gray-100'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
