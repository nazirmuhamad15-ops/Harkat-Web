import { db } from '@/lib/db'
import { activityLogs } from '@/db/schema'
import { desc, eq, and, gte, lte } from 'drizzle-orm'

export const ActivityType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  VIEW: 'VIEW',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  TOGGLE_USER_STATUS: 'TOGGLE_USER_STATUS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_STOCK: 'UPDATE_STOCK',
  CREATE_CATEGORY: 'CREATE_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  CREATE_SHIPPING_RATE: 'CREATE_SHIPPING_RATE',
  UPDATE_SHIPPING_RATE: 'UPDATE_SHIPPING_RATE',
  DELETE_SHIPPING_RATE: 'DELETE_SHIPPING_RATE',
  CREATE_DRIVER_TASK: 'CREATE_DRIVER_TASK',
  UPDATE_DRIVER_TASK: 'UPDATE_DRIVER_TASK',
  DELETE_DRIVER_TASK: 'DELETE_DRIVER_TASK',
  CREATE_VOUCHER: 'CREATE_VOUCHER',
  UPDATE_VOUCHER: 'UPDATE_VOUCHER',
  DELETE_VOUCHER: 'DELETE_VOUCHER',
  CREATE_BUNDLE: 'CREATE_BUNDLE',
  UPDATE_BUNDLE: 'UPDATE_BUNDLE',
  DELETE_BUNDLE: 'DELETE_BUNDLE',
} as const

export type ActivityType = typeof ActivityType[keyof typeof ActivityType]

export interface AuditLogData {
  userId: string
  action: ActivityType
  entityType: string
  entityId: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  static async log(data: AuditLogData) {
    try {
      await db.insert(activityLogs).values({
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        })
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }
  }

