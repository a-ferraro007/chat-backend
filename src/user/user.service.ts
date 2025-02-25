import { Injectable } from '@nestjs/common'
import { SignInDto, SignUpDto } from '../auth/auth.dto'
import { findUser, insertUser } from 'src/db/queries'
import { hashPwd } from 'src/db/utils'

@Injectable()
export class UserService {
  async createUser(signUpDto: SignUpDto) {
    const { username, password } = signUpDto
    const findUserResult = await findUser(username)
    if (findUserResult.rowCount > 0) throw new Error('Username not available')

    const { salt, passhash } = await hashPwd(password)
    const insertUserResult = await insertUser(username, salt, passhash)
    if (insertUserResult.rowCount === 0) throw new Error('Error inserting user')

    return insertUserResult.rows[0]
  }

  async findUser(signInDto: SignInDto) {
    const { username } = signInDto

    const findUserResult = await findUser(username)
    if (findUserResult.rowCount === 0)
      throw new Error('User not found', { cause: { code: 'DBNotFoundError' } })

    return findUserResult.rows[0]
  }
}
