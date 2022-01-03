async function calculateStudFee(id, formula = FORMULA_APEX) {
    const report = await (await fetch('/api/progeny/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horseId: id })
    })).text();

    const noStarters = parseInt(report?.match(/<b[^>]*>\s*Total\s*Starters\s*:\s*<\/b[^>]*>\s*(\d+)/i)?.pop() ?? 0);
    let fee = 2500;

    if (noStarters > 0) {
        const avgEarnings = parseCurrency(report?.match(/<b[^>]*>\s*Average\s*Earnings\s*per\s*Starter\s*:\s*<\/b[^>]*>\s*([$\d,\.]+)/i)?.pop() ?? 0);

        switch (formula) {
            case FORMULA_APEX:
            default:
                fee = (1000 * Math.round(avgEarnings / 4000)) ?? fee;
                break;

            case FORMULA_RIDGE:
                fee = (1000 * Math.round(5 + (avgEarnings / 2000))) ?? fee;
                break;
        }
    } else {
        const profile = await (await fetch(`/horse/${id}`)).text();
        const data = profile?.match(/<b[^>]*>\s*Lifetime\s*Race\s*Record\s*<\/b[^>]*>\s*<br[^>]*>\s*(\d+)(?:\s*-\s*\d+){3}\s*\(([$\d,\.]+)\)/i)?.slice(1) ?? [0, 0];
        const starts = parseInt(data[0]);
        const earnings = parseCurrency(data[1]);

        switch (formula) {
            case FORMULA_APEX:
            default:
                fee = (1000 * Math.round(earnings / starts / 1000)) ?? fee;
                break;

            case FORMULA_RIDGE:
                fee = (1000 * Math.round(5 + (earnings / 20000))) ?? fee;
                break;
        }
    }

    return Math.min(Math.max(1000, fee), 10000000);
}

document.querySelectorAll('#inputStudFee, #inputStudFeeUpdate').forEach(input => {
    const button = document.createElement('i');
    button.classList.add('plus-calculate-button');
    button.textContent = 'calculate';

    input.classList.add('plus-calculate-input');
    input.parentNode.appendChild(button);

    let calculating = false;

    button.addEventListener('click', () => {
        if (calculating) {
            return;
        }

        chrome.storage.sync.get('stallions', async ({ stallions }) => {
            input.classList.add('plus-calculating');
            calculating = true;

            try {
                input.value = '';
                input.value = await calculateStudFee(input.form.elements.horse.value, stalions?.management?.formula);
            } finally {
                calculating = false;
                input.classList.remove('plus-calculating');
            }
        });
    });
});

window.addEventListener('plus:installed', function handleInstalled() {
    window.removeEventListener('plus:installed', handleInstalled);
    document.querySelectorAll('.plus-calculate-button').forEach(el => el.remove());
    document.querySelectorAll('.plus-calculate-input').forEach(el => el.classList.remove('plus-calculate-input', 'plus-calculating'));
});