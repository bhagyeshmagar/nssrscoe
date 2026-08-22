import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

const server = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'nss_db';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'mssql',
    dbCredentials: {
        server: server,
        port: 1433,
        database: database,
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        options: {
            trustServerCertificate: true,
            encrypt: process.env.NODE_ENV === 'production',
        },
    },
});
