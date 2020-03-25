const jwt = require('jsonwebtoken');

const middleware = {
    checkAuth: (req, res, next) => {
        req.headers['authorization'] = 'Bearer ' + req.user.token;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
    
        if(token == null) return res.sendStatus(401);

        jwt.verify(token, 'secretkey', (err, user) => {
            if(err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    }
};

module.exports = middleware;