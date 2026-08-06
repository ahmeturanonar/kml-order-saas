import { Role, UserStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      creditBalance: number;
      status: UserStatus;
    };
  }

  interface User {
    role?: Role;
    creditBalance?: number;
    status?: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    creditBalance?: number;
    status?: UserStatus;
  }
}
