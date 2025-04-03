import { Pool } from 'pg'

const pool = new Pool({
  host: 'postgres', //env.POSTGRES_HOST,
  user: 'admin', //env.POSTGRES_USER,
  password: 'pwd', //env.POSTGRES_PASSWORD,
  database: 'chat_db', //env.POSTGRES_DB,
  port: 5432, //env.POSTGRES_PORT,
  idleTimeoutMillis: 30000,
})

export default pool
