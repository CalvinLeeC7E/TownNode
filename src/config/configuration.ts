import { env } from 'node:process';

export default () => ({
  port: parseInt(env.PORT || '3000', 10),
  token: env.TOKEN,
  aesKey: env.AES_KEY,
  password: env.PASSWORD,
});
