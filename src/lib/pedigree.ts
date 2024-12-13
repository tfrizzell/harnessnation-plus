import './pdf-lib/pdf-lib.min.js';
import { PDFDocument, PDFFont } from 'pdf-lib/ts3.4/es';

import { PDFParagraphBuilder } from './pdf-lib/builder.js';
import { drawTextCentered } from './pdf-lib/utils.js';

import { api } from './harnessnation.js'
import { getHorse, getRaces, Horse, Race, RaceList } from './horses.js';
import { ageToText, downloadFile, formatMark, formatOrdinal, getCurrentSeason, getLifetimeMark, isMobileOS, parseCurrency, parseInt, secondsToTime, toTimestamp } from './utils.js';

type Ancestor = {
    id?: number;
    name: string | 'Unknown';
    sireId?: number;
    damId?: number;
    lifetimeMark?: string;
    progeny?: Progeny[];
    races?: RaceList;
}

enum Context {
    Default = 1,
    Create = 2,
    DamLine = 4,
    Progeny = 8,
    Production = 16,
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

    constructor(priority: ParagraphPriority, font: PDFFont, size: number = 8.5, maxWidth: number = window.PDFLib.PageSizes.Letter[0], indent?: number, firstLineIndent?: number, paddingTop?: number) {
        super(font, size, maxWidth, indent, firstLineIndent, paddingTop);
        this.#priority = priority;
    }

    get priority(): ParagraphPriority {
        return this.#priority;
    }
}

enum ParagraphPriority {
    OnlyIfNeeded,
    VeryLow,
    Low,
    Medium,
    High,
    VeryHigh,
    Required
}

type PedigreeIdType = number | [number, string | number | undefined];

