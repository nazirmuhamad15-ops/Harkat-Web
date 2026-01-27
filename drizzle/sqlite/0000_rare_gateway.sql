-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password` text NOT NULL,
	`role` text DEFAULT 'ADMIN' NOT NULL,
	`phone` text,
	`avatar` text,
	`isActive` numeric DEFAULT true NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`comparePrice` real,
	`sku` text NOT NULL,
	`category` text NOT NULL,
	`material` text,
	`color` text,
	`weight` real NOT NULL,
	`length` real NOT NULL,
	`width` real NOT NULL,
	`height` real NOT NULL,
	`images` text,
	`isFragile` numeric DEFAULT false NOT NULL,
	`topSideUp` numeric DEFAULT false NOT NULL,
	`inStock` numeric DEFAULT true NOT NULL,
	`stockCount` integer DEFAULT 0 NOT NULL,
	`salesCount` integer DEFAULT 0 NOT NULL,
	`featured` numeric DEFAULT false NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_key` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_key` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`orderNumber` text NOT NULL,
	`userId` text,
	`customerName` text NOT NULL,
	`customerEmail` text NOT NULL,
	`customerPhone` text NOT NULL,
	`shippingAddress` text NOT NULL,
	`billingAddress` text,
	`subtotal` real NOT NULL,
	`shippingCost` real NOT NULL,
	`volumetricWeight` real NOT NULL,
	`finalWeight` real NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`paymentStatus` text DEFAULT 'PENDING' NOT NULL,
	`paymentMethod` text,
	`paymentVaNumber` text,
	`paymentQrUrl` text,
	`paymentExpiredAt` numeric,
	`notes` text,
	`shippingVendor` text,
	`trackingNumber` text,
	`estimatedDelivery` numeric,
	`actualDelivery` numeric,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_orderNumber_key` ON `orders` (`orderNumber`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`productId` text NOT NULL,
	`quantity` integer NOT NULL,
	`unitPrice` real NOT NULL,
	`total` real NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shipping_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`region` text NOT NULL,
	`province` text NOT NULL,
	`ratePerKg` real NOT NULL,
	`minWeight` real NOT NULL,
	`isActive` numeric DEFAULT true NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipping_rates_region_key` ON `shipping_rates` (`region`);--> statement-breakpoint
CREATE TABLE `driver_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`driverId` text NOT NULL,
	`status` text DEFAULT 'ASSIGNED' NOT NULL,
	`notes` text,
	`pickupAddress` text,
	`deliveryAddress` text,
	`customerName` text,
	`customerPhone` text,
	`currentLat` real,
	`currentLng` real,
	`lastGpsPing` numeric,
	`deliveryPhotoUrl` text,
	`signatureUrl` text,
	`deliveredAt` numeric,
	`deliveryNotes` text,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`action` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`oldValues` text,
	`newValues` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`entityId`) REFERENCES `orders`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`entityId`) REFERENCES `products`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `whatsapp_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`sessionId` text NOT NULL,
	`isActive` numeric DEFAULT false NOT NULL,
	`lastUsed` numeric,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_sessions_sessionId_key` ON `whatsapp_sessions` (`sessionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_sessions_phone_key` ON `whatsapp_sessions` (`phone`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_settings_key_key` ON `system_settings` (`key`);
*/