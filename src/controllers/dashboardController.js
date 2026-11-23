const { Op } = require('sequelize');
const { sequelize, Product, Producer, Budget, BudgetItem } = require('../models');
const v = require('../lib/validation');
const { formAction } = require('../middleware/errors');

const categories = ['CABLING', 'CERTIFICACAO', 'INFRAESTRUTURA', 'TELEFONIA'];
const productAction = action => formAction('/dashboard', action);
const producerAction = action => formAction('/dashboard/producers', action);
const budgetAction = action => formAction('/budgets', action);

async function existing(model, value, options = {}) {
    const row = await model.findByPk(v.id(value), options);

    if (!row) throw new v.FormError('Registro não encontrado. Atualize a página.', 404);

    return row;
}

async function productData(body) {
    const productName = v.text(body.productName, 'o nome do produto', 200);
    const detail = v.text(body.detail, 'o tipo do produto', 160);

    if (!categories.includes(body.category)) throw new v.FormError('Selecione uma categoria válida.');

    const unitValue = v.decimal(body.unitValue, 'O valor unitário', 9999999999.99);

    if (unitValue <= 0) throw new v.FormError('O valor unitário deve ser maior que zero (mínimo R$ 0,01).');

    const status = body.status || 'ACTIVE';

    if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new v.FormError('Selecione um status válido.');

    const producerId = body.producerId ? (await existing(Producer, body.producerId)).id : null;

    return {
        productName,
        detail,
        category: body.category,
        unitValue,
        status,
        producerId,
        ncm: v.text(body.ncm, 'o NCM', 30, true) || null
    };
}

exports.dashboard = async (req, res) => {
    const q = v.text(req.query.q, 'a busca', 200, true);
    const where = q ? {
        [Op.or]: [{
            productName: {
                [Op.like]: `%${q}%`
            }
        }, {
            detail: {
                [Op.like]: `%${q}%`
            }
        }]
    } : {};
    const products = await Product.findAll({
        where,
        include: Producer,
        order: [['createdAt', 'DESC']]
    });
    const producers = await Producer.findAll({
        order: [['name', 'ASC']]
    });

    res.render('dashboard/index', {
        title: 'Dashboard',
        products,
        producers,
        categories,
        q
    });
};

exports.createProduct = productAction(async (req, res) => {
    await Product.create(await productData(req.body));

    req.flash('success', 'Produto cadastrado.');
    res.redirect('/dashboard');
});

exports.updateProduct = productAction(async (req, res) => {
    const product = await existing(Product, req.params.id);

    await product.update(await productData(req.body));

    req.flash('success', 'Produto atualizado.');
    res.redirect('/dashboard');
});

exports.deleteProduct = productAction(async (req, res) => {
    await (await existing(Product, req.params.id)).destroy();

    req.flash('success', 'Produto excluído.');
    res.redirect('/dashboard');
});

exports.bulkDeleteProducts = productAction(async (req, res) => {
    const values = Array.isArray(req.body.productIds) ? req.body.productIds : req.body.productIds ? [req.body.productIds] : [];

    if (!values.length || values.length > 1000) throw new v.FormError('Selecione entre 1 e 1000 itens para excluir.');

    const ids = [...new Set(values.map(v.id))];

    await sequelize.transaction(async transaction => {
        const count = await Product.count({
            where: {
                id: ids
            },
            transaction
        });

        if (count !== ids.length) throw new v.FormError('Um dos itens não existe mais. Atualize a página.');

        await Product.destroy({
            where: {
                id: ids
            },
            transaction
        });
    });

    req.flash('success', 'Itens excluídos.');
    res.redirect('/dashboard');
});

exports.producers = async (req, res) => {
    const producers = await Producer.findAll({
        include: Product,
        order: [['name', 'ASC']]
    });

    res.render('dashboard/producers', {
        title: 'Fabricantes',
        producers
    });
};

exports.createProducer = producerAction(async (req, res) => {
    await Producer.create({
        name: v.text(req.body.name, 'o nome do fabricante', 160)
    });

    req.flash('success', 'Fabricante cadastrado.');
    res.redirect('/dashboard/producers');
});

