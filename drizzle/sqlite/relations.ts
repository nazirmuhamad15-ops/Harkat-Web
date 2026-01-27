import { relations } from "drizzle-orm/relations";
import { users, orders, products, orderItems, driverTasks, activityLogs } from "./schema";

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	orderItems: many(orderItems),
	driverTasks: many(driverTasks),
	activityLogs: many(activityLogs),
}));

export const usersRelations = relations(users, ({many}) => ({
	orders: many(orders),
	driverTasks: many(driverTasks),
	activityLogs: many(activityLogs),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	orderItems: many(orderItems),
	activityLogs: many(activityLogs),
}));

export const driverTasksRelations = relations(driverTasks, ({one}) => ({
	user: one(users, {
		fields: [driverTasks.driverId],
		references: [users.id]
	}),
	order: one(orders, {
		fields: [driverTasks.orderId],
		references: [orders.id]
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	order: one(orders, {
		fields: [activityLogs.entityId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [activityLogs.entityId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));