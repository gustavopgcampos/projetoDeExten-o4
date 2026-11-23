class FormError extends Error {
    constructor(message, status = 400) {
        super(message);

        this.status = status;
        this.expose = true;
    }
}

function text(value, label, max, optional = false) {
    if (value == null && optional) return '';
    if (typeof value !== 'string') throw new FormError(`Informe ${label}.`);

    const result = value.trim();

    if (!optional && !result || result.length > max) throw new FormError(`Informe ${label} com até ${max} caracteres.`);

    return result;
}

function decimal(value, label, max) {
    const raw = typeof value === 'number' ? String(value) : value;

    if (typeof raw !== 'string' || !/^\d+(?:[.,]\d{1,2})?$/.test(raw.trim())) throw new FormError(`Informe ${label} como número positivo com até duas casas decimais.`);

    const number = Number(raw.trim().replace(',', '.'));

    if (!Number.isFinite(number) || number < 0 || number > max) throw new FormError(`${label} deve estar entre 0 e ${max}.`);

    return number;
}

function id(value) {
    if (typeof value !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)) throw new FormError('Identificador inválido. Atualize a página e tente novamente.');

    return value;
}

function email(value) {
    const result = text(value, 'um e-mail válido', 160).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new FormError('Informe um e-mail válido.');

    return result;
}

function password(value) {
    if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) throw new FormError('A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');

    return value;
}

module.exports = {
    FormError,
    text,
    decimal,
    id,
    email,
    password
};
