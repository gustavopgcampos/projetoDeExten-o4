const { Product, Producer } = require('../models');
exports.home = async (req, res) => { const products = await Product.findAll({ where: { status: 'ACTIVE' }, include: Producer, order: [['createdAt', 'DESC']], limit: 8 }); res.render('home', { title: 'MMVL Telecon', products }); };
