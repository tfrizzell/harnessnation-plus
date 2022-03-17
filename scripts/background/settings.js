(async () => {
    const defaultSettings = await fetch(chrome.runtime.getURL('/data/settings.json')).then(res => res.json());

    function isArray(obj) {
        return Array.isArray(obj);
    }

    function isObject(obj) {
        return typeof obj === 'object' && !isArray(obj);
    }

    function merge(obj1, obj2) {
        if (obj1 === obj2) {
            return obj1;
        }

        if (isArray(obj1)) {
            if (isArray(obj2))
                return [...obj1, ...obj2];
            else
                return [...obj1, obj2];
        } else if (isObject(obj1) && isObject(obj2)) {
            return {
                ...obj1,
                ...Object.entries(obj2).reduce((obj, [key, value]) => ({ ...obj, [key]: merge(obj1[key], value) }), {})
            };
        } else {
            return obj2;
        }
    }

    chrome.storage.onChanged.addListener(() => {
        chrome.storage.sync.get(async data => {
            chrome.storage.sync.set(merge(defaultSettings, data));
        });
    });
})();