const request = require('supertest');

const app = require('../../src/app');

const mail = `${Date.now()}@mail.com`


test('deve listar todos usuarios', () => {
    return request(app).get('/users')
        .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThan(0);
        });
});

test('Deve inserir um usuario', () => {
    return request(app).post('/users')
        .send({ name: 'Walter Wither', mail, passwd: '123456' })
        .then((res) => {
            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Walter Wither');
            expect(res.body).not.toHaveProperty('passwd')
        })
})

test('Deve armazenar senha criptografada', async () => {
    const res = await request(app).post('/users')
        .send({ name: 'Walter Wither', mail: `${Date.now()}@mail.com`, passwd: '123456' })
    expect(res.status).toBe(201)

    const { id } = res.body
    const userDB = await app.services.user.findOne({ id })
    expect(userDB.passwd).not.toBeUndefined()
    expect(userDB.passwd).not.toBe('123456')
})

test('Não deve inserir usuario sem nome', () => {
    return request(app).post('/users')
        .send({ mail: 'drdc@gmail.com', passwd: '123456' })
        .then((res) => {
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Nome é um atributo obrigatorio')
        })
})

test('Não deve inserir usuario sem email', async () => {
    const result = await request(app).post('/users')
        .send({ name: 'Walter', passwd: '1235' })
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Email é um atributo obrigatorio')

})

test('Não deve inserir usuario sem senha', (done) => {
    request(app).post('/users')
        .send({ name: 'Walter Mitty', mail: 'drdc@gmail.com' })
        .then((res) => {
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Senha é um atributo obrigatorio')
            done();
        })
})

test('Não deve inserir usuario com email existente', () => {
    return request(app).post('/users')
        .send({ name: 'Walter Wither', mail, passwd: '123456' })
        .then((res) => {
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Ja existe um usario com esse email');
        })
})