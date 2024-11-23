import './pdf-lib/pdf-lib.min.js';
import './pdf-lib/fontkit.umd.min.js';
import { PDFDocument, PDFFont } from 'pdf-lib/ts3.4/es';

import { PDFParagraphBuilder } from './pdf-lib/builder.js';
import { drawTextCentered } from './pdf-lib/utils.js';

import { api } from './harnessnation.js'
import { getHorse, getRaces, Horse, Race, RaceList } from './horses.js';
import { ageToText, downloadFile, formatMark, formatOrdinal, getLifetimeMark, isMobileOS, parseCurrency, parseInt, secondsToTime, toTimestamp } from './utils.js';

type Ancestor = {
    id?: number;
    name: string | 'Unknown';
    sireId?: number;
    damId?: number;
    lifetimeMark?: string;
    progeny?: Progeny[];
    races?: RaceList;
}

type DamLineAncestor = Ancestor & {
    id: number;
    progeny: Progeny[];
    races: RaceList;
}

type FontMap = {
    Normal: PDFFont;
    Bold: PDFFont;
    BoldItalic: PDFFont;
    Italic: PDFFont;
    [key: string]: PDFFont;
}

class ParagraphBuilder extends PDFParagraphBuilder {
    #priority: ParagraphPriority;

    constructor(priority: ParagraphPriority, font: PDFFont, size: number = 8.5, maxWidth: number = window.PDFLib.PageSizes.Letter[0], indent?: number, firstLineIndent?: number) {
        super(font, size, maxWidth, indent, firstLineIndent);
        this.#priority = priority;
    }

    get priority(): ParagraphPriority {
        return this.#priority;
    }
}

enum ParagraphPriority {
    VeryLow,
    Low,
    Medium,
    High,
    VeryHigh,
    Required
}

type Progeny = {
    id: number;
    name: string;
    sireId: number;
    sireName: string;
    age: number;
    gender: 'H' | 'M' | 'G';
    wins: number;
    earnings: number;
    overallAwardWinner: boolean;
    conferenceAwardWinner: boolean;
    races?: RaceList;
}

const earningsFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

/**
 * Adds a sale catalog style pedigree page to the pdf document.
 * @param {PDFDocument} pdfDoc - the pdf document to add the page to.
 * @param {Horse} horse - the horse the page is being generated for.
 * @param {token} csrfToken - the CSRF token to sign requests.
 * @param {FontMap} fonts - the map of fonts to use in the pdf page.
 * @param {number} generations - the number of generations to go to in the pedigree.
 * @returns {Promise<void>} A `Promise` that resolves when the page has been added.
 */
