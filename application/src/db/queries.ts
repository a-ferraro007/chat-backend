import { QueryResult } from 'pg'
import pool from './db'
import { CreateMessageDto } from '../dtos/messages.dto'

export type User = {
  id: string
  username: string
  salt: string
  passhash: string
}

export type UnauthorizedUser = {
  isUnauthorized: boolean
} & Partial<User>

export type Room = {
  id: string
  name: string
}

export type User_Rooms = {
  id: string
  username: string
}

export type Connected_User = {
  id: string
  user_id: string
  socket_id: string
}

export type Message = {
  id: string
  roomId: string
  text: string
  created_by: string
  created_on: string
}

async function findUser(username: string) {
  const result = await pool.query('SELECT * FROM users WHERE username=$1', [
    username,
  ])
  return result as QueryResult<User>
}

async function insertUser(username: string, salt: string, passhash: string) {
  const result = await pool.query(
    'INSERT INTO users (username, salt, passhash) values ($1, $2, $3) RETURNING *',
    [username, salt, passhash],
  )
  return result as QueryResult<User>
}

async function findAllRooms() {
  const result = await pool.query('SELECT * FROM rooms')
  return result as QueryResult<Room>
}

async function findRoomById(id: string) {
  console.log(id)

  const result = await pool.query('SELECT * FROM rooms WHERE id=$1', [id])
  return result as QueryResult<Room>
}

async function findRoomByName(name: string) {
  const result = await pool.query('SELECT * FROM rooms WHERE name=$1', [name])
  return result as QueryResult<Room>
}

async function findAllUsersInRoom(roomId: string) {
  const result = await pool.query(
    'SELECT u.id, u.username FROM users u JOIN user_rooms ur ON u.id = ur.user_id WHERE ur.room_id=$1',
    [roomId],
  )
  return result as QueryResult<User_Rooms>
}

async function insertUserIntoRoom(roomId: string, userId: string) {
  const result = await pool.query(
    'INSERT INTO user_rooms (user_id, room_id) VALUES($1, $2) ON CONFLICT (user_id, room_id) DO NOTHING RETURNING *',
    [userId, roomId],
  )
  return result as QueryResult<User_Rooms>
}

async function insertIntoRoom(name: string, type: 'PRIVATE' | 'GROUP') {
  const result = await pool.query(
    'INSERT INTO rooms (name, type) VALUES ($1, $2) RETURNING *',
    [name, type],
  )
  return result as QueryResult<Room>
}

async function insertConnectedUser(userId: string, socketId: string) {
  const result = await pool.query(
    'INSERT INTO connected_users (user_id, socket_id) VALUES ($1, $2) returning *',
    [userId, socketId],
  )
  return result as QueryResult<Connected_User>
}

async function deleteUsersFromRoom(userIds: string[], roomId: string) {
  await pool.query(
    'DELETE FROM user_rooms WHERE user_id = ANY($1) AND room_id = $2',
    [userIds, roomId],
  )
  return true
}

async function deleteConnectedUser(socketId: string) {
  const result = await pool.query(
    'DELETE FROM connected_users WHERE socket_id = $1 RETURNING *',
    [socketId],
  )
  return result
}

async function deleteAllConnectedUsers() {
  await pool.query('TRUNCATE TABLE connected_users RESTART IDENTITY CASCADE;')
}

async function getAllConnectedUsersInRoom(roomId: string) {
  const res = await pool.query(
    'SELECT cu.* FROM connected_users cu JOIN users u ON cu.user_id = u.id JOIN user_rooms ur ON u.id = ur.user_id WHERE ur.room_id = $1;',
    [roomId],
  )
  return res as QueryResult<Connected_User>
}

async function insertIntoMessage({
  roomId,
  text,
  created_by,
}: CreateMessageDto) {
  const res = await pool.query(
    'INSERT INTO messages (room_id, text, created_by, created_on) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id, room_id AS "roomId", text, created_by, created_on;',
    [roomId, text, created_by],
  )
  return res as QueryResult<Message>
}

export {
  findUser,
  insertUser,
  findAllRooms,
  findRoomById,
  findRoomByName,
  findAllUsersInRoom,
  insertIntoRoom,
  insertIntoMessage,
  insertUserIntoRoom,
  insertConnectedUser,
  deleteUsersFromRoom,
  deleteConnectedUser,
  deleteAllConnectedUsers,
  getAllConnectedUsersInRoom,
}
