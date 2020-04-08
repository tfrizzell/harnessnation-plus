const Regex = {
    escape: string =>
        string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
};