async function addPedigreePage(pdfDoc: PDFDocument, horse: Horse, csrfToken?: string, fonts?: FontMap, generations: number = 3): Promise<void> {
    function showDamInfo(index: number): boolean {
        return (Math.log2(index + 3) - 1) % 1 === 0;
    }

    fonts ??= await loadFonts(pdfDoc);

    const page = pdfDoc.addPage(window.PDFLib.PageSizes.Letter);
    const margin = { top: 32.5, right: 96.5, bottom: 27.1, left: 96.5 };
    page.moveTo(margin.left, page.getHeight() - margin.top);

    const info = await api.getHorse(horse.id!);
    csrfToken ??= await api.getCSRFToken();

    const [races, pedigree] = await Promise.all([
        getRaces(horse.id!, csrfToken),
        getPedigree(horse.id!, csrfToken),
    ]);

    const nameLookup = new Map(pedigree.filter(({ id }) => id).map(({ id, name }) => [id, name]));
    const damIds: (number | undefined)[] = [];

    for (let i = 0; i < 2 ** (generations + 1) - 2; i += 2) {
        await Promise.all(Array(2).fill(0).map(async (_, j) => {
            const ancestor = (pedigree[i + j] ??= { name: 'Undefined' });

            if (ancestor?.id == null)
                return;

            const races = await getRaces(ancestor.id, csrfToken);
            ancestor.lifetimeMark = getLifetimeMark(races);

            if (showDamInfo(i + j)) {
                ancestor.sireId = pedigree[2 * (i + j + 1)]?.id;
                ancestor.progeny = await getDamProgeny(ancestor.id, csrfToken);
                ancestor.races = races;
                damIds.push(ancestor.id);
            }
        }));
    }

    const DEFAULT_FONT = fonts.Normal;
    page.setFont(DEFAULT_FONT);

    const DEFAULT_FONT_COLOR = window.PDFLib.rgb(0, 0, 0);
    page.setFontColor(DEFAULT_FONT_COLOR);

    const DEFAULT_FONT_SIZE = 8.5;
    page.setFontSize(DEFAULT_FONT_SIZE);

    // Consignor Name
    page.moveDown(fonts.Normal.heightAtSize(8.5));
    const owner = info.match(/<b[^>]*>\s*Owner:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a>/i)?.[1]?.trim();

    if (owner)
        drawTextCentered(page, `Consigned by ${owner.toUpperCase()}`, { font: fonts.Normal, size: 8.5 });

    // Horse Name
    page.moveDown(fonts.Bold.heightAtSize(16) + 2);
    drawTextCentered(page, horse.name!.toUpperCase(), { font: fonts.Bold, size: 16 });

    // Racing Statistics
    const fastestWin = races.findFastestWin();
    const lifetimeMark = getLifetimeMark(races);
    const age = parseInt(info.match(/<b[^>]*>\s*Age:\s*<\/b[^>]*>\s*(\d+)/i)?.[1] ?? 0);

    if (lifetimeMark || age) {
        page.moveDown(fonts.Normal.heightAtSize(10) + 1);

        drawTextCentered(page,
            `${lifetimeMark}${fastestWin ? `-'${fastestWin.date!.getFullYear() % 100}` : ''} ${age > 0 ? `(${ageToText(age)} Year Old)` : ''}`.trim(),
            { font: fonts.Normal, size: 10 }
        );
    }

    // Horse Info
    page.moveDown(fonts.Bold.heightAtSize(8.5) + 1);

    const color = info.match(/<b[^>]*>\s*Coat Color:\s*<\/b[^>]*>\s*(.*?)\s*<br[^>]*>/i)?.[1]?.trim()?.toUpperCase();
    const gender = info.match(/<b[^>]*>\s*Gender:\s*<\/b[^>]*>\s*(\S+)/i)?.[1]?.trim()?.toUpperCase();
    const foaledDate = info.match(/Foaled: (\w+ \d+[A-Z]{2}, \d{4})/i)?.[1]?.trim()?.replace(/(\d)[A-Z]{2}/i, '$1');

    drawTextCentered(page,
        `${color ?? ''} ${gender ?? ''} ${foaledDate ? `Foaled ${foaledDate}` : ''}`.trim().replace(/ +/g, ' '),
        { font: fonts.Bold, size: 8.5 })
        ;

    // Horse ID
    page.moveDown(fonts.Bold.heightAtSize(8.5) + 0.5);
    drawTextCentered(page, `Horse ID. ${horse.id}`, { font: fonts.Bold, size: 8.5 });

    // Pedigree
    page.moveTo(margin.left + 2.4, 603);

    page.drawText(`${horse.name!.toUpperCase()} ${lifetimeMark}`.trim(), {
        font: fonts.Bold,
        size: 7,
    });

    page.moveRight(14.5);

    const centreRowHeight = fonts.Bold.heightAtSize(7) * 1.703297;
    const rowHeight = fonts.Normal.heightAtSize(7) * 1.703297;
    let column = 0, row = 0;

    const damInfo: ParagraphBuilder[] = [];
    let paragraph: ParagraphBuilder;

    const maxWidth = page.getWidth() - margin.right - margin.left;
    const indent = 28.4;

    for (let i = 0; i < 2 ** (generations + 1) - 2; i++) {
        const ancestor = pedigree[i];
        const rows = 2 ** (column + 1);
        const rowSpan = 2 ** generations / rows;
        const offsetRow = Math.round(((rows - 1) / 2) - row);
        const offsetY = (2 * offsetRow - 1) * rowSpan * rowHeight / 2 + (offsetRow > 0 ? 1 : -1) * (centreRowHeight / 2 + 3.5);
        const columnWidth = (maxWidth / 3) - (column === 0 ? 14.5 : 0);

        let text = `${ancestor.name ?? ''} ${ancestor.lifetimeMark ?? ''}`?.trim() || 'Unknown';

        while (column < 2 && fonts.Normal.widthOfTextAtSize(text, 7) < columnWidth) {
            if (text.endsWith('-') || text.endsWith('  '))
                text += '-';
            else
                text += ' ';
        }

        page.drawText(text, {
            y: page.getY() + offsetY,
            font: fonts.Normal,
            size: 7,
        });

        if (showDamInfo(i)) {
            column++;
            row = 0;
            page.moveRight(columnWidth + 6);
        } else
            row++;

        if (!damIds.includes(ancestor.id))
            continue;

        // Dam Info
        const dam = ancestor as DamLineAncestor;
        const ageRef = dam.races.findAgeRef();
        const ageStart = dam.races.findAge(dam.races.slice(-1)[0], ageRef);
        const ageEnd = dam.races.findAge(dam.races[0], ageRef);
        const wins = dam.races.getWins();
        let winningProgeny = 0;

        for (let j = 0; j < dam.progeny.length; j += 2) {
            await Promise.all(Array(2).fill(0).map(async (_, k) => {
                const progeny = dam.progeny[j + k];

                if (progeny?.id == null)
                    return;

                progeny.races = await getRaces(progeny.id, csrfToken);
                progeny.earnings = progeny.races.getEarnings();

                if (races.some(race => race.finish === 1))
                    winningProgeny++;
            }));
        }

        dam.progeny.sort(sortProgeny);

        damInfo.push(paragraph = new ParagraphBuilder(ParagraphPriority.Required, fonts.Bold, 8.5, maxWidth, indent));
        paragraph.add(`${formatOrdinal(damIds.indexOf(dam.id) + 1)} Dam`)

        damInfo.push(paragraph = new ParagraphBuilder(ParagraphPriority.Required, fonts.Normal, 8.5, maxWidth, indent));

        paragraph.add(
            dam.races.some(r => r.stake && r.finish === 1) ? dam.name.toUpperCase() : dam.name,
            (dam.races.some(r => r.stake && r.finish! <= 3) ? fonts.Bold : fonts.Normal)
        );

        paragraph.add(` ${getMarkString(dam.races, ageRef)}`.replace(/^\s+$/, ''));

        if (nameLookup.has(dam.sireId))
            paragraph.add(` by ${nameLookup.get(dam.sireId)}.`);
        else
            paragraph.add('.');

        if (wins > 0) {
            let text = `${wins} wins`;

            if (ageStart && ageEnd) {
                if (ageStart !== ageEnd)
                    text += `, ${ageStart} ${ageEnd! - ageStart! > 1 ? 'thru' : 'and'} ${ageEnd}`;
                else
                    text += `, at ${ageStart}`;
            }

            paragraph.add(` ${text}.`);
        }

        if (/trophyhorse\.png/i.test(info))
            paragraph.add(' Overall Award Winner.', fonts.Bold);
        else if (/trophyhorse_silver\.png/i.test(info))
            paragraph.add(' Conference Award Winner.', fonts.Bold);

        paragraph.add(` ${getKeyRaceString(dam.races, ageRef)}`.replace(/^\s+$/, ''));

        if (dam.progeny.length > 0)
            paragraph.add(` From ${dam.progeny.length} foals, dam of ${winningProgeny} winners including:`
                .replace(/From (\d+) foals, dam of 0 winners /, 'Dam of $1 foals, '));

        for (let j = 0; j < dam.progeny.length; j++) {
            const progeny = dam.progeny[j];
            const ageRef = progeny.races!.findAgeRef();
            const ageStart = progeny.races!.findAge(progeny.races!.slice(-1)[0], ageRef);
            const ageEnd = progeny.races!.findAge(progeny.races![0], ageRef);
            const wins = progeny.races!.getWins();
            const earningsPerStart = progeny.races?.length ?? 0 > 0
                ? progeny.earnings / progeny.races!.length
                : 0;

            damInfo.push(paragraph = new ParagraphBuilder(
                j === 0 || (age > 1 && progeny.id === horse.id)
                    ? ParagraphPriority.Required
                    : progeny.races!.some(race => race.stake && race.finish === 1)
                        ? ParagraphPriority.VeryHigh
                        : progeny.races!.some(race => isKeyRace(race))
                            ? ParagraphPriority.High
                            : progeny.earnings >= 500_000 || earningsPerStart >= 20_000
                                ? ParagraphPriority.Medium
                                : progeny.age < 4 || progeny.earnings >= 250_000 || earningsPerStart >= 15_000
                                    ? ParagraphPriority.Low
                                    : ParagraphPriority.VeryLow,
                fonts.Normal,
                8.5,
                maxWidth,
                indent,
                14
            ));

            paragraph.add(
                progeny.races!.some(r => r.stake && r.finish === 1) ? progeny.name.toUpperCase() : progeny.name,
                (progeny.races!.some(r => r.stake && r.finish! <= 3) ? fonts.Bold : fonts.Normal)
            );

            if (progeny.gender === 'M')
                paragraph.add(` (${progeny.gender})`);

            paragraph.add(` ${getMarkString(progeny.races!, ageRef)} (${progeny.sireName}).`.replace(/^\s+(\(.*?\))$/, '$1'));

            if (!damIds.includes(progeny.id)) {
                if (wins > 0) {
                    let text = `${wins} wins`;

                    if (ageStart && ageEnd) {
                        if (ageStart !== ageEnd)
                            text += `, ${ageStart} ${ageEnd! - ageStart! > 1 ? 'thru' : 'and'} ${ageEnd}`;
                        else
                            text += `, at ${ageStart}`;
                    }

                    paragraph.add(` ${text}.`);
                }

                if (progeny.overallAwardWinner)
                    paragraph.add(' Overall Award Winner.', fonts.Bold);
                else if (progeny.conferenceAwardWinner)
                    paragraph.add(' Conference Award Winner.', fonts.Bold);

                paragraph.add(` ${getKeyRaceString(progeny.races!, ageRef)}`.replace(/^\s+$/, ''));

                if (progeny.age < 4)
                    paragraph.add(` Now ${progeny.age}.`);
            } else
                paragraph.add(' As above.');
        }
    }

    page.moveTo(margin.left, 510);
    let totalHeight = damInfo.reduce((total, paragraph) => total + paragraph.getHeight(), 0);

    while (page.getY() - totalHeight < margin.bottom) {
        const lowestPriority = Math.min(...damInfo.map(paragraph => paragraph.priority));

        for (let i = damInfo.length - 1; i >= 0; i--) {
            const paragraph = damInfo[i];

            if (damInfo[i].priority === lowestPriority) {
                damInfo.splice(i, 1);
                totalHeight -= paragraph.getHeight();
                break;
            }
        }
    }

    for (const paragraph of damInfo) {
        paragraph.write(page);
        page.moveDown(paragraph.getHeight());
    }
}

