import { env } from 'node:process';

export default () => ({
  port: parseInt(env.PORT || '3000', 10),
  mongoUri: env.MONGO_URI,
  wssUrl: env.WSS_URL,
  token: env.TOKEN,
  aesKey: env.AES_KEY,
  password: env.PASSWORD,
});
