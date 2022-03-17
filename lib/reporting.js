import { toPercentage } from './func.js';

export async function generateBreedingReport(ids, { headers = {} } = {}) {
    const csv = [
        ['ID', 'Name', 'Age', 'Gait', 'Track Size', 'Grade', 'Sire', 'Dam', 'Dam-Sire', 'Race Record', 'Stake Record', 'Total Foals', 'Total Starters', 'Total Starters (%)', 'Total Winners', 'Total Winners (%)', 'Total Earnings', 'Avg Earnings Per Starter', 'Stake Starters', 'Stake Starters (%)', 'Stake Winners', 'Stake Winners (%)', 'Stake Starts', 'Stake Wins', 'Stake Place', 'Stake Show', 'Stake Earnings']
            .map((v, i) => headers[i] ?? v),
    ];

    let batch;

    while ((batch = ids.slice(csv.length - 1, csv.length + 9)) && batch.length > 0) {
        csv.push(...
            await Promise.all(batch.map(async id => {
                const profile = await fetch(`https://www.harnessnation.com/horse/${id}`).then(res => res.text());

                const report = await fetch('https://www.harnessnation.com/api/progeny/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ horseId: id })
                }).then(res => res.text());

                const totalFoals = parseInt(profile.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim() ?? 0);
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
                    ...(report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*\((\$[\d,]+)\)/is)?.slice(1) ?? [0, 0, 0, 0, '$0']),
                ];
            })),
        );

        if (csv.length < ids.length + 1)
            await new Promise(resolve => setTimeout(resolve, 30000));
    }

    return `data:text/csv;base64,${btoa(csv.filter(row => Array.isArray(row)).map(row => row.map(col => `"${(col?.toString() ?? '').replace('"', '\\"')}"`).join(',')).join('\n').replace(/&#039;/g, '\''))}`;
}