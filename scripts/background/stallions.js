import '../lib/func.js';
import '../lib/regex.js';
import { getHorses } from './horses.js';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    switch (request?.action) {
        case 'CALCULATE_STUD_FEE': calculateStudFee(request.data.id, request.data.formula).then(sendResponse); break;
        case 'SEARCH_STALLIONS': createStallionSearchPattern(request.data.term).then(sendResponse); break;
        default: return;
    }

    return true;
});

function addGeneration(stallion, generation = 1) {
    stallion.generation = generation;
    return stallion;
}

async function calculateStudFee(id, formula = FORMULA_APEX) {
    const report = await fetch('https://www.harnessnation.com/api/progeny/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horseId: id })
    }).then(res => res.text());

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
        const profile = await fetch(`https://www.harnessnation.com/horse/${id}`).then(res => res.text())
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

function createStallionSearchPattern(term) {
    return new Promise(resolve => {
        chrome.storage.sync.get('stallions', async ({ stallions: settings }) => {
            if (!settings.registry.bloodlineSearch || !term?.trim())
                return resolve(term ?? '');

            const horses = await getHorses();
            const pattern = new RegExp(term.replace(/\s+/g, '\\s*'), 'i');
            const matches = horses.filter(s => pattern.test(s.name)).map(s => addGeneration(s));

            if (!matches.length)
                return resolve(term);

            for (const match of matches) {
                if (match.generation < settings.registry.maxGenerations)
                    matches.push(...horses.filter(s => s.sireId == match.id && !matches.includes(s)).map(s => addGeneration(s, match.generation + 1)));
            }

            const names = matches.map(stud => stud.name);
            resolve(`\\b(${names.map(name => name.trim()).map(Regex.escape).join('|')})\\b`);
        });
    });
}