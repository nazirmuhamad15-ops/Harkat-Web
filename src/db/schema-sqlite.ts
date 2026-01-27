import { sqliteTable, AnySQLiteColumn, uniqueIndex, text, numeric, real, integer, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	name: text(),
	password: text().notNull(),
	role: text().default("ADMIN").notNull(),
	phone: text(),
	avatar: text(),
	isActive: numeric().default(true).notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	uniqueIndex("users_email_key").on(table.email),
]);

export const products = sqliteTable("products", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	price: real().notNull(),
	comparePrice: real(),
	sku: text().notNull(),
	category: text().notNull(),
	material: text(),
	color: text(),
	weight: real().notNull(),
	length: real().notNull(),
	width: real().notNull(),
	height: real().notNull(),
	images: text(),
	isFragile: numeric().notNull(),
	topSideUp: numeric().notNull(),
	inStock: numeric().default(true).notNull(),
	stockCount: integer().default(0).notNull(),
	salesCount: integer().default(0).notNull(),
	featured: numeric().notNull(),
	status: text().default("ACTIVE").notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	uniqueIndex("products_sku_key").on(table.sku),
	uniqueIndex("products_slug_key").on(table.slug),
]);

export const orders = sqliteTable("orders", {
	id: text().primaryKey().notNull(),
	orderNumber: text().notNull(),
	userId: text().references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	customerName: text().notNull(),
	customerEmail: text().notNull(),
	customerPhone: text().notNull(),
	shippingAddress: text().notNull(),
	billingAddress: text(),
	subtotal: real().notNull(),
	shippingCost: real().notNull(),
	volumetricWeight: real().notNull(),
	finalWeight: real().notNull(),
	total: real().notNull(),
	status: text().default("PENDING").notNull(),
	paymentStatus: text().default("PENDING").notNull(),
	paymentMethod: text(),
	paymentVaNumber: text(),
	paymentQrUrl: text(),
	paymentExpiredAt: numeric(),
	notes: text(),
	shippingVendor: text(),
	trackingNumber: text(),
	estimatedDelivery: numeric(),
	actualDelivery: numeric(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	uniqueIndex("orders_orderNumber_key").on(table.orderNumber),
]);

export const orderItems = sqliteTable("order_items", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull().references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	productId: text().notNull().references(() => products.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	quantity: integer().notNull(),
	unitPrice: real().notNull(),
	total: real().notNull(),
});

export const shippingRates = sqliteTable("shipping_rates", {
	id: text().primaryKey().notNull(),
	region: text().notNull(),
	province: text().notNull(),
	ratePerKg: real().notNull(),
	minWeight: real().notNull(),
	isActive: numeric().default(true).notNull(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	uniqueIndex("shipping_rates_region_key").on(table.region),
]);

export const driverTasks = sqliteTable("driver_tasks", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull().references(() => orders.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	driverId: text().notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	status: text().default("ASSIGNED").notNull(),
	notes: text(),
	pickupAddress: text(),
	deliveryAddress: text(),
	customerName: text(),
	customerPhone: text(),
	currentLat: real(),
	currentLng: real(),
	lastGpsPing: numeric(),
	deliveryPhotoUrl: text(),
	signatureUrl: text(),
	deliveredAt: numeric(),
	deliveryNotes: text(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
});

export const activityLogs = sqliteTable("activity_logs", {
	id: text().primaryKey().notNull(),
	userId: text().notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	action: text().notNull(),
	entityType: text().notNull(),
	entityId: text().notNull().references(() => orders.id, { onDelete: "restrict", onUpdate: "cascade" } ).references(() => products.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	oldValues: text(),
	newValues: text(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const whatsappSessions = sqliteTable("whatsapp_sessions", {
	id: text().primaryKey().notNull(),
	phone: text().notNull(),
	sessionId: text().notNull(),
	isActive: numeric().notNull(),
	lastUsed: numeric(),
	createdAt: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	uniqueIndex("whatsapp_sessions_sessionId_key").on(table.sessionId),
	uniqueIndex("whatsapp_sessions_phone_key").on(table.phone),
]);

export const systemSettings = sqliteTable("system_settings", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	description: text(),
	updatedAt: numeric().notNull(),
},
(table) => [
	uniqueIndex("system_settings_key_key").on(table.key),
]);

