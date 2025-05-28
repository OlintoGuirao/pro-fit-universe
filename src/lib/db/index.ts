import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Configuração da conexão com o banco de dados
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pro_fit_universe';

// Cliente do PostgreSQL
const client = postgres(connectionString);

// Instância do Drizzle ORM
export const db = drizzle(client, { schema }); 