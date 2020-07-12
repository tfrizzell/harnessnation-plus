'use strict';

function parseCurrency(earnings) {
    return parseFloat(earnings?.toString?.().replace(/[^\d.]+/g, ''));
}