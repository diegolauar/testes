const express = require('express')

module.exports = (app) => {
    app.use('/auth', app.routes.auth)
    const protectedRouter = express.Router()

    protectedRouter.use('/users', app.routes.users)
    protectedRouter.use('/accounts', app.routes.accounts)

    app.use('/v1', app.config.passport.authenticate(), protectedRouter)

    app.get('/v2/users', (req, res) => res.status(200).send('v2 no ar'))
    app.use('/v2', protectedRouter)

}