/**
 * Generates a sale catalog for the given horses.
 * @param {number[]} ids - the ids of the horses.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function generatePedigreeCatalog(ids: number[]): Promise<void> {
    if (await isMobileOS()) {
        console.debug(`%cpedigree.ts%c     Mobile OS Detected: skipping pedigree catalog generation`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    if (ids.length === 1)
        return await generatePedigreePage(ids[0]);

    const horses: Horse[] = [];
    let csrfToken: string | undefined;

    for (const id of ids) {
        const horse = await getHorse(id);
        csrfToken ??= await api.getCSRFToken();

        if (horse.id !== id || csrfToken == null)
            throw new ReferenceError(`Failed to generate sale catalog: could not parse info for horse ${id}`);

        horses.push(horse);
    }

    const pdfDoc = await window.PDFLib.PDFDocument.create();
    const fonts = await loadFonts(pdfDoc);

    while (horses.length > 0)
        await Promise.all(horses.splice(0, 2).map(horse => addPedigreePage(pdfDoc, horse, csrfToken, fonts)));

    await downloadFile(await pdfDoc.saveAsBase64({ dataUri: true }), `hnplus-pedigree-catalog-${toTimestamp().replace(/\D/g, '')}.pdf`);
}

/**
 * Generates a sale catalog style pedigree page for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function generatePedigreePage(id: number): Promise<void> {
    if (await isMobileOS()) {
        console.debug(`%cpedigree.ts%c     Mobile OS Detected: skipping pedigree page generation`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    const horse = await getHorse(id);
    const csrfToken = await api.getCSRFToken();

    if (horse.id !== id || csrfToken == null)
        throw new ReferenceError(`Failed to generate sale catalog: could not parse info for horse ${id}`);

    const pdfDoc = await window.PDFLib.PDFDocument.create();
    await addPedigreePage(pdfDoc, horse, csrfToken);
    await downloadFile(await pdfDoc.saveAsBase64({ dataUri: true }), `${horse.name}.pdf`);
}

async function getDamProgeny(id: number, csrfToken?: string): Promise<Progeny[]> {
    return Array.from(
        (await api.getProgenyList(id, csrfToken))
            .matchAll(/<td[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*><span[^>]*>(.*?)<\/span[^>]*><\/a[^>]*>.*?<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td[^>]*>\s*<td[^>]*>\s*<i[^>]*fa-(mars|venus|neuter)[^>]*>\s*<\/i[*>]*>\s*<\/td[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*\d+&nbsp;-&nbsp;(\d+)&nbsp;-&nbsp;\d+&nbsp;-&nbsp;\d+\s*<\/td[^>]*>\s*<td[^>]*>\s*(\$[\d,]+)?\s*<\/td[^>]*>/gis)
    ).map(([match, id, name, sireId, sireName, age, gender, wins, earnings]): Progeny => ({
        id: parseInt(id),
        name: name.trim(),
        sireId: parseInt(sireId),
        sireName: sireName.trim(),
        age: parseInt(age),
        gender: gender.toLowerCase() === 'mars'
            ? 'H'
            : gender.toLowerCase() === 'venus'
                ? 'M'
                : 'G',
        wins: parseInt(wins),
        earnings: parseCurrency(earnings),
        overallAwardWinner: /trophyhorse\.png/i.test(match),
        conferenceAwardWinner: /trophyhorse_silver\.png/i.test(match),
    })).sort(sortProgeny);
}

function getKeyRaces(races: RaceList, ageRef?: Race): RaceList {
    ageRef ??= races.findAgeRef();

    return races
        .filter(race => isKeyRace(race))
        .sort((a, b) => (+b.stake! - +a.stake!) || (a.finish! - b.finish!) || (+b.purse! - a.purse!));
}

function getKeyRaceString(races: RaceList, ageRef?: Race): string {
    const output: string[] = [];
    ageRef ??= races.findAgeRef();

    const filteredRacesByAge = Map.groupBy(
        getKeyRaces(races, ageRef),
        race => races.findAge(race, ageRef)
    );

    function getFinishText(finish: number): string {
        switch (finish) {
            case 1: return 'winner of';
            case 2: return 'second in';
            case 3: return 'third in';
            default: return '';
        }
    }

    for (let [age, races] of Array.from(filteredRacesByAge.entries()).sort(([ageA], [ageB]) => (ageA ?? 99) - (ageB ?? 99))) {
        const buffer: string[] = [];
        let race: Race | undefined;

        while (race = races[0]) {
            const raceGroup = races.filter(r => r.name?.replace('Maiden ', '') === race!.name?.replace('Maiden ', ''));

            if (race.stake) {
                buffer.push(
                    raceGroup.map(r => `${getFinishText(r.finish!).replace('of', 'in')} ${r.elim ? 'elim' : 'final'} of ${r.name}`)
                        .join(' and ')
                        .trim()
                        .replace(/^(\S+) (in .*? and) \1/, '$1 $2')
                        .replace(` of ${race.name} and `, ' and ')
                        .replace(' and in ', ' and '));
            } else if (raceGroup.length > 1)
                buffer.push(`${getFinishText(race.finish!)} ${race!.name!.replace('Maiden ', '')} (x${raceGroup.length})`.trim());
            else
                buffer.push(`${getFinishText(race.finish!)} ${race!.name!.replace('Maiden ', '')}`.trim());

            races = races.filter(r => !raceGroup.includes(r));
        }

        output.push(`At ${age}, ${buffer.join('; ')}.`);
    }

    return output.join(' ').trim();
}

function getMarkString(races: RaceList, ageRef?: Race): string {
    ageRef ??= races.findAgeRef();
    const fastestWin = races.findFastestWin();
    const fastestWinAtTwo = races.findFastestWin(race => races.findAge(race, ageRef) === 2);
    const fastestWinAtThree = races.findFastestWin(race => races.findAge(race, ageRef) === 3);
    const fastestRace = races.findFastestRace();
    const [starts, earnings] = races.getSummary().filter((_value, index, array) => index === 0 || index === array.length - 1);

    return [
        [
            formatMark(fastestWinAtTwo, 2),
            formatMark(fastestWinAtThree, 3),
            !fastestWin || fastestWin == fastestWinAtTwo || fastestWin == fastestWinAtThree ? null : formatMark(fastestWin, races.findAge(fastestWin, ageRef)),
            !fastestRace || fastestRace?.finish === 1 ? null : `BT${secondsToTime(fastestRace.time!)}`,
        ].filter(mark => mark?.trim()).join('; ').trim()
            .replace(new RegExp(`${fastestWinAtTwo?.gait?.charAt(0)?.toLowerCase() ?? ' '},([^2],)`, 'ig'), '$1')
            .replace(new RegExp(`${fastestWinAtThree?.gait?.charAt(0)?.toLowerCase() ?? ' '},([^23],)`, 'ig'), '$1'),
        starts < 1 ? null : `(${earningsFormatter.format(earnings)})`,
    ].filter(part => part?.trim()).join(' ');
}

async function getPedigree(id: number, csrfToken?: string): Promise<Ancestor[]> {
    return Array.from(
        (await api.getPedigree(id, csrfToken))
            .matchAll(/<a[^>]*horse\/(\d+)[^>]*>\s*(.*?)\s*<\/a[^>]*>|\b(Unknown)\b/gis)
    ).map((match: RegExpMatchArray): Ancestor => ({
        id: match[1] ? parseInt(match[1]!) : undefined,
        name: match[2] ?? match[3],
    }));
}

function isKeyRace(race: Race, includeOpen: boolean = false, includePreferred: boolean = false): boolean {
    return (race.finish! <= 3 && race.stake)
        || (includeOpen && race.finish === 1 && /^(Maiden )?Open$/i.test(race.name ?? ''))
        || (includePreferred && race.finish === 1 && /^(Maiden )?(Open|Preferred)$/i.test(race.name ?? ''));
}

async function loadFonts(pdfDoc: PDFDocument): Promise<FontMap> {
    pdfDoc.registerFontkit(window.fontkit);

    return await Promise.all([
        fetch(chrome.runtime.getURL('/lib/pdf-lib/fonts/arial.ttf')).then(res => res.arrayBuffer()).then(font => pdfDoc!.embedFont(font, { subset: true })),
        fetch(chrome.runtime.getURL('/lib/pdf-lib/fonts/arialbd.ttf')).then(res => res.arrayBuffer()).then(font => pdfDoc!.embedFont(font, { subset: true })),
        fetch(chrome.runtime.getURL('/lib/pdf-lib/fonts/arialbi.ttf')).then(res => res.arrayBuffer()).then(font => pdfDoc!.embedFont(font, { subset: true })),
        fetch(chrome.runtime.getURL('/lib/pdf-lib/fonts/ariali.ttf')).then(res => res.arrayBuffer()).then(font => pdfDoc!.embedFont(font, { subset: true })),
    ]).then(([Arial, ArialBold, ArialBoldItalic, ArialItalic]): FontMap => ({
        Normal: Arial,
        Bold: ArialBold,
        BoldItalic: ArialBoldItalic,
        Italic: ArialItalic,
        Arial,
        ArialBold,
        ArialBoldItalic,
        ArialItalic,
    }));
}

function sortProgeny(a: Progeny, b: Progeny): number {
    return (b.earnings - a.earnings) || (b.age - a.age) || (a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}