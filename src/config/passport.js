const passport = require('passport')
const pasport = require('passport')
const pasportJwt = require('passport-jwt')

const secret = 'Segredo!'

const { Strategy, ExtractJwt } = pasportJwt

module.exports = (app) => {
    const params = {
        secretOrKey: secret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    }

    const strategy = new Strategy(params, (payload, done) => {
        app.services.user.findOne({ id: payload.id })
            .then((user) => {
                if (user) done(null, { ...payload })
                else done(null, false)
            }).catch(err => done(err, false))
    })

    passport.use(strategy)

    return {
        authenticate: () => pasport.authenticate('jwt', { session: false })
    }
}