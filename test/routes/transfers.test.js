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

test('Deve inserir uma transferencia com sucesso', () => {
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

describe('Ao salvar uma transferencia valida:', () => {
    let transferId;
    let income;
    let outcome;

    test('Deve retornar o status 201 e os dados da transferencia', () => {
        return request(app).post(MAIN_ROTE)
            .set('authorization', `bearer ${TOKEN}`)
            .send({ description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() })
            .then(async (res) => {
                expect(res.status).toBe(201)
                expect(res.body[0].description).toBe('Regular Transfer')
                transferId = res.body[0].id
            })
    })

    test('As transações equivalentes devem ter sido geradas', async () => {
        const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount')
        expect(transactions).toHaveLength(2)
        if (transactions.length === 2) {
            [outcome, income] = transactions
        }
    })

    test('A transações de saida deve ser negativa', () => {
        expect(outcome.description).toBe('Transfer to acc 10001')
        expect(outcome.ammount).toBe('-100.00')
        expect(outcome.acc_id).toBe(10000)
        expect(outcome.type).toBe('O')
    })

    test('A transações de saida deve ser positiva', () => {
        expect(income.description).toBe('Transfer from acc 10000')
        expect(income.ammount).toBe('100.00')
        expect(income.acc_id).toBe(10001)
        expect(income.type).toBe('I')
    })

    test('Ambas devem referencias a transferencias que as originou', () => {
        expect(income.transfer_id).toBe(transferId)
        expect(outcome.transfer_id).toBe(transferId)

    })
})