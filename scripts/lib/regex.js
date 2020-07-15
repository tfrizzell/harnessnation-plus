'use strict';

const Regex = {
    escape(value) {
        return value?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
};