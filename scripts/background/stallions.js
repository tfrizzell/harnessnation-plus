import { Formula } from '../../lib/enums.js';
import { parseCurrency, toPercentage } from '../../lib/func.js';
import { Regex } from '../../lib/regex.js';
import { getHorses } from './horses.js';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    switch (request?.action) {
        case 'CALCULATE_STUD_FEE': calculateStudFee(request.data.id, request.data.formula).then(sendResponse); break;
        case 'EXPORT_STALLIONS': exportStallionRegistryReport(request.data.ids).then(sendResponse); break;
        case 'SEARCH_STALLIONS': createStallionSearchPattern(request.data.term, request.data.maxGenerations).then(sendResponse); break;
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

async function createStallionSearchPattern(term, maxGenerations = 4) {
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

    const names = matches.map(stud => stud.name);
    return `\\b(${names.map(name => name.trim()).map(Regex.escape).join('|')})\\b`;
}

async function exportStallionRegistryReport(ids) {
    return [
        ['ID', 'Stallion', 'Age', 'Gait', 'Track Size', 'Grade', 'Sire', 'Dam', 'Dam-Sire', 'Race Record', 'Stake Record', 'Total Foals', 'Total Starters', 'Total Starters (%)', 'Total Winners', 'Total Winners (%)', 'Total Earnings', 'Avg Earnings Per Starter', 'Stake Starters', 'Stake Starters (%)', 'Stake Winners', 'Stake Winners (%)', 'Stake Starts', 'Stake Wins', 'Stake Place', 'Stake Show'],
        ...await Promise.all(ids.map(async id => {
            const [
                profile,
                report
            ] = await Promise.all([
                fetch(`https://www.harnessnation.com/horse/${id}`).then(res => res.text()),
                fetch('https://www.harnessnation.com/api/progeny/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ horseId: id })
                }).then(res => res.text()),
            ]);

            if (!profile.match(/<b[^>]*>\s*Gender\s*:\s*<\/b[^>]*>\s*Stallion/i))
                return;

            const totalFoals = parseInt(report.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim() ?? 0);
            const totalStarters = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim() ?? 0);
            const totalWinners = parseInt(report.match(/<b[^>]*>\s*Total\s+Winners\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim() ?? 0);
            const stakeStarters = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim() ?? 0);
            const stakeWinners = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim() ?? 0);

            return [
                +id,
                profile.match(/<h1[^>]*>(.*?)<\/h1[^>]*>/is)[1],
                profile.match(/<b[^>]*>\s*Age\s*:\s*<\/b[^>]*>\s*(\d+)/is)[1].trim(),
                profile.match(/<small[^>]*>\s*Trotting\s+on\s+/is) ? 'Trot' : 'Pace',
                profile.match(/on\s+\S+\s+half-mile\s+tracks/is) ? 'Half Mile' : 'Full Mile',
                profile.match(/<span[^>]*grade-horse-page[^>]*>(.*?)<\/span[^>]*>/is)?.[1]?.trim(),
                profile.match(/<b[^>]*>\s*Sire\s*:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a[^>]*>/is)?.[1]?.trim() ?? 'Unknown',
                profile.match(/<b[^>]*>\s*Dam\s*:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a[^>]*>/is)?.[1]?.trim() ?? 'Unknown',
                profile.match(/<b[^>]*>\s*Dam-Sire\s*:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a[^>]*>/is)?.[1]?.trim() ?? 'Unknown',
                profile.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*(.*?)<br[^>]*>/is)?.[1]?.trim(),
                profile.match(/<b[^>]*>\s*Stake\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*(.*?)<br[^>]*>/is)?.[1]?.trim(),
                totalFoals,
                totalStarters,
                toPercentage(totalStarters, totalFoals),
                totalWinners,
                toPercentage(totalWinners, totalStarters),
                report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*(\$[\d,]+)/is)?.[1]?.trim() ?? '$0',
                report.match(/<b[^>]*>\s*Average\s+Earnings\s+per\s+Starter\s*:\s*<\/b[^>]*>\s*(\$[\d,]+)/is)?.[1]?.trim() ?? '$0',
                stakeStarters,
                toPercentage(stakeStarters, totalStarters),
                stakeWinners,
                toPercentage(stakeWinners, totalStarters),
                ...(report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/is)?.slice(1) ?? [0, 0, 0, 0]),
            ];
        })),
    ].filter(row => Array.isArray(row)).map(row => row.map(col => `"${(col?.toString() ?? '').replace('"', '\\"')}"`).join(',')).join('\n');
}