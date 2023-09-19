const request = require('supertest')
const jwt = require('jwt-simple')
const app = require('../../src/app')

const MAIN_ROUTE = ('/v1/accounts')
let user;

beforeAll(async () => {
    const res = await app.services.user.save({ name: 'User Account', mail: `${Date.now()}@mail.com`, passwd: '1234551' })
    user = { ...res[0] }
    user.token = jwt.encode(user, 'Segredo!')
})

test('Deve inserir uma conta com sucesso', () => {
    return request(app).post(MAIN_ROUTE)
        .send({ name: 'Acc #1', user_id: user.id })
        .set('authorization', `bearer ${user.token}`)
        .then((result) => {
            expect(result.status).toBe(201);
            expect(result.body.name).toBe('Acc #1');
        })
})

test('Não deve inserir uma conta sem nome', () => {
    return request(app).post(MAIN_ROUTE)
        .send({ user_id: user.id })
        .set('authorization', `bearer ${user.token}`)
        .then((result) => {
            expect(result.status).toBe(400);
            expect(result.body.error).toBe('Nome é um atributo obrigatorio');
        })
})

test('Deve listar todas as contas', () => {
    return app.db('accounts')
        .insert({ name: 'Acc list', user_id: user.id })
        .then(() => request(app).get(MAIN_ROUTE)
        .set('authorization', `bearer ${user.token}`))
        .then((res) => {
            expect(res.status).toBe(200)
            expect(res.body.length).toBeGreaterThan(0)
        })
})

test('Deve retorna uma conta por ID', () => {
    return app.db('accounts')
        .insert({ name: 'Acc By Id', user_id: user.id }, ['id'])
        .then(acc => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
        .set('authorization', `bearer ${user.token}`))
        .then((res) => {
            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Acc By Id')
            expect(res.body.user_id).toBe(user.id)
        })
})

test.skip('Não deve retornar uma conta de outro usuario', () => { })

test('Deve alterar uma conta', () => {
    return app.db('accounts')
        .insert({ name: 'Acc to Update', user_id: user.id }, ['id'])
        .then(acc => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
            .send({ name: 'Acc update' })
            .set('authorization', `bearer ${user.token}`))
        .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Acc update')
        })
})

test('Deve remover uma conta', () => {
    return app.db('accounts')
        .insert({ name: 'Acc to remove', user_id: user.id }, ['id'])
        .then(acc => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
        .set('authorization', `bearer ${user.token}`))
        .then((res) => {
            expect(res.status).toBe(204);
        })
})