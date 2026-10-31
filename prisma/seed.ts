import { PrismaClient } from "@prisma/client"
import crypto from "crypto"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

async function main() {
  console.log("=== STARTING OPENBUMDES DATABASE SEEDING ===")

  // 1. Seed Default Users (Admin & Operator)
  console.log("Seeding default users...")
  const defaultUsers = [
    {
      username: "admin",
      passwordHash: hashPassword(process.env.SEED_ADMIN_PASSWORD || "admin123"),
      name: "Kepala / Direktur BUMDes",
      role: "ADMIN"
    },
    {
      username: "operator",
      passwordHash: hashPassword(process.env.SEED_OPERATOR_PASSWORD || "operator123"),
      name: "Bendahara / Operator Kasir",
      role: "OPERATOR"
    }
  ]

  for (const user of defaultUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        role: user.role
      },
      create: user
    })
  }

  // 2. Seed Bagan Akun Standar (COA) Kepmendes 136/2022
  const coaPath = path.join(__dirname, "coa_kemendes_136.json")
  if (fs.existsSync(coaPath)) {
    const raw = fs.readFileSync(coaPath, "utf-8")
    const coaList: { code: string; name: string; type: string; normal: string }[] = JSON.parse(raw)
    console.log(`Seeding ${coaList.length} Bagan Akun Standar Kepmendes 136/2022...`)
    for (const item of coaList) {
      await prisma.ledgerAccount.upsert({
        where: { code: item.code },
        update: { name: item.name, type: item.type, normal: item.normal },
        create: {
          code: item.code,
          name: item.name,
          type: item.type,
          normal: item.normal
        }
      })
    }
  }

  // 3. Seed Default Settings
  console.log("Seeding default settings...")
  const settings = [
    { key: "shu_pengurus_pct", value: "30" },
    { key: "shu_pengawas_pct", value: "10" },
    { key: "shu_sosial_pct", value: "10" },
    { key: "shu_modal_pct", value: "25" },
    { key: "shu_desa_pct", value: "25" },
    { key: "bumdes_name", value: "" },
    { key: "bumdes_address", value: "" },
    { key: "village_name", value: "" },
    { key: "subdistrict_name", value: "" },
    { key: "regency_name", value: "" },
    { key: "director_name", value: "" },
    { key: "treasurer_name", value: "" },
    { key: "operator_name", value: "Budi Santoso" },
    { key: "village_head", value: "" },
    { key: "supervisor_name", value: "" },
    { key: "gemini_api_key", value: "" },
    { key: "gemini_model", value: "gemini-3.5-flash" }
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    })
  }

  console.log("")
  console.log("=== SEEDING COMPLETED SUCCESSFULLY ===")
  console.log("Akun Pengguna Bawaan (Default Login):")
  console.log("1. Administrator : admin / admin123 (Akses Penuh / Direktur)")
  console.log("2. Operator      : operator / operator123 (Kasir / Bendahara / BKU)")
  console.log("")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
