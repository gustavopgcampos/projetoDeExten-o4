const assert = require('node:assert/strict');

function xpathText(value) {
    assert.ok(!value.includes("'"));

    return "'" + value + "'";
}

function rowXPath(value) {
    // Product rows start with a checkbox cell, unlike user/producer rows.
    // Locate an exact cell value instead of assuming a fixed column number.
    return `//tbody/tr[td[normalize-space(.)=${xpathText(value)}]]`;
}

module.exports = { xpathText, rowXPath };
