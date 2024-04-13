const welcomeComp = (req, res) => {
    res.send('Hi! Welcome to the rate limiting enabled application')
}   

const fetchData = (req, res) =>{
    res.json({
        message: 'Find the most recent data here'
    })
}

module.exports = {
    welcomeComp: welcomeComp,
    fetchData: fetchData
}