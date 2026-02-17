import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error('MongoDB connection not found');

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],
    });

    return authInstance;
}

const createAuthProxy = () => {
    let instance: any = null;

    const getInstance = async () => {
        if (!instance) instance = await getAuth();
        return instance;
    };

    return new Proxy({} as any, {
        get: (target, prop) => {
            // Special handling for the .api property which is commonly accessed
            if (prop === 'api') {
                return new Proxy({}, {
                    get: (apiTarget, apiProp) => {
                        return async (...args: any[]) => {
                            const authInstance = await getInstance();
                            return (authInstance.api as any)[apiProp](...args);
                        };
                    }
                });
            }
            // Fallback for other properties
            return async (...args: any[]) => {
                const authInstance = await getInstance();
                const value = (authInstance as any)[prop];
                if (typeof value === 'function') {
                    return value.apply(authInstance, args);
                }
                return value;
            };
        }
    });
};

export const auth = createAuthProxy();
