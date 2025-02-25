import { QueryResult } from 'pg'
import pool from './db'

export type User = {
  id: string
  username: string
  salt: string
  passhash: string
}

export type Room = {
  id: string
  name: string
}

export type User_Rooms = {
  id: string
  username: string
}

async function findUser(username: string) {
  const result = await pool.query('select * from users where username=$1', [
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
  const result = await pool.query('select * from rooms')
  return result as QueryResult<Room>
}

async function findRoomById(id: string) {
  const result = await pool.query('select * from rooms where id=$1', [id])
  return result as QueryResult<Room>
}

async function findAllUsersInRoom(roomId: string) {
  const result = await pool.query(
    'SELECT u.id, u.username FROM users u JOIN users_rooms ur ON u.id = ur.user_id WHERE ur.room_id=$1',
    [roomId],
  )

  return result as QueryResult<User_Rooms>
}

async function insertUserIntoRoom(roomId: string, userId: string) {
  const result = await pool.query(
    'INSERT INTO user_rooms (user_id, room_id) VALUES($1, $2) RETURNING *',
    [userId, roomId],
  )
  return result as QueryResult<User_Rooms>
}

async function insertIntoRoom(name: string) {
  const result = await pool.query(
    'INSERT INTO rooms (name) VALUES ($1) RETURNING *',
    [name],
  )
  return result as QueryResult<Room>
}

export {
  findUser,
  insertUser,
  findAllRooms,
  findRoomById,
  findAllUsersInRoom,
  insertUserIntoRoom,
  insertIntoRoom,
}
