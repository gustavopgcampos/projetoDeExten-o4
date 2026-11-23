const products = JSON.parse(document.getElementById('budget-products').textContent);
const budgetItems = [];
const money = value => value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});
const labels = products.map(product => `${product.name} — ${product.category}`);

products.forEach((product, index) => {
    product.label = labels.filter(label => label === labels[index]).length > 1 ? `${labels[index]} — ${product.id}` : labels[index];
});

const options = document.createElement('datalist');

options.id = 'budget-product-options';

products.forEach(product => {
    const option = document.createElement('option');

    option.value = product.label;
    option.label = money(product.value);

    options.appendChild(option);
});

document.body.appendChild(options);

function addBudgetItem() {
    const line = {
        productId: '',
        quantity: 1,
        markup: 0
    };

    budgetItems.push(line);

    const row = document.createElement('div');

    row.className = 'grid gap-3 border-b border-zinc-200 px-4 py-4 md:grid-cols-[minmax(220px,1fr)_90px_120px_120px]';

    const input = document.createElement('input');

    input.type = 'text';
    input.required = true;

    input.setAttribute('list', options.id);
    input.setAttribute('aria-label', 'Pesquisar produto');

    input.placeholder = 'Digite para pesquisar e selecione o produto';
    input.autocomplete = 'off';
    input.className = 'w-full min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#EE4136]';

    const quantity = document.createElement('input');

    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = '1000000';
    quantity.step = '1';
    quantity.value = '1';
    quantity.required = true;

    quantity.setAttribute('aria-label', 'Quantidade');

    const markup = document.createElement('input');

    markup.type = 'number';
    markup.min = '0';
    markup.max = '999.99';
    markup.step = '0.01';
    markup.value = '0';
    markup.required = true;

    markup.setAttribute('aria-label', 'Margem percentual');

    for (const field of [quantity, markup]) field.className = 'w-full rounded-md border border-zinc-300 px-3 py-2 text-sm';

    const total = document.createElement('span');

    total.className = 'py-2 text-sm text-zinc-500';

    total.setAttribute('aria-live', 'polite');

    function update() {
        const product = products.find(product => product.label === input.value);

        line.productId = product?.id || '';
        line.quantity = quantity.value;
        line.markup = markup.value;

        input.setCustomValidity(product ? '' : 'Selecione um produto cadastrado nas sugestões.');

        const value = product ? product.value * Number(quantity.value) * (1 + Number(markup.value) / 100) : 0;

        total.textContent = money(Number.isFinite(value) ? value : 0);
    }

    for (const field of [input, quantity, markup]) field.addEventListener('input', update);

    input.addEventListener('change', update);

    for (const [title, field] of [['Produto', input], ['Quantidade', quantity], ['Margem (%)', markup], ['Total do item', total]]) {
        const wrapper = document.createElement(field === total ? 'div' : 'label');

        wrapper.className = 'flex min-w-0 flex-col gap-2';

        const caption = document.createElement('span');

        caption.className = 'text-xs font-medium text-zinc-600';
        caption.textContent = title;

        wrapper.append(caption, field);

        row.appendChild(wrapper);
    }

    markup.title = 'Acréscimo percentual sobre o preço do produto. Ex.: 10 significa 10%.';

    document.getElementById('budget-items').appendChild(row);

    update();

    input.focus();
}

function prepareBudget(form) {
    if (!budgetItems.length) {
        alert('Adicione ao menos um item ao orçamento.');

        return false;
    }
    if (!form.reportValidity()) return false;

    document.getElementById('items-json').value = JSON.stringify(budgetItems);

    return true;
}
