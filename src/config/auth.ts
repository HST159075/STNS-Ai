import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import prisma from "./prisma";

const BACKEND_URL = process.env.BETTER_AUTH_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    // baseURL = backend root. Better Auth appends /api/auth internally.
    baseURL: BACKEND_URL,
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:5000",
        FRONTEND_URL,
        `${FRONTEND_URL}/dashboard`,
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "CLIENT"
            },
            isOnboarded: {
                type: "boolean",
                defaultValue: false
            }
        }
    },
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        },
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            httpOnly: true,
        }
    }
});
