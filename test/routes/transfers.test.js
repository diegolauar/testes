const request = require('supertest')
const app = require('../../src/app');
const transfer = require('../../src/services/transfer');

const MAIN_ROTE = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAwMDAsIm5hbWUiOiJVc2VyICMxIiwibWFpbCI6InVzZXIxQG1haWwuY29tIn0.QMgvo_lPe0Rdxpx7cay_hIkDAbjCK_--VD2fP0NTTqk'


beforeAll(async () => {
    return await app.db.seed.run();
})

test('Deve listar apenas as transferencias do usuario', () => {
    return request(app).get(MAIN_ROTE)
        .set('authorization', `bearer ${TOKEN}`)
        .then((res) => {
            expect(res.status).toBe(200)
            expect(res.body).toHaveLength(1)
            expect(res.body[0].description).toBe('Transfer #1')
        })
})

test('Deve inserir uma transferencias com sucesso', () => {
    return request(app).post(MAIN_ROTE)
        .set('authorization', `bearer ${TOKEN}`)
        .send({ description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() })
        .then(async (res) => {
            expect(res.status).toBe(201)
            expect(res.body[0].description).toBe('Regular Transfer')

            const transactions = await app.db('transactions').where({ transfer_id: res.body[0].id })
            expect(transactions).toHaveLength(2)
            expect(transactions[0].description).toBe('Transfer to acc 10001')    
            expect(transactions[1].description).toBe('Transfer from acc 10000')    
            expect(transactions[0].ammount).toBe('-100.00')    
            expect(transactions[1].ammount).toBe('100.00')    
            expect(transactions[0].acc_id).toBe(10000)    
            expect(transactions[1].acc_id).toBe(10001)    
        })
})