exports.updateProducer = producerAction(async (req, res) => {
    const producer = await existing(Producer, req.params.id);

    await producer.update({
        name: v.text(req.body.name, 'o nome do fabricante', 160)
    });

    req.flash('success', 'Fabricante atualizado.');
    res.redirect('/dashboard/producers');
});

exports.deleteProducer = producerAction(async (req, res) => {
    await sequelize.transaction(async transaction => {
        const producer = await existing(Producer, req.params.id, {
            transaction
        });

        await Product.update({
            producerId: null
        }, {
            where: {
                producerId: producer.id
            },
            transaction
        });
        await producer.destroy({
            transaction
        });
    });

    req.flash('success', 'Fabricante excluído.');
    res.redirect('/dashboard/producers');
});

exports.budgets = async (req, res) => {
    const products = await Product.findAll({
        where: {
            status: 'ACTIVE'
        },
        include: Producer,
        order: [['productName', 'ASC']]
    });
    const budgets = await Budget.findAll({
        where: {
            userId: req.session.userId
        },
        include: BudgetItem,
        order: [['createdAt', 'DESC']]
    });

    res.render('dashboard/budgets', {
        title: 'Orçamentos',
        products,
        budgets
    });
};

exports.createBudget = budgetAction(async (req, res) => {
    const title = v.text(req.body.title, 'o título', 200, true) || 'Novo orçamento';
    let items;

    try {
        items = JSON.parse(req.body.items);
    } catch {
        throw new v.FormError('Confira os itens do orçamento.');
    }

    if (!Array.isArray(items) || !items.length || items.length > 100) throw new v.FormError('Adicione entre 1 e 100 itens ao orçamento.');

    const lines = items.map(row => {
        if (!row || typeof row !== 'object') throw new v.FormError('Item de orçamento inválido.');
        if (!['string', 'number'].includes(typeof row.quantity) || !/^\d+$/.test(String(row.quantity))) throw new v.FormError('Informe uma quantidade inteira válida.');

        const quantity = Number(row.quantity);

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) throw new v.FormError('A quantidade deve ser um número inteiro entre 1 e 1000000.');

        return {
            productId: v.id(row.productId),
            quantity,
            markup: v.decimal(row.markup ?? '0', 'A margem percentual', 999.99)
        };
    });

    await sequelize.transaction(async transaction => {
        const resolved = [];
        let totalCents = 0;

        for (const line of lines) {
            const product = await existing(Product, line.productId, {
                transaction
            });

            if (product.status !== 'ACTIVE') throw new v.FormError('O orçamento contém um produto inativo. Selecione outro item.');
            if (!Number.isFinite(Number(product.unitValue)) || Number(product.unitValue) <= 0) throw new v.FormError('O produto selecionado está sem preço válido. Solicite a atualização ao administrador.');

            const cents = Math.round(Number(product.unitValue) * 100 * line.quantity * (1 + line.markup / 100));

            totalCents += cents;

            if (!Number.isSafeInteger(totalCents) || totalCents > 999999999999) throw new v.FormError('O valor total do orçamento excede o limite permitido.');

            resolved.push({
                category: product.category,
                productId: product.id,
                productName: product.productName,
                quantity: line.quantity,
                unitValue: product.unitValue,
                markupPercentage: line.markup,
                totalValue: (cents / 100).toFixed(2)
            });
        }

        const budget = await Budget.create({
            userId: req.session.userId,
            title,
            totalValue: (totalCents / 100).toFixed(2)
        }, {
            transaction
        });

        for (const row of resolved) await BudgetItem.create({
            ...row,
            budgetId: budget.id
        }, {
            transaction
        });
    });

    req.flash('success', 'Orçamento criado.');
    res.redirect('/budgets');
});

exports.deleteBudget = budgetAction(async (req, res) => {
    const budget = await Budget.findOne({
        where: {
            id: v.id(req.params.id),
            userId: req.session.userId
        }
    });

    if (!budget) throw new v.FormError('Orçamento não encontrado.', 404);

    await budget.destroy();

    req.flash('success', 'Orçamento excluído.');
    res.redirect('/budgets');
});