  static async logProductUpdate(
    userId: string,
    productId: string,
    oldProduct: any,
    newProduct: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    
    // Compare fields and track changes
    const fieldsToTrack = ['name', 'price', 'stockCount', 'status', 'inStock']
    
    for (const field of fieldsToTrack) {
      if (oldProduct[field] !== newProduct[field]) {
        changes[field] = {
          old: oldProduct[field],
          new: newProduct[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId,
        action: ActivityType.UPDATE,
        entityType: 'product',
        entityId: productId,
        oldValues: changes,
        newValues: null, // Changes are stored in oldValues for updates
        ipAddress,
        userAgent,
      })
    }
  }

  static async logProductCreate(
    userId: string,
    productId: string,
    productData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      action: ActivityType.CREATE,
      entityType: 'product',
      entityId: productId,
      newValues: productData,
      ipAddress,
      userAgent,
    })
  }

  static async logProductDelete(
    userId: string,
    productId: string,
    productData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      action: ActivityType.DELETE,
      entityType: 'product',
      entityId: productId,
      oldValues: productData,
      ipAddress,
      userAgent,
    })
  }

  static async logOrderUpdate(
    userId: string,
    orderId: string,
    oldOrder: any,
    newOrder: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    
    const fieldsToTrack = ['status', 'paymentStatus', 'shippingCost', 'notes']
    
    for (const field of fieldsToTrack) {
      if (oldOrder[field] !== newOrder[field]) {
        changes[field] = {
          old: oldOrder[field],
          new: newOrder[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId,
        action: ActivityType.UPDATE,
        entityType: 'order',
        entityId: orderId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logUserAction(
    userId: string,
    action: ActivityType,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      action,
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    })
  }

  static async logUserCreate(
    adminId: string,
    newUserId: string,
    userData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.CREATE_USER,
      entityType: 'user',
      entityId: newUserId,
      newValues: userData,
      ipAddress,
      userAgent,
    })
  }

  static async logUserUpdate(
    adminId: string,
    userId: string,
    oldUserData: any,
    newUserData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = ['name', 'email', 'role', 'phone', 'isActive']

    for (const field of fieldsToTrack) {
      if (oldUserData[field] !== newUserData[field]) {
        changes[field] = {
          old: oldUserData[field],
          new: newUserData[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_USER,
        entityType: 'user',
        entityId: userId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logUserDelete(
    adminId: string,
    userId: string,
    deletedUserData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.DELETE_USER,
      entityType: 'user',
      entityId: userId,
      oldValues: deletedUserData,
      ipAddress,
      userAgent,
    })
  }

  static async logToggleUserStatus(
    adminId: string,
    userId: string,
    oldStatus: boolean,
    newStatus: boolean,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.TOGGLE_USER_STATUS,
      entityType: 'user',
      entityId: userId,
      oldValues: { isActive: oldStatus },
      newValues: { isActive: newStatus },
      ipAddress,
      userAgent,
    })
  }

  static async logUpdateSettings(
    adminId: string,
    oldSettings: any,
    newSettings: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = Object.keys(newSettings) // Track all changed settings

    for (const field of fieldsToTrack) {
      if (oldSettings[field] !== newSettings[field]) {
        changes[field] = {
          old: oldSettings[field],
          new: newSettings[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_SETTINGS,
        entityType: 'system',
        entityId: 'global_settings',
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logUpdateStock(
    adminId: string,
    productId: string,
    oldStock: number,
    newStock: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (oldStock !== newStock) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_STOCK,
        entityType: 'product',
        entityId: productId,
        oldValues: { stock: oldStock },
        newValues: { stock: newStock },
        ipAddress,
        userAgent,
      })
    }
  }

  static async logCategoryCreate(
    adminId: string,
    categoryId: string,
    categoryData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.CREATE_CATEGORY,
      entityType: 'category',
      entityId: categoryId,
      newValues: categoryData,
      ipAddress,
      userAgent,
    })
  }

  static async logCategoryUpdate(
    adminId: string,
    categoryId: string,
    oldCategoryData: any,
    newCategoryData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = ['name', 'slug', 'description']

    for (const field of fieldsToTrack) {
      if (oldCategoryData[field] !== newCategoryData[field]) {
        changes[field] = {
          old: oldCategoryData[field],
          new: newCategoryData[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_CATEGORY,
        entityType: 'category',
        entityId: categoryId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logCategoryDelete(
    adminId: string,
    categoryId: string,
    deletedCategoryData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.DELETE_CATEGORY,
      entityType: 'category',
      entityId: categoryId,
      oldValues: deletedCategoryData,
      ipAddress,
      userAgent,
    })
  }

  static async logShippingRateCreate(
    adminId: string,
    rateId: string,
    rateData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.CREATE_SHIPPING_RATE,
      entityType: 'shipping_rate',
      entityId: rateId,
      newValues: rateData,
      ipAddress,
      userAgent,
    })
  }

  static async logShippingRateUpdate(
    adminId: string,
    rateId: string,
    oldRateData: any,
    newRateData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = ['name', 'price', 'minWeight', 'maxWeight']

    for (const field of fieldsToTrack) {
      if (oldRateData[field] !== newRateData[field]) {
        changes[field] = {
          old: oldRateData[field],
          new: newRateData[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_SHIPPING_RATE,
        entityType: 'shipping_rate',
        entityId: rateId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logShippingRateDelete(
    adminId: string,
    rateId: string,
    deletedRateData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.DELETE_SHIPPING_RATE,
      entityType: 'shipping_rate',
      entityId: rateId,
      oldValues: deletedRateData,
      ipAddress,
      userAgent,
    })
  }

  static async logDriverTaskCreate(
    adminId: string,
    taskId: string,
    taskData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.CREATE_DRIVER_TASK,
      entityType: 'driver_task',
      entityId: taskId,
      newValues: taskData,
      ipAddress,
      userAgent,
    })
  }

  static async logDriverTaskUpdate(
    adminId: string,
    taskId: string,
    oldTaskData: any,
    newTaskData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = ['driverId', 'orderId', 'status', 'scheduledDate']

    for (const field of fieldsToTrack) {
      if (oldTaskData[field] !== newTaskData[field]) {
        changes[field] = {
          old: oldTaskData[field],
          new: newTaskData[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_DRIVER_TASK,
        entityType: 'driver_task',
        entityId: taskId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logDriverTaskDelete(
    adminId: string,
    taskId: string,
    deletedTaskData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.DELETE_DRIVER_TASK,
      entityType: 'driver_task',
      entityId: taskId,
      oldValues: deletedTaskData,
      ipAddress,
      userAgent,
    })
  }

  static async logVoucherCreate(
    adminId: string,
    voucherId: string,
    voucherData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.CREATE_VOUCHER,
      entityType: 'voucher',
      entityId: voucherId,
      newValues: voucherData,
      ipAddress,
      userAgent,
    })
  }

  static async logVoucherUpdate(
    adminId: string,
    voucherId: string,
    oldVoucherData: any,
    newVoucherData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = ['code', 'discountType', 'value', 'minOrderAmount', 'isActive']

    for (const field of fieldsToTrack) {
      if (oldVoucherData[field] !== newVoucherData[field]) {
        changes[field] = {
          old: oldVoucherData[field],
          new: newVoucherData[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_VOUCHER,
        entityType: 'voucher',
        entityId: voucherId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logVoucherDelete(
    adminId: string,
    voucherId: string,
    deletedVoucherData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.DELETE_VOUCHER,
      entityType: 'voucher',
      entityId: voucherId,
      oldValues: deletedVoucherData,
      ipAddress,
      userAgent,
    })
  }

  static async logBundleCreate(
    adminId: string,
    bundleId: string,
    bundleData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.CREATE_BUNDLE,
      entityType: 'bundle',
      entityId: bundleId,
      newValues: bundleData,
      ipAddress,
      userAgent,
    })
  }

  static async logBundleUpdate(
    adminId: string,
    bundleId: string,
    oldBundleData: any,
    newBundleData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const changes: any = {}
    const fieldsToTrack = ['name', 'discount', 'isActive']

    for (const field of fieldsToTrack) {
      if (oldBundleData[field] !== newBundleData[field]) {
        changes[field] = {
          old: oldBundleData[field],
          new: newBundleData[field],
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log({
        userId: adminId,
        action: ActivityType.UPDATE_BUNDLE,
        entityType: 'bundle',
        entityId: bundleId,
        oldValues: changes,
        ipAddress,
        userAgent,
      })
    }
  }

  static async logBundleDelete(
    adminId: string,
    bundleId: string,
    deletedBundleData: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId: adminId,
      action: ActivityType.DELETE_BUNDLE,
      entityType: 'bundle',
      entityId: bundleId,
      oldValues: deletedBundleData,
      ipAddress,
      userAgent,
    })
  }

  static async getAuditLogs(filters?: {
    userId?: string
    entityType?: string
    action?: string // string because ActivityType is local now
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const conditions = []
    
    if (filters?.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId))
    }
    
    if (filters?.entityType) {
      conditions.push(eq(activityLogs.entityType, filters.entityType))
    }
    
    if (filters?.action) {
      conditions.push(eq(activityLogs.action, filters.action))
    }
    
    if (filters?.startDate) {
      conditions.push(gte(activityLogs.createdAt, filters.startDate))
    }
    
    if (filters?.endDate) {
      conditions.push(lte(activityLogs.createdAt, filters.endDate))
    }

    const logs = await db.query.activityLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [desc(activityLogs.createdAt)],
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    })

    // Parse JSON fields
    return logs.map(log => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
    }))
  }
}

// Middleware helper to extract request info
export function getRequestInfo(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
  
  return {
    ipAddress: ip || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}