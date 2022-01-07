Object.defineProperties(globalThis ?? self ?? window, {
    Regex: {
        configurable: true,
        enumerable: true,
        value: {
            escape(value) {
                return value?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            },
        },
        writable: false,
    },
});
