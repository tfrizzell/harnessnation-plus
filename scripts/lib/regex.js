'use strict';

const Regex = {
    escape: string =>
        string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
};