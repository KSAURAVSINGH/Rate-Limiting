const redis = require('redis')
const moment = require('moment') // Used for parsing, validating, manipulating and formatting of dates

const redisClient = redis.createClient();
redisClient.on('error', (err)=>console.error('Redis client error: ', err));

(async () => {
    await redisClient.connect();
})();

const MAX_TOKENS_ALLOWED = 10
const TOKENS_TO_BE_FILLED = 2
const TOKENS_FILLED_PER_IN_SECONDS = 10
const TOKEN_BUCKET_REDIS_KEY = 'tokenbucket'

const customRedisTokenBucketRateLimiting = async (req, res, next) =>{
    
    try{
        // check that redis client exists
        if (!redisClient) {
            throw new Error('Redis client does not exist!');
        }
        
        // fetch records for the current ip address from the redis
        const recordData = await redisClient.get(TOKEN_BUCKET_REDIS_KEY);
        // tokenbucket key will have an object as a value with tokensInUse and requestTimeStamp as parameters
    
        const currentRequestTime = moment();
        console.log("Record: ", recordData);
        console.log("Current Request Time: ", currentRequestTime);

        if(recordData == null){            
            let newRecord = {
                requestTimeStamp: currentRequestTime.unix(),
                tokensInUse: 1,
              }
            
            await redisClient.set(TOKEN_BUCKET_REDIS_KEY, JSON.stringify(newRecord));
            next();
        }
        else{
            // if recordData is found, parse it's value and calculate number of requests users has made within the last window
            let data = JSON.parse(recordData);
            let windowStartTimestamp = moment().subtract(TOKENS_FILLED_PER_IN_SECONDS, 'seconds').unix();
            
            let requestsStartTimeBasedOnRecord = data.requestTimeStamp

            let totalWindowRequestsCount = data.tokensInUse || 0;
                        
            if(windowStartTimestamp<requestsStartTimeBasedOnRecord){
                // no increment in tokens
                if(totalWindowRequestsCount>=MAX_TOKENS_ALLOWED){
                    res.status(429).send(`The system has exceeded the max ${MAX_TOKENS_ALLOWED} tokens limit. Wait for ${TOKENS_FILLED_PER_IN_SECONDS} seconds to refill the tokens.`)
                }
                else{
                    let newRecord = {
                        requestTimeStamp: requestsStartTimeBasedOnRecord,
                        tokensInUse: totalWindowRequestsCount+1,
                      }
                    await redisClient.set(TOKEN_BUCKET_REDIS_KEY, JSON.stringify(newRecord));
                    next();
                }
            }
            else{
                // refill the token 
                let amountOfTokensToBeFilled = (Math.floor((windowStartTimestamp - requestsStartTimeBasedOnRecord)/TOKENS_FILLED_PER_IN_SECONDS)+1)*TOKENS_TO_BE_FILLED;
                let tokensUsed = Math.max(totalWindowRequestsCount-amountOfTokensToBeFilled, 1);
                
                let newRecord = {
                    requestTimeStamp: currentRequestTime.unix(),
                    tokensInUse: tokensUsed,
                  }
                
                await redisClient.set(TOKEN_BUCKET_REDIS_KEY, JSON.stringify(newRecord));
                next();
            }            
        }
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    customRedisTokenBucketRateLimiting: customRedisTokenBucketRateLimiting
};