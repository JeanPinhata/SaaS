import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

// Carrega .env.local manualmente caso não esteja no process.env
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERRO: Nenhuma DATABASE_URL ou DIRECT_URL encontrada no .env.local.");
  process.exit(1);
}

async function runMigration() {
  console.log("🔄 Conectando ao PostgreSQL do Supabase...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Conexão bem-sucedida ao Supabase!");

    const versionRes = await client.query("SELECT version();");
    console.log("📌 Versão do Banco:", versionRes.rows[0].version.split(",")[0]);

    const migrationFile = path.join(process.cwd(), "database", "migrations", "0001_foundation.sql");
    console.log("📄 Lendo migration:", migrationFile);
    const sql = fs.readFileSync(migrationFile, "utf-8");

    console.log("🚀 Executando migração 0001_foundation.sql no Supabase...");
    await client.query(sql);
    console.log("🎉 Migração executada com sucesso!");

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n📋 Tabelas criadas no banco de dados:");
    for (const row of tablesRes.rows) {
      console.log(`  - ${row.table_name}`);
    }
  } catch (error) {
    console.error("❌ Erro durante a conexão ou migração:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void runMigration();
