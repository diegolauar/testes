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

describe('Ao tentar salvar uma transferencia invalida...', () => {

    const validTransfer = { description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() }
    const template = (newData , errorMessage) => {
        return request(app).post(MAIN_ROTE)
        .set('authorization', `bearer ${TOKEN}`)
        .send({...validTransfer, ...newData})
        .then(async (res) => {
            expect(res.status).toBe(400)
            expect(res.body.error).toBe(errorMessage)
        })
    }

    test('Não deve inserir sem descrição',() => template({description: null}, 'Descrição é um atributo obrigatório'))
    test('Não deve inserir sem valor',() => template({ammount: null}, 'Valor é um atributo obrigatório'))
    test('Não deve inserir sem data',() => template({date: null}, 'Data é um atributo obrigatório'))
    test('Não deve inserir sem conta de origem',() => template({acc_ori_id: null}, 'Conta de origem é um atributo obrigatório'))
    test('Não deve inserir sem conta de destino',() => template({acc_dest_id: null}, 'Conta de destino é um atributo obrigatório'))
    test('Não deve inserir se as contas de origem e destino forem as mesmas',() => template({acc_dest_id: 10000}, 'Não é possivel transferir de uma conta para a mesma'))
    test('Não deve inserir se as contas pertencem a outro usuario',() => template({acc_ori_id: 10002}, 'Conta de numero 10002 não pertence ao usuario'))
})

test('Deve uma transferencia por id', () => {
    return request(app).get(`${MAIN_ROTE}/10000`)
        .set('authorization', `bearer ${TOKEN}`)
        .then((res) => {
            expect(res.status).toBe(200)
            expect(res.body.description).toBe('Transfer #1')
        })
})

describe('Ao alterar uma transferencia valida...', () => {
    let transferId;
    let income;
    let outcome;

    test('Deve retornar o status 200 e os dados da transferencia', () => {
        return request(app).put(`${MAIN_ROTE}/10000`)
            .set('authorization', `bearer ${TOKEN}`)
            .send({ description: 'Transfer Updated', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 500, date: new Date() })
            .then(async (res) => {
                expect(res.status).toBe(200)
                expect(res.body.description).toBe('Transfer Updated')
                expect(res.body.ammount).toBe('500.00')
                transferId = res.body.id
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
        expect(outcome.ammount).toBe('-500.00')
        expect(outcome.acc_id).toBe(10000)
        expect(outcome.type).toBe('O')
    })

    test('A transações de saida deve ser positiva', () => {
        expect(income.description).toBe('Transfer from acc 10000')
        expect(income.ammount).toBe('500.00')
        expect(income.acc_id).toBe(10001)
        expect(income.type).toBe('I')
    })

    test('Ambas devem referencias a transferencias que as originou', () => {
        expect(income.transfer_id).toBe(transferId)
        expect(outcome.transfer_id).toBe(transferId)

    })
})


describe('Ao tentar alterar uma transferencia invalida...', () => {

    const validTransfer = { description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() }
    const template = (newData , errorMessage) => {
        return request(app).put(`${MAIN_ROTE}/10000`)
        .set('authorization', `bearer ${TOKEN}`)
        .send({...validTransfer, ...newData})
        .then(async (res) => {
            expect(res.status).toBe(400)
            expect(res.body.error).toBe(errorMessage)
        })
    }

    test('Não deve inserir sem descrição',() => template({description: null}, 'Descrição é um atributo obrigatório'))
    test('Não deve inserir sem valor',() => template({ammount: null}, 'Valor é um atributo obrigatório'))
    test('Não deve inserir sem data',() => template({date: null}, 'Data é um atributo obrigatório'))
    test('Não deve inserir sem conta de origem',() => template({acc_ori_id: null}, 'Conta de origem é um atributo obrigatório'))
    test('Não deve inserir sem conta de destino',() => template({acc_dest_id: null}, 'Conta de destino é um atributo obrigatório'))
    test('Não deve inserir se as contas de origem e destino forem as mesmas',() => template({acc_dest_id: 10000}, 'Não é possivel transferir de uma conta para a mesma'))
    test('Não deve inserir se as contas pertencem a outro usuario',() => template({acc_ori_id: 10002}, 'Conta de numero 10002 não pertence ao usuario'))
})