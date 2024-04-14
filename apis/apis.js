const welcomeComp = require('../routes/components/welcome')
const {customRateLimiting} = require('../middlewares/rateLimit')

const handleApis = (app) =>{
    app.get('/', customRateLimiting, welcomeComp.welcomeComp);
    app.get('/data', customRateLimiting, welcomeComp.fetchData);
}

module.exports = handleApis;

