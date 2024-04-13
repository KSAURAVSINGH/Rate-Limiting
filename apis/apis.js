const welcomeComp = require('../routes/components/welcome')
const rateLimiter = require('../middlewares/rateLimit')

const handleApis = (app) =>{
    app.get('/', rateLimiter, welcomeComp.welcomeComp);
    app.get('/data', rateLimiter, welcomeComp.fetchData);
}

module.exports = handleApis;

