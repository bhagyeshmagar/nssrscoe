import { drizzle } from 'drizzle-orm/node-mssql';
import * as schema from './schema';
import dotenv from 'dotenv';
import * as mssql from 'mssql';         
dotenv.config();

export const dbConfig = {
    server:   (process.env.DB_SERVER || 'localhost').replace('127.0.0.1', 'localhost'),
    database: process.env.DB_DATABASE || 'nss_db',
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
        encrypt: true, // Required by SQL Server and modern tedious driver
    },
    pool: {
        min: 2,
        // Rule of thumb: DB_POOL_MAX per instance × number of instances must not
        // exceed your Azure SQL tier's max concurrent session limit.
        // Azure SQL Basic: 30  | Standard S1: 60  | Standard S3: 600
        // Default 20 per instance allows up to 3 instances on Standard S1.
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis:   30_000,
        // Fail fast (10s) rather than queuing forever — surfaces overload sooner
        // so the caller gets a clear 503 instead of an eventual timeout cascade.
        acquireTimeoutMillis: 10_000,
    },
};

export const db = drizzle({ connection: dbConfig as any, schema } as any);
