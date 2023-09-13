const ValidationError = require('../erros/ValidationError')

module.exports = (app) => {

    const findAll = () => {
        return app.db('users').where().select(['id', 'name', 'mail'])
    }

    const findOne = (filter = {}) => {
        return app.db('users').where(filter).first()
    }

    const save = async (user) => {
        if(!user.name) throw new ValidationError('Nome é um atributo obrigatorio')
        if(!user.mail) throw new ValidationError('Email é um atributo obrigatorio')
        if(!user.passwd) throw new ValidationError('Senha é um atributo obrigatorio')

        const userDb = await findOne({mail: user.mail})
        if(userDb) throw new ValidationError('Ja existe um usario com esse email')

        return app.db('users').insert(user, ['id', 'name', 'mail'])
    }

    return { findAll, save, findOne }
}