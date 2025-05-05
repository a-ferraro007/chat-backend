import 'dotenv/config'
import { Pool } from 'pg'
console.log(
  process.env.POSTGRES_HOST,
  process.env.POSTGRES_PASSWORD,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PORT,
  process.env.POSTGRES_DB,
)

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'admin',
  password: process.env.POSTGRES_PASSWORD ?? 'pwd',
  database: process.env.POSTGRES_DB ?? 'chat_db',
  port: (process.env.POSTGRES_PORT as unknown as number) ?? 5431,
  idleTimeoutMillis: 30000,
})

export default pool
