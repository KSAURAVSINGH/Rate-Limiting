const redis = require('redis')
const moment = require('moment') // Used for parsing, validating, manipulating and formatting of dates

const redisClient = redis.createClient();
redisClient.on('error', (err)=>console.error('Redis client error: ', err));

(async () => {
    await redisClient.connect();
})();

const WINDOW_SIZE_IN_MINS = 2;
const MAX_WINDOW_REQUEST_COUNT = 10;
const WINDOW_LOG_INTERVAL_IN_MINS = 1;

const customRateLimiting = async (req, res, next) =>{
    
    try{
        // check that redis client exists
        if (!redisClient) {
            throw new Error('Redis client does not exist!');
        }
        
        // fetch records for the current ip address from the redis
        const recordData = await redisClient.get(req.ip);
        const currentRequestTime = moment();
        console.log("Records Available: ", recordData);
        console.log("Current Request Time: ", currentRequestTime);

        if(recordData == null){
            let recordList = [];
            let newRecord = {
                requestTimeStamp: currentRequestTime.unix(),
                requestCount: 1,
              }
            recordList.push(newRecord);
            await redisClient.set(req.ip, JSON.stringify(recordList));
            next();
        }
        else{
            // if recordData is found, parse it's value and calculate number of requests users has made within the last window
            let data = JSON.parse(recordData);
            let windowStartTimestamp = moment().subtract(WINDOW_LOG_INTERVAL_IN_MINS, 'minutes').unix();
            
            let requestsWithinWindow = data.filter((entry) => {
            return entry.requestTimeStamp > windowStartTimestamp;
            });

            let totalWindowRequestsCount = requestsWithinWindow.reduce((accumulator, entry) => {
                return accumulator + entry.requestCount;
            }, 0);

            if(totalWindowRequestsCount>MAX_WINDOW_REQUEST_COUNT){
                res.status(429).send(`You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_MINS} minutes limit!`)
            }        
            else{
                let lastRequestLog = data[data.length - 1]
                console.log("Last Request Log: ", lastRequestLog)

                let potentialCurrentWindowIntervalStartTimeStamp = moment().subtract(WINDOW_LOG_INTERVAL_IN_MINS, 'minutes').unix();                

                const newData = []
                let newRecord = {}
                if(lastRequestLog.requestTimeStamp>potentialCurrentWindowIntervalStartTimeStamp){                    
                    newRecord = {
                        requestTimeStamp: lastRequestLog.requestTimeStamp,
                        requestCount: lastRequestLog.requestCount + 1
                    }                                        
                }
                else{                    
                    newRecord = {
                        requestTimeStamp: moment().unix(),
                        requestCount: 1
                    }                                        
                }   
                newData.push(newRecord);
                await redisClient.set(req.ip, JSON.stringify(newData));
                next();                          
            }
        }
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    customRateLimiting: customRateLimiting
};