import '../../lib/enums.js';
import '../../lib/regex.js';
import { parseCurrency } from '../../lib/func.js';
import { generateBreedingReport } from '../../lib/reporting.js';
import { getHorses } from './horses.js';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    switch (request?.action) {
        case 'CALCULATE_STUD_FEE': calculateStudFee(request.data.id, request.data.formula).then(sendResponse); break;
        case 'SEARCH_STALLIONS': createSearchPattern(request.data.term, request.data.maxGenerations).then(sendResponse); break;
        case 'STALLION_REPORT': downloadBreedingReport(request.data.ids).then(sendResponse); break;
        default: return;
    }

    return true;
});

function addGeneration(stallion, generation = 1) {
    stallion.generation = generation;
    return stallion;
}

async function calculateStudFee(id, formula = Formula.Apex) {
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
            case Formula.Apex:
            default:
                fee = (1000 * Math.round(avgEarnings / 4000)) ?? fee;
                break;

            case Formula.Ridge:
                fee = (1000 * Math.round(5 + (avgEarnings / 2000))) ?? fee;
                break;
        }
    } else {
        const profile = await fetch(`https://www.harnessnation.com/horse/${id}`).then(res => res.text())
        const data = profile?.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*(\d+)(?:\s*-\s*\d+){3}\s*\(([$\d,\.]+)\)/i)?.slice(1) ?? [0, 0];
        const starts = parseInt(data[0]);
        const earnings = parseCurrency(data[1]);

        switch (formula) {
            case Formula.Apex:
            default:
                fee = (1000 * Math.round(earnings / starts / 1000)) ?? fee;
                break;

            case Formula.Ridge:
                fee = (1000 * Math.round(5 + (earnings / 20000))) ?? fee;
                break;
        }
    }

    return Math.min(Math.max(1000, fee), 10000000);
}

async function createSearchPattern(term, maxGenerations = 4) {
    if (!term?.trim())
        return term ?? '';

    const horses = await getHorses();
    const pattern = new RegExp(term.replace(/\s+/g, '\\s*'), 'i');
    const matches = horses.filter(s => pattern.test(s.name)).map(s => addGeneration(s));

    if (!matches.length)
        return term;

    for (const match of matches) {
        if (match.generation < maxGenerations)
            matches.push(...horses.filter(s => s.sireId == match.id && !matches.includes(s)).map(s => addGeneration(s, match.generation + 1)));
    }

    return `(${[term, ...matches.map(stud => stud.name)].map(name => Regex.escape(name.trim()).replace(/\s+/g, '\\s*')).join('|')})`;
}

function downloadBreedingReport(ids) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('stallion.export', ({ 'stallion.export': exportRunning }) => {
            if (exportRunning)
                return reject('A stallion report is already running. Please wait for it to finish before starting a new one.');

            chrome.storage.local.set({ 'stallion.export': true }, async () => {
                const now = new Date();
                const dl = document.createElement('a');
                dl.setAttribute('href', await generateBreedingReport(ids, { headers: { 1: 'Stallion' } }));
                dl.setAttribute('download', `hn-plus-stallion-report-${now.getFullYear()}${[
                    now.getMonth() + 1,
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds()].map(v => v.toString().padStart(2, '0')).join('')}.csv`);
                dl.click();

                chrome.storage.local.remove('stallion.export', () => resolve());
            })
        });
    });
}