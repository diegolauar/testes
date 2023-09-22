const request = require('supertest')
const jwt = require('jwt-simple')
const app = require('../../src/app')

const MAIN_ROTE = '/v1/transactions';
let user;
let user2;
let accUser;
let accUser2;

beforeAll(async () => {
    await app.db('transactions').del();
    await app.db('accounts').del();
    await app.db('users').del();
    const users = await app.db('users').insert([
        { name: 'User #1', mail: 'user@mail.com', passwd: '$2a$10$DmBB2BhNI.AaccbThq5bbetBl9wgVL87EUw17HQpXbID0m0DxmMDa' },
        { name: 'User #2', mail: 'user2@mail.com', passwd: '$2a$10$DmBB2BhNI.AaccbThq5bbetBl9wgVL87EUw17HQpXbID0m0DxmMDa' }
    ], '*');
    [user, user2] = users;
    delete user.passwd;
    user.token = jwt.encode(user, 'Segredo!')
    const accs = await app.db('accounts').insert([
        { name: 'Acc #1', user_id: user.id },
        { name: 'Acc #2', user_id: user2.id }
    ], '*');
    [accUser, accUser2] = accs
})
test('Deve listar apenas as transações do usuario', () => {
    return app.db('transactions').insert([
        { description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id },
        { description: 'T2', date: new Date(), ammount: 300, type: 'O', acc_id: accUser2.id },
    ]).then(() => request(app).get(MAIN_ROTE)
        .set('authorization', `bearer ${user.token}`)
        .then((res) => {
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(1)
            expect(res.body[0].description).toBe('T1')
        }))

})

test('Deve inserir uma transição com sucesso', () => {
    return request(app).post(MAIN_ROTE)
    .set('authorization', `bearer ${user.token}`)
    .send({description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id})
    .then((res) => {
        expect(res.status).toBe(201)
        expect(res.body.acc_id).toBe(accUser.id)
    })
});

test('Deve retornar uma transição por id', () => {
    return app.db('transactions').insert(
       {description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id},['id']
    ).then(trans => request(app).get(`${MAIN_ROTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
        expect(res.status).toBe(200)
        expect(res.body.id).toBe(trans[0].id)
        expect(res.body.description).toBe('T ID')
    }))
   
});

test('Deve alterar uma transição', () => {
    return app.db('transactions').insert(
       {description: 'T Update', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id},['id']
    ).then(trans => request(app).put(`${MAIN_ROTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({description: 'Updated'})
    .then((res) => {
        expect(res.status).toBe(200)
        expect(res.body.description).toBe('Updated')
    }))
   
});

test('Deve remover uma transição', () => {
    return app.db('transactions').insert(
       {description: 'T Delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id},['id']
    ).then(trans => request(app).delete(`${MAIN_ROTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
        expect(res.status).toBe(204)
    }))
   
});