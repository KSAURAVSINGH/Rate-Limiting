const welcomeComp = require('../routes/components/welcome')
const {customRedisTokenBucketRateLimiting} = require('../middlewares/rateLimit')

const handleApis = (app) =>{
    app.get('/', customRedisTokenBucketRateLimiting, welcomeComp.welcomeComp);
    app.get('/data', welcomeComp.fetchData);
}

module.exports = handleApis;