type Progeny = {
    id: number;
    name: string;
    sireId: number;
    sireName: string;
    age: number;
    gender: 'male' | 'female' | 'gelding';
    stable: 'main' | 'breeding' | 'retired';
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

const PEDIGREE_GENERATIONS = 3;

/**
 * Adds a sale catalog style pedigree page to the pdf document.
 * @param {PDFDocument} pdfDoc - the pdf document to add the page to.
 * @param {Horse} horse - the horse the page is being generated for.
 * @param {number} hipNumber - the hip number of the horse, if desired.
 * @param {token} csrfToken - the CSRF token to sign requests.
 * @param {FontMap} fonts - the map of fonts to use in the pdf page.
 * @returns {Promise<void>} A `Promise` that resolves when the page has been added.
 */
async function addPedigreePage(pdfDoc: PDFDocument, horse: Horse, hipNumber?: string | number, csrfToken?: string, fonts?: FontMap): Promise<void> {
    fonts ??= await loadFonts(pdfDoc);

    async function addHorseInfo(paragraph: ParagraphBuilder, horse: Horse | Ancestor | Progeny, races: RaceList | undefined, context: Context = Context.Default): Promise<void> {
        races ??= new RaceList();

        paragraph.add(
            formatName(horse.name!, races),
            getNameFont(races),
        );

        if ((context & Context.Progeny) === Context.Progeny && (<Progeny>horse).gender === 'female')
            paragraph.add(' (M)');

        const ageRef = races.findAgeRef();
        paragraph.add(` ${getMarkString(races, ageRef)}`.replace(/^\s+$/, ''));

        const sireName = (<Progeny>horse).sireName ?? ancestors.get(horse.sireId!)?.name;

        if (sireName) {
            if ((context & Context.DamLine) === Context.DamLine)
                paragraph.add(` by ${sireName}.`);
            else
                paragraph.add(` (${sireName}).`);
        } else
            paragraph.add('.');

        if ((context & Context.Progeny) !== Context.Progeny || !damIds.includes(horse.id)) {
            const winText = getWinText(
                races.getWins(),
                races.findAge(races.slice(-1)[0], ageRef),
                races.findAge(races[0], ageRef),
            );

            if (winText != '')
                paragraph.add(` ${winText}.`);

            const awardText = getAwardText(
                Object.keys(horse).some(key => /^(overall|conference)Award/i.test(key))
                    ? <Progeny>horse
                    : await api.getHorse(horse.id!)
            );

            if (awardText != '')
                paragraph.add(` ${awardText}.`, fonts!.Bold);

            paragraph.add(` ${getKeyRaceString(races, ageRef, context === Context.Create)}`.replace(/^\s+\.?$/, ''));

            if ((context & Context.Production) === Context.Production && (<Progeny>horse).age === 1)
                paragraph.add(' (Yearling)');
            else if ((context & Context.Progeny) === Context.Progeny && (<Progeny>horse).age < 4)
                paragraph.add(` Now ${(<Progeny>horse).age}.`);
        } else
            paragraph.add(' As above.');
    }

    function formatName(name: string, races?: RaceList): string {
        return races?.some(r => r.stake && r.finish === 1) ? name.toUpperCase() : name;
    }

    function getNameFont(races?: RaceList): PDFFont {
        return races?.some(r => r.stake && r.finish! <= 3) ? fonts!.Bold : fonts!.Normal;
    }

    const page = pdfDoc.addPage(window.PDFLib.PageSizes.Letter);
    const margin = { top: 34.87, right: 99, bottom: 34.87, left: 99 };

    page.setBleedBox(margin.left, margin.bottom, page.getWidth() - margin.left - margin.right, page.getHeight() - margin.top - margin.bottom);
    page.moveTo(margin.left, page.getHeight() - margin.top);

    const info = await api.getHorse(horse.id!);
    csrfToken ??= await api.getCSRFToken();

    const [races, pedigree] = await Promise.all([
        getRaces(horse.id!, csrfToken),
        getPedigree(horse.id!, csrfToken),
    ]);

    const ancestors = await populateAncestors(pedigree, csrfToken);
    const damIds: (number | undefined)[] = pedigree.slice(0, 2 ** (PEDIGREE_GENERATIONS + 1) - 2).filter((ancestor, index) => ancestor.id != null && showDamInfo(index)).map(ancestor => ancestor.id!);

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

    // Hip Number
    if (/^(\d+)$/.test(hipNumber?.toString() ?? '')) {
        page.drawText(hipNumber!.toString(), {
            x: margin.left,
            y: page.getY() - 1.95 * fonts.Bold.heightAtSize(16),
            font: fonts.Bold,
            size: 24,
        });
    }

    // Horse Name
    page.moveDown(fonts.Bold.heightAtSize(16) + 1);
    drawTextCentered(page, horse.name!.toUpperCase(), { font: fonts.Bold, size: 16 });

    // Racing Statistics
    const fastestWin = races.findFastestWin();
    const lifetimeMark = getLifetimeMark(races);
    const age = parseInt(info.match(/<b[^>]*>\s*Age:\s*<\/b[^>]*>\s*(\d+)/i)?.[1] ?? 0);

    if (lifetimeMark || age) {
        page.moveDown(fonts.Normal.heightAtSize(10) + 2);

        drawTextCentered(page,
            `${lifetimeMark}${fastestWin ? `-'${fastestWin.date!.getFullYear() % 100}` : ''} ${age === 1 ? '(Yearling)' : age > 0 ? `(${ageToText(age)} Year Old)` : ''}`.trim(),
            { font: fonts.Normal, size: 10 }
        );
    }

    // Horse Info
    page.moveDown(fonts.Bold.heightAtSize(8.5) + 4);

    const color = info.match(/<b[^>]*>\s*Coat Color:\s*<\/b[^>]*>\s*(.*?)\s*<br[^>]*>/i)?.[1]?.trim()?.toUpperCase();
    const gender = info.match(/<b[^>]*>\s*Gender:\s*<\/b[^>]*>\s*(\S+)/i)?.[1]?.trim()?.toUpperCase();
    const foaledDate = info.match(/Foaled: (\w+ \d+[A-Z]{2}, \d{4})/i)?.[1]?.trim()?.replace(/(\d)[A-Z]{2}/i, '$1');

    drawTextCentered(page,
        `${color ?? ''} ${gender ?? ''} ${foaledDate ? `Foaled ${foaledDate}` : ''}`.trim().replace(/ +/g, ' '),
        { font: fonts.Bold, size: 8.5 }
    );

    // Horse ID
    page.moveDown(fonts.Bold.heightAtSize(8.5) + 2);
    drawTextCentered(page, `Horse ID. ${horse.id}`, { font: fonts.Bold, size: 8.5 });

    // Pedigree
    const rowHeight = fonts.Normal.heightAtSize(7) * 2.05;
    page.moveRight(1);
    page.moveDown(4.878 * rowHeight);

    page.drawText(`${horse.name!.toUpperCase()} ${lifetimeMark}`.trim(), {
        font: fonts.Bold,
        size: 7,
    });

    page.moveRight(18);

    const paragraphs: ParagraphBuilder[] = [];
    let paragraph: ParagraphBuilder;
    let column = 0, row = 0;

    const maxWidth = page.getWidth() - margin.right - margin.left;
    const indent = 18;

    for (let i = 0; i < 2 ** (PEDIGREE_GENERATIONS + 1) - 2; i++) {
        const ancestor = ancestors.get(pedigree[i].id) ?? pedigree[i];
        const rows = 2 ** (column + 1);
        const rowSpan = 2 ** PEDIGREE_GENERATIONS / rows;
        const offsetRow = Math.round(((rows - 1) / 2) - row);
        const offsetY = (2 * offsetRow - 1) * rowSpan * rowHeight / 2 - (column === 0 ? 0 : 1);
        const columnWidth = (maxWidth / PEDIGREE_GENERATIONS) - (column === 0 ? 14.5 : 0);

        let text = `${ancestor.name ?? ''} ${ancestor.lifetimeMark ?? ''}`?.trim() || 'Unknown';

        while (fonts.Normal.widthOfTextAtSize(text, 7) > columnWidth)
            text = text.replace(/.{4}$/, '...');

        while (column < PEDIGREE_GENERATIONS - 1 && fonts.Normal.widthOfTextAtSize(text, 7) < columnWidth) {
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

        if (!showDamInfo(i)) {
            row++;
            continue;
        }

        column++;
        row = 0;
        page.moveRight(columnWidth + 6);

        if (!damIds.includes(ancestor.id))
            continue;

        // Dam Info
        const dam = ancestor as DamLineAncestor;
        await populateProgenyData(dam.progeny, csrfToken);
        dam.progeny.sort(sortProgeny);

        const generation = damIds.indexOf(ancestor.id) + 1;
        paragraphs.push(paragraph = new ParagraphBuilder(ParagraphPriority.Required, fonts.Bold, 8.5, maxWidth, indent));
        paragraph.add(`${formatOrdinal(generation)} Dam`);

        paragraphs.push(paragraph = new ParagraphBuilder(ParagraphPriority.Required, fonts.Normal, 8.5, maxWidth, indent));
        await addHorseInfo(paragraph, dam, dam.races, Context.DamLine);

        const isYearling = (age === 1 && generation === 1);

        if (isYearling && !dam.progeny.some(p => p.id !== horse.id))
            paragraph.add(' This is her first foal.');
        else if (isYearling && /^(Colt|Gelding)$/i.test(gender ?? '') && !dam.progeny.some(p => p.id !== horse.id && (p.gender === 'male' || p.gender === 'gelding')))
            paragraph.add(' First colt.', fonts.Bold);
        else if (isYearling && /^Filly$/i.test(gender ?? '') && !dam.progeny.some(p => p.id !== horse.id && p.gender === 'female'))
            paragraph.add(' First filly.', fonts.Bold);

        if (dam.progeny.length > (generation === 1 ? 1 : 0)) {
            const foalCount = dam.progeny.length - (isYearling ? 1 : 0);
            const winningProgeny = dam.progeny.filter(progeny => progeny.races?.some(race => race.finish === 1)).length;

            paragraph.add(` From ${foalCount}${isYearling ? ' previous' : ''} ${foalCount === 1 ? 'foal' : 'foals'}, dam of ${winningProgeny} winners including:`
                .replace(/ [01] winners including/, ''));
        }

        for (const progeny of dam.progeny) {
            if (progeny.age < 2 && progeny.id === horse.id)
                continue;

            paragraphs.push(paragraph = new ParagraphBuilder(
                getParagraphPriority(horse, dam, progeny),
                fonts.Normal,
                8.5,
                maxWidth,
                indent,
                indent / 2
            ));

            await addHorseInfo(paragraph, progeny, progeny.races, Context.Progeny);
        }
    }

    if (horse.sireId == null && horse.damId == null) {
        paragraphs.push(paragraph = new ParagraphBuilder(ParagraphPriority.Required, fonts.Normal, 8.5, maxWidth, indent));
        await addHorseInfo(paragraph, horse, races, Context.Create);
    }

    if (gender === 'MARE' && /<b[^>]*>\s*Total Foals:\s*<\/b[^>]*>\s*\d+/.test(info)) {
        paragraphs.push(paragraph = new ParagraphBuilder(
            ParagraphPriority.Required,
            fonts.Bold,
            10,
            undefined,
            undefined,
            (page.getWidth() - fonts.Bold.widthOfTextAtSize('PRODUCTION RECORD', 10)) / 2 - margin.left,
            fonts.Bold.heightAtSize(10) * 0.3,
        ));

        paragraph.add('PRODUCTION RECORD');

        const currentSeason = getCurrentSeason();
        const progeny = await getDamProgeny(horse.id!);
        await populateProgenyData(progeny);

        progeny.sort((a, b) => (b.age - a.age) || (a.id - b.id));
        const ageOffsetIndex = progeny.findIndex(p => p.age !== 21);

        for (const prog of progeny) {
            if (prog.age === 21)
                prog.age += ageOffsetIndex - progeny.indexOf(prog) - 1;

            const birthSeason = new Date(currentSeason.valueOf());
            birthSeason.setMonth(birthSeason.getMonth() - 3 * (prog.age - 1));

            paragraphs.push(paragraph = new ParagraphBuilder(
                getParagraphPriority(horse, <DamLineAncestor>horse, prog) + 3,
                fonts.Normal,
                8.5,
                maxWidth,
                indent * 2,
                indent,
            ));

            paragraph.add(`${birthSeason.toLocaleString('default', { month: 'short', year: 'numeric' })}-`);
            await addHorseInfo(paragraph, prog, prog.races, Context.Progeny | Context.Production);
        }
    }

    page.moveLeft(page.getX() - margin.left);
    page.moveDown(5.25 * rowHeight);
    let totalHeight = paragraphs.reduce((total, paragraph) => total + paragraph.getHeight(), 0) + 1 * Math.max(0, paragraphs.length - 1);

    while (page.getY() - totalHeight < margin.bottom) {
        const lowestPriority = Math.min(...paragraphs.map(paragraph => paragraph.priority));

        for (let i = paragraphs.length - 1; i >= 0; i--) {
            const paragraph = paragraphs[i];

            if (paragraphs[i].priority === lowestPriority) {
                paragraphs.splice(i, 1);
                totalHeight -= paragraph.getHeight() + 1;
                break;
            }
        }
    }

    for (const paragraph of paragraphs) {
        paragraph.write(page);
        page.moveDown(paragraph.getHeight() + 1);
    }
}

/**
 * Adds a watermark to every page in the pdf document.
 * @param {PDFDocument} pdfDoc - the pdf document to add the watermark to.
 * @returns {Promise<void>} A `Promise` that resolves when the watermark has been added.
 */
async function addWatermark(pdfDoc: PDFDocument): Promise<void> {
    const logo = await fetch(chrome.runtime.getURL('/icons/pdf-watermark.png'))
        .then(res => res.arrayBuffer())
        .then(png => pdfDoc.embedPng(png));

    for (const page of pdfDoc.getPages()) {
        let x: number, y: number;

        try {
            const box = page.getBleedBox();
            x = box.x + box.width;
            y = box.y + box.height;
        } catch (e: any) {
            x = page.getWidth() - 99;
            y = page.getHeight() - 34.87;
        }

        page.drawImage(logo, {
            x: x - 32,
            y: y - 49.8,
            width: 32,
            height: 32,
            opacity: 0.125,
        });
    }
}

/**
 * Generates a sale catalog for the given horses.
 * @param {number[]} ids - the ids of the horses. Accepted formats:  
 *                          `[id1, id2, ...]`  
 *                          `[[id1, hip1], [id2, hip2], ...]`
 * @param {boolean} showHipNumbers - if true, hip numbers will be displayed on each page.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function generatePedigreeCatalog(ids: PedigreeIdType[], showHipNumbers: boolean = false): Promise<void> {
    if (await isMobileOS()) {
        console.debug(`%cpedigree.ts%c     Mobile OS Detected: skipping pedigree catalog generation`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    if (ids.length === 1) {
        const [id, hipNumber] = Array.isArray(ids[0]) ? ids[0] : [ids[0], 1];
        return await generatePedigreePage(id, showHipNumbers ? Math.max(1, parseInt(hipNumber ?? 0) || 0) : false);
    }

    const horses: [Horse, string | number][] = [];
    let csrfToken: string | undefined;

    for (let i = 0; i < ids.length; i++) {
        const [id, hipNumber] = <[number, string | number | undefined]>(Array.isArray(ids[i]) ? ids[i] : [ids[i], i + 1]);
        const horse = await getHorse(id);
        csrfToken ??= await api.getCSRFToken();

        if (horse.id !== id || csrfToken == null)
            throw new ReferenceError(`Failed to generate sale catalog: could not parse info for horse ${id}`);

        horses.push([horse, Math.max(1, parseInt(hipNumber ?? 0) || i + 1)]);
    }

    const pdfDoc = await window.PDFLib.PDFDocument.create();
    const fonts = await loadFonts(pdfDoc);

    while (horses.length > 0)
        await Promise.all(horses.splice(0, 3).map(([horse, hipNumber]) => addPedigreePage(pdfDoc, horse, showHipNumbers ? hipNumber : undefined, csrfToken, fonts)));

    await addWatermark(pdfDoc);
    await downloadFile(await pdfDoc.saveAsBase64({ dataUri: true }), `hnplus-pedigree-catalog-${toTimestamp().replace(/\D/g, '')}.pdf`);
}

/**
 * Generates a sale catalog style pedigree page for the given horse.
 * @param {number} id - the id of the horse.
 * @param {string | number | boolean} hipNumber - if set, the hip number will be displayed on the pedigree page.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function generatePedigreePage(id: number, hipNumber?: string | number | boolean): Promise<void> {
    if (await isMobileOS()) {
        console.debug(`%cpedigree.ts%c     Mobile OS Detected: skipping pedigree page generation`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    const horse = await getHorse(id);
    const csrfToken = await api.getCSRFToken();

    if (horse.id !== id || csrfToken == null)
        throw new ReferenceError(`Failed to generate sale catalog: could not parse info for horse ${id}`);

    if (hipNumber === true)
        hipNumber = 1;
    else if (hipNumber === false)
        hipNumber = undefined;

    const pdfDoc = await window.PDFLib.PDFDocument.create();
    await addPedigreePage(pdfDoc, horse, hipNumber == null ? undefined : Math.max(1, parseInt(hipNumber ?? 0)), csrfToken);
    await addWatermark(pdfDoc);
    await downloadFile(await pdfDoc.saveAsBase64({ dataUri: true }), `${horse.name}.pdf`);
}

function getAwardText(data: string | Progeny): string {
    if (typeof data === 'string' ? /trophyhorse\.png/i.test(data) : data.overallAwardWinner)
        return 'Overall Award Winner';
    else if (typeof data === 'string' ? /trophyhorse_silver\.png/i.test(data) : data.conferenceAwardWinner)
        return 'Conference Award Winner';

    return '';
}

async function getDamProgeny(id: number, csrfToken?: string): Promise<Progeny[]> {
    const progenyIds: number[] = [];

    return Array.from(
        (await api.getProgenyList(id, csrfToken))
            .matchAll(/<td[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*><span[^>]*>(.*?)<\/span[^>]*><\/a[^>]*>.*?<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td[^>]*>\s*<td[^>]*>\s*<i[^>]*fa-(mars|venus|neuter)[^>]*>\s*<\/i[*>]*>\s*<\/td[^>]*>\s*<td[^>]*>().*?<\/td[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*\d+\s*-\s*(\d+)\s*-\s*\d+\s*-\s*\d+\s*<\/td[^>]*>\s*<td[^>]*>\s*(\$[\d,]+)?\s*<\/td[^>]*>/gis)
    ).map(([match, id, name, sireId, sireName, age, gender, stable, wins, earnings]): Progeny => {
        const progenyId = parseInt(id);
        progenyIds.push(progenyId)

        return {
            id: progenyId,
            name: name.trim(),
            sireId: parseInt(sireId),
            sireName: sireName.trim(),
            age: parseInt(age),
            gender: gender.toLowerCase() === 'mars'
                ? 'male'
                : gender.toLowerCase() === 'venus'
                    ? 'female'
                    : 'gelding',
            stable: stable.toLowerCase() === 'm'
                ? 'main'
                : stable.toLowerCase() === 'b'
                    ? 'breeding'
                    : 'retired',
            wins: parseInt(wins),
            earnings: parseCurrency(earnings),
            overallAwardWinner: /trophyhorse\.png/i.test(match),
            conferenceAwardWinner: /trophyhorse_silver\.png/i.test(match),
        };
    }).filter((progeny, index) => progenyIds.indexOf(progeny.id) === index).sort(sortProgeny);
}

function getKeyRaces(races: RaceList, ageRef?: Race, includeOpen?: boolean, includePreferred?: boolean): RaceList {
    ageRef ??= races.findAgeRef();

    return races
        .filter(race => isKeyRace(race, includeOpen, includePreferred))
        .sort((a, b) => (+b.stake! - +a.stake!) || (a.finish! - b.finish!) || (b.purse! - a.purse!) || (a.date!.valueOf() - b.date!.valueOf()));
}

function getKeyRaceString(races: RaceList, ageRef?: Race, includeOpen?: boolean, includePreferred?: boolean): string {
    const output: string[] = [];
    ageRef ??= races.findAgeRef();

    const filteredRacesByAge = Map.groupBy(
        getKeyRaces(races, ageRef, includeOpen, includePreferred),
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
            const raceGroup = races.filter(r =>
                r.name?.replace('Maiden ', '') === race!.name?.replace('Maiden ', '')
                && (!r.stake || (r.date?.valueOf() ?? 0) - (race!.date?.valueOf() ?? 0) < 1_209_600_000)
            ).sort((a, b) => b.date!.valueOf() - a.date!.valueOf());

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

        output.push(`At ${age}, ${buffer.join('; ')}.`.replace(/^At undefined, (.)/, (_, c) => c.toUpperCase()));
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

function getParagraphPriority(horse: Horse, dam: DamLineAncestor, progeny: Progeny): ParagraphPriority {
    if (progeny.id === horse.id || dam.progeny?.length === 1)
        return ParagraphPriority.Required;

    if (progeny.races!.some(race => race.stake && race.finish === 1))
        return ParagraphPriority.VeryHigh;

    if (progeny.overallAwardWinner || progeny.races!.some(race => isKeyRace(race)))
        return ParagraphPriority.High;

    const earningsPerStart = progeny.races?.length ?? 0 > 0
        ? progeny.earnings / progeny.races!.length
        : 0;

    if (progeny.conferenceAwardWinner || progeny.earnings >= 500_000 || earningsPerStart >= 20_000)
        return ParagraphPriority.Medium;

    if ((progeny.age > 1 && progeny.age < 4) || progeny.earnings >= 250_000 || earningsPerStart >= 15_000 || progeny.races!.some(race => race.finish === 1))
        return ParagraphPriority.Low;

    if (progeny.age > 1)
        return ParagraphPriority.VeryLow;

    return ParagraphPriority.OnlyIfNeeded;
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

function getWinText(wins: number, ageStart?: number, ageEnd?: number): string {
    if (wins < 1)
        return '';

    let text = `${wins} ${wins === 1 ? 'win' : 'wins'}`;

    if (ageStart && ageEnd) {
        if (ageStart !== ageEnd)
            text += `, ${ageStart} ${ageEnd! - ageStart! > 1 ? 'thru' : 'and'} ${ageEnd}`;
        else
            text += `, at ${ageStart}`;
    }

    return text;
}

function isKeyRace(race: Race, includeOpen: boolean = false, includePreferred: boolean = false): boolean {
    return (race.finish! <= 3 && race.stake)
        || (includeOpen && race.finish === 1 && /^(Maiden )?Open$/i.test(race.name ?? ''))
        || (includePreferred && race.finish === 1 && /^(Maiden )?(Open|Preferred)$/i.test(race.name ?? ''));
}

async function loadFonts(pdfDoc: PDFDocument): Promise<FontMap> {
    return await Promise.all([
        pdfDoc.embedFont(window.PDFLib.StandardFonts.Helvetica, { subset: true }),
        pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaBold, { subset: true }),
        pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaBoldOblique, { subset: true }),
        pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaOblique, { subset: true }),
    ]).then(([Helvetica, HelveticaBold, HelveticaBoldOblique, HelveticaOblique]): FontMap => ({
        Normal: Helvetica,
        Bold: HelveticaBold,
        BoldItalic: HelveticaBoldOblique,
        Italic: HelveticaOblique,
        Helvetica,
        HelveticaBold,
        HelveticaBoldOblique,
        HelveticaOblique,
    }));
}

async function populateAncestors(pedigree: Ancestor[], csrfToken?: string): Promise<Map<number | undefined, Ancestor>> {
    csrfToken ??= await api.getCSRFToken();
    const ancestors = new Map<number | undefined, Ancestor>();

    for (let i = 0; i < 2 ** (PEDIGREE_GENERATIONS + 1) - 2; i += 3) {
        await Promise.all(Array(3).fill(0).map(async (_, j) => {
            const ancestor = ancestors.get(pedigree[i + j]?.id) ?? pedigree[i + j] ?? { name: 'Undefined' };

            if (ancestor.id != null) {
                const races = ancestors.get(ancestor.id)?.races ?? await getRaces(ancestor.id, csrfToken);

                if (!ancestors.has(ancestor.id)) {
                    ancestor.sireId = pedigree[2 * (i + j + 1)]?.id;
                    ancestor.damId = pedigree[2 * (i + j + 1) + 1]?.id;
                    ancestor.lifetimeMark = getLifetimeMark(races);
                }

                if (showDamInfo(i + j) && (ancestor.progeny == null || ancestor.races == null)) {
                    ancestor.progeny = await getDamProgeny(ancestor.id, csrfToken);
                    ancestor.races = races;
                }
            }

            if (ancestor.id != null && !ancestors.has(ancestor.id))
                ancestors.set(ancestor.id, ancestor);
        }));
    }

    return ancestors;
}

async function populateProgenyData(progeny: Progeny[], csrfToken?: string): Promise<void> {
    for (let i = 0; i < progeny.length; i += 3) {
        await Promise.all(Array(3).fill(0).map(async (_, j) => {
            const prog = progeny[i + j];

            if (prog?.id == null)
                return;

            csrfToken ??= await api.getCSRFToken();
            prog.races = await getRaces(prog.id, csrfToken);
            prog.earnings = prog.races.getEarnings();
        }));
    }
}

function showDamInfo(index: number): boolean {
    return (Math.log2(index + 3) - 1) % 1 === 0;
}

function sortProgeny(a: Progeny, b: Progeny): number {
    return (b.earnings - a.earnings) || (b.age - a.age) || (a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}