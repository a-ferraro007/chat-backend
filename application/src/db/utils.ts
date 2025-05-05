import * as bcrypt from 'bcryptjs'

async function hashPwd(
  password: string,
): Promise<{ passhash: string; salt: string }> {
  const salt = await bcrypt.genSalt(10)
  const passhash = await bcrypt.hash(password, salt)

  return {
    salt,
    passhash,
  }
}

async function validatePwd(
  password: string,
  passhash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, passhash)
}

export { hashPwd, validatePwd }
