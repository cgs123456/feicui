import Database from 'better-sqlite3'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Address, Order, OrderStatus, Product } from './types.js'

export type { Address, Order, OrderStatus, Product }

const HERE = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = join(HERE, '..', 'data')
mkdirSync(DATA_DIR, { recursive: true })

/** 前端 mock 数据源（seed 用），位于仓库 src/mock/products.json */
const FRONTEND_ROOT = join(HERE, '..', '..')
const MOCK_PRODUCTS_PATH = join(FRONTEND_ROOT, 'src', 'mock', 'products.json')
const MERCHANT_OWNER_TEL = ['138', '8888', '6666'].join('')

export const db = new Database(join(DATA_DIR, 'jadeite.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'buyer',
  nickname TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sms_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  merchant_id TEXT,
  merchant_name TEXT,
  title TEXT NOT NULL,
  category TEXT,
  price REAL NOT NULL,
  original_price REAL,
  cover TEXT,
  images TEXT,
  description TEXT,
  material TEXT,
  water_grade TEXT,
  color TEXT,
  size TEXT,
  weight TEXT,
  style TEXT,
  stock INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  views INTEGER NOT NULL DEFAULT 0,
  popularity INTEGER NOT NULL DEFAULT 0,
  inquiries INTEGER NOT NULL DEFAULT 0,
  cert_no TEXT,
  cert_org TEXT,
  cert_date TEXT,
  cert_grade TEXT,
  certificate TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  detail TEXT NOT NULL,
  full_address TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  buyer_id TEXT NOT NULL,
  buyer_name TEXT NOT NULL DEFAULT '',
  buyer_phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  total_price REAL NOT NULL,
  address TEXT NOT NULL,
  remark TEXT,
  items TEXT NOT NULL,
  idempotent_key TEXT,
  refund_from_status TEXT,
  refund_reason TEXT,
  refund_time TEXT,
  pay_time TEXT,
  ship_time TEXT,
  complete_time TEXT,
  logistics_no TEXT,
  logistics_company TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(buyer_id, idempotent_key)
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
`)

export function now(): string {
  return new Date().toISOString()
}

/** Seed：商品从 src/mock/products.json 导入（幂等：只导一次），并 seed 商家 M001 */
export function seed(): void {
  const count = (db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number }).c
  if (count > 0) return

  const mockProducts = JSON.parse(readFileSync(MOCK_PRODUCTS_PATH, 'utf-8')) as Record<
    string,
    unknown
  >[]
  const insert = db.prepare(`INSERT INTO products
    (id, merchant_id, merchant_name, title, category, price, original_price, cover, images,
     description, material, water_grade, color, size, weight, style,
     stock, status, views, popularity, inquiries, cert_no, cert_org, cert_date, cert_grade,
     certificate, created_at, updated_at)
    VALUES (@id, @merchant_id, @merchant_name, @title, @category, @price, @original_price,
     @cover, @images, @description, @material, @water_grade, @color, @size, @weight, @style,
     @stock, @status, @views, @popularity, @inquiries, @cert_no, @cert_org, @cert_date,
     @cert_grade, @certificate, @created_at, @updated_at)`)

  const rows = mockProducts.map(p => ({
    id: p.id,
    merchant_id: p.merchantId ?? 'M001',
    merchant_name: p.merchantName ?? '',
    title: p.title,
    category: p.category ?? '',
    price: p.price,
    original_price: p.originalPrice ?? null,
    cover: p.cover ?? '',
    images: JSON.stringify(p.images ?? []),
    description: p.description ?? '',
    material: p.material ?? '',
    water_grade: p.waterGrade ?? '',
    color: p.color ?? '',
    size: p.size ?? '',
    weight: p.weight ?? '',
    style: p.style ?? '',
    stock: p.stock ?? null,
    status: p.status ?? 'active',
    views: p.views ?? 0,
    popularity: p.popularity ?? 0,
    inquiries: p.inquiries ?? 0,
    cert_no: p.certNo ?? null,
    cert_org: p.certOrg ?? null,
    cert_date: p.certDate ?? null,
    cert_grade: p.certGrade ?? null,
    certificate: p.certificate ?? '',
    created_at: (p.createTime as string) || now(),
    updated_at: now()
  }))
  const tx = db.transaction((list: typeof rows) => {
    for (const r of list) insert.run(r)
  })
  tx(rows)

  db.prepare(
    `INSERT OR IGNORE INTO users (id, phone, role, nickname, created_at)
     VALUES ('M001', ?, 'owner', '翡翠源珠宝', ?)`
  ).run(MERCHANT_OWNER_TEL, now())
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

export function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    title: r.title as string,
    price: r.price as number,
    originalPrice: (r.original_price as number) ?? undefined,
    cover: str(r.cover),
    images: JSON.parse((r.images as string) || '[]') as string[],
    category: str(r.category),
    material: str(r.material),
    waterGrade: str(r.water_grade),
    color: str(r.color),
    size: str(r.size),
    weight: str(r.weight),
    style: str(r.style),
    merchantId: str(r.merchant_id),
    merchantName: str(r.merchant_name),
    description: str(r.description),
    status: (r.status as Product['status']) ?? 'active',
    createTime: str(r.created_at),
    views: r.views as number,
    inquiries: r.inquiries as number,
    certNo: str(r.cert_no),
    certOrg: str(r.cert_org),
    certDate: str(r.cert_date),
    certGrade: str(r.cert_grade),
    certificate: str(r.certificate),
    popularity: r.popularity as number,
    stock: (r.stock as number) ?? undefined
  }
}

export function rowToAddress(r: Record<string, unknown>): Address {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    province: r.province as string,
    city: r.city as string,
    district: r.district as string,
    detail: r.detail as string,
    fullAddress: r.full_address as string,
    isDefault: r.is_default === 1
  }
}

export function rowToOrder(r: Record<string, unknown>): Order {
  const refundFrom = r.refund_from_status as string | null
  return {
    id: r.id as string,
    orderNo: r.order_no as string,
    items: JSON.parse((r.items as string) || '[]'),
    totalPrice: r.total_price as number,
    status: r.status as OrderStatus,
    address: JSON.parse((r.address as string) || '{}') as Address,
    remark: str(r.remark),
    createTime: str(r.created_at),
    payTime: (r.pay_time as string) ?? undefined,
    shipTime: (r.ship_time as string) ?? undefined,
    completeTime: (r.complete_time as string) ?? undefined,
    refundReason: (r.refund_reason as string) ?? undefined,
    refundTime: (r.refund_time as string) ?? undefined,
    refundFromStatus: (refundFrom as OrderStatus) ?? undefined,
    logisticsNo: (r.logistics_no as string) ?? undefined,
    logisticsCompany: (r.logistics_company as string) ?? undefined,
    buyerId: r.buyer_id as string,
    buyerName: str(r.buyer_name),
    buyerPhone: str(r.buyer_phone)
  }
}
