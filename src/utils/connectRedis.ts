import { createClient } from 'redis';




const redisUrl = `redis://default:19f2ed0fe6ad42c08adffbfdb6075b4c@apn1-model-halibut-34267.upstash.io:34267`;
const redisClient = createClient({
  url: redisUrl,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected...');
  } catch (err: any) {
    console.log(err.message);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();

redisClient.on('error', (err) => console.log(err));

export default redisClient;
