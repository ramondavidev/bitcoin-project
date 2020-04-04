const jwt = require('jsonwebtoken');

const middleware = {
    checkAuth: async (req, res, next) => {
        try{
            req.headers['authorization'] = 'Bearer ' + req.user.token;
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
    
            if(token == null) return res.sendStatus(401);

            jwt.verify(token, process.env.JWT_KEY, (err, user) => {
                if(err) return res.sendStatus(403);
                req.user = user;
                next();
            });
        }catch(err){
            console.log(err);
            res.redirect('/users/login');
        }
    }
};

module.exports = middleware;