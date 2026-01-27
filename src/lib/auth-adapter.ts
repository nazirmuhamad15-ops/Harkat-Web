import { Adapter, AdapterAccount, AdapterUser } from 'next-auth/adapters'
import { db } from '@/lib/db-drizzle'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export function CustomDrizzleAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = createId()
      await db.insert(users).values({
        id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: false, // We use boolean, not timestamp
        isActive: true,
        role: 'CUSTOMER',
      })
      
      const newUser = await db.query.users.findFirst({
        where: eq(users.id, id)
      })
      
      return {
        id: newUser!.id,
        email: newUser!.email,
        name: newUser!.name,
        image: newUser!.image,
        emailVerified: newUser!.emailVerified ? new Date() : null,
        role: newUser!.role as any,
        phone: newUser!.phone,
      } as AdapterUser
    },

    async getUser(id) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      })
      
      if (!user) return null
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified ? new Date() : null,
        role: user.role as any,
        phone: user.phone,
      } as AdapterUser
    },

    async getUserByEmail(email) {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      })
      
      if (!user) return null
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified ? new Date() : null,
        role: user.role as any,
        phone: user.phone,
      } as AdapterUser
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      })
      
      if (!account) return null
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, account.userId)
      })
      
      if (!user) return null
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified ? new Date() : null,
        role: user.role as any,
        phone: user.phone,
      } as AdapterUser
    },

    async updateUser(user) {
      await db.update(users)
        .set({
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified ? true : false,
        })
        .where(eq(users.id, user.id!))
      
      const updated = await db.query.users.findFirst({
        where: eq(users.id, user.id!)
      })
      
      return {
        id: updated!.id,
        email: updated!.email,
        name: updated!.name,
        image: updated!.image,
        emailVerified: updated!.emailVerified ? new Date() : null,
        role: updated!.role as any,
        phone: updated!.phone,
      } as AdapterUser
    },

    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, userId))
    },

    async linkAccount(account) {
      await db.insert(accounts).values({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state as string | null,
      })
      
      return account as AdapterAccount
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await db.delete(accounts).where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      )
    },

    async createSession({ sessionToken, userId, expires }) {
      await db.insert(sessions).values({
        sessionToken,
        userId,
        expires,
      })
      
      return { sessionToken, userId, expires }
    },

    async getSessionAndUser(sessionToken) {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.sessionToken, sessionToken)
      })
      
      if (!session) return null
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId)
      })
      
      if (!user) return null
      
      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified ? new Date() : null,
          role: user.role as any,
          phone: user.phone,
        } as AdapterUser,
      }
    },

    async updateSession({ sessionToken, expires }) {
      await db.update(sessions)
        .set({ expires })
        .where(eq(sessions.sessionToken, sessionToken))
      
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.sessionToken, sessionToken)
      })
      
      return session || null
    },

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
    },

    async createVerificationToken({ identifier, token, expires }) {
      await db.insert(verificationTokens).values({
        identifier,
        token,
        expires,
      })
      
      return { identifier, token, expires }
    },

    async useVerificationToken({ identifier, token }) {
      const verificationToken = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      })
      
      if (!verificationToken) return null
      
      await db.delete(verificationTokens).where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      )
      
      return verificationToken
    },
  }
}
