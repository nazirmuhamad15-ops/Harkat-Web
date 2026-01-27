
import { UserRole } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      phone?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    phone?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    phone?: string | null
  }
}
