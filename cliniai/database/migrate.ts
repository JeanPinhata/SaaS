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

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Verifica se 0001_foundation já foi executada no passado verificando a tabela organizations
    const orgCheck = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations';
    `);
    if (orgCheck.rows.length > 0) {
      await client.query(`
        INSERT INTO _migrations (name) VALUES ('0001_foundation.sql') ON CONFLICT (name) DO NOTHING;
      `);
    }

    const appliedRes = await client.query(`SELECT name FROM _migrations;`);
    const appliedSet = new Set(appliedRes.rows.map((r) => r.name));

    const migrationsDir = path.join(process.cwd(), "database", "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        console.log(`⏩ Migração ${file} já aplicada anteriormente. Pulando.`);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      console.log(`🚀 Executando migração ${file} no Supabase...`);
      const sql = fs.readFileSync(fullPath, "utf-8");
      await client.query(sql);
      await client.query(`INSERT INTO _migrations (name) VALUES ($1);`, [file]);
      console.log(`✅ Migração ${file} concluída com sucesso!`);
    }

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
