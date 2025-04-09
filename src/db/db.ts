import { Pool } from 'pg'

console.log(process.env.POSTGRES_HOST)

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'admin',
  password: process.env.POSTGRES_PASSWORD ?? 'pwd',
  database: process.env.POSTGRES_DB ?? 'chat_db',
  port: (process.env.POSTGRES_PORT as unknown as number) ?? 5431,
  idleTimeoutMillis: 30000,
})

export default pool

// const pool = new Pool({
//   host: 'postgres', //process.env.POSTGRES_HOST,
//   user: 'admin', //process.env.POSTGRES_USER,
//   password: 'pwd', //process.env.POSTGRES_PASSWORD,
//   database: 'chat_db', //process.env.POSTGRES_DB,
//   port: 5432, //process.env.POSTGRES_PORT,
//   idleTimeoutMillis: 30000,
// })
