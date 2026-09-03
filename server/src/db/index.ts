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
        min:                2,
        max:                10,
        idleTimeoutMillis:  30_000,
        acquireTimeoutMillis: 15_000,
    },
};

export const db = drizzle({ connection: dbConfig as any, schema } as any);
