import { PDFFont, PDFPage, PDFPageDrawTextOptions } from 'pdf-lib/ts3.4/es';

/**
 * Constructs a new PDF paragraph builder.
 * @param font The default font to use if none is explicitly specified.
 * @param size The default font size to use if none is explicitly specified. Defaults ot 24.
 * @param maxWidth The maximum width of the paragraph. Defaults to PageSizes.A4[0].
 * @param indent The size of indent to use for any lines after the first.
 * @param firstLineIndent The size of indent to use for the first line. 
 */
export class PDFParagraphBuilder {
    #components: ParagraphTextComponent[] = [];
    #lines?: ParagraphTextComponent[][];

    #maxWidth: number;
    #font: PDFFont;
    #size: number;
    #indent?: number;
    #firstLineIndent?: number;
    #paddingTop?: number;
    #buildRequired: boolean = false;

    constructor(font: PDFFont, size: number = 24, maxWidth: number = window.PDFLib.PageSizes.A4[0], indent?: number, firstLineIndent?: number, paddingTop?: number) {
        this.#maxWidth = Math.max(0, maxWidth ?? window.PDFLib.PageSizes.A4[0]);
        this.#font = font;
        this.#size = size;
        this.#indent = indent;
        this.#firstLineIndent = firstLineIndent;
        this.#paddingTop = paddingTop;
    }

    get firstLineIndent(): number | undefined {
        return this.#firstLineIndent;
    }

    set firstLineIndent(value: number | undefined) {
        if (value !== this.#firstLineIndent) {
            this.#firstLineIndent = value;
            this.#buildRequired = (this.#components.length > 0);
        }
    }

    get font(): PDFFont {
        return this.#font;
    }

    set font(value: PDFFont) {
        if (value !== this.#font) {
            this.#font = value;
            this.#buildRequired = (this.#components.length > 0);
        }
    }

    get indent(): number | undefined {
        return this.#indent;
    }

    set indent(value: number | undefined) {
        if (value !== this.#indent) {
            this.#indent = value;
            this.#buildRequired = (this.#components.length > 0);
        }
    }

    get maxWidth(): number {
        return this.#maxWidth;
    }

    set maxWidth(value: number) {
        value ??= window.PDFLib.PageSizes.A4[0];

        if (value !== this.#maxWidth) {
            this.#maxWidth = value;
            this.#buildRequired = (this.#components.length > 0);
        }
    }

    get paddingTop(): number | undefined {
        return this.#paddingTop;
    }

    set paddingTop(value: number | undefined) {
        this.#paddingTop = value;
    }

    get size(): number {
        return this.#size;
    }

    set size(value: number | undefined) {
        value ??= 24;

        if (value !== this.#size) {
            this.#size = value;
            this.#buildRequired = (this.#components.length > 0);
        }
    }

    get text() {
        return this.#components.map(c => c.text).join(' ');
    }

    /**
     * Adds a new text component to the paragraph builder.
     * @param text The text to be added to the paragraph.
     * @param font The font to use for the text.
     * @param size The size of the font to be used.
     * @param options Additional options to pass into PDFPage.drawText()
     */
    add(text: string, font?: PDFFont, size?: number, options?: Omit<PDFPageDrawTextOptions, 'font' | 'size'>): ParagraphTextComponent {
        const comp: ParagraphTextComponent = Object.freeze({ text, font, size, options });
        this.#components.push(comp);
        this.#buildRequired = true;
        return comp;
    }

    /**
     * Builds the paragraph structure into lines of text components.
     */
    build(): void {
        if (this.maxWidth > 0) {
            this.#lines = [];

            let line: ParagraphTextComponent[] = []
            let lineWidth = this.firstLineIndent ?? 0;

            for (const comp of this.#components) {
                const font = comp.font ?? this.font;
                const size = comp.size ?? this.size;

                const words = comp.text.split(' ');
                let text = '';

                for (let i = 0; i < words.length; i++) {
                    let newText = `${text}${(i === 0 ? '' : ' ')}${words[i]}`;
                    let wordWidth = font.widthOfTextAtSize(`${(i === 0 ? '' : ' ')}${words[i]}`, size);

                    if (lineWidth + wordWidth > this.maxWidth) {
                        line.push(Object.freeze({ ...comp, text, }))
                        this.#lines.push(line.splice(0));

                        lineWidth = this.indent ?? 0;
                        newText = words[i];
                        wordWidth = font.widthOfTextAtSize(words[i], size);
                        text = '';
                    }

                    text = newText;
                    lineWidth += wordWidth;
                }

                if (text.length > 0)
                    line.push(Object.freeze({ ...comp, text, }))
            }

            if (line.length > 0)
                this.#lines.push(line);
        } else
            this.#lines = [this.#components];

        this.#buildRequired = false;
    }

    /**
     * Gets the total height of the paragraph.
     * @returns The total height of the paragraph.
     */
    getHeight(): number {
        if (this.#buildRequired)
            this.build();

        return (this.#lines?.reduce((total, line) => total + Math.max(...line.map(comp => (comp.font ?? this.font).heightAtSize(comp.size ?? this.size))), 0) ?? 0)
            + 1 * Math.max(0, (this.#lines?.length ?? 0) - 1)
            + (this.#paddingTop ?? 0);
    }

    /**
     * Gets the number of lines in the paragraph.
     * @returns The number of lines in the paragraph.
     */
    getLineCount(): number {
        if (this.#buildRequired)
            this.build();

        return (this.#lines?.slice() ?? [this.#components]).length;
    }

    /**
     * Get the list of each line in the paragrah.
     * @returns The list of each line in the paragraph.
     */
    getLines(): readonly ParagraphTextComponent[][] {
        if (this.#buildRequired)
            this.build();

        return this.#lines?.slice() ?? [this.#components];
    }

    /**
     * Removes a text component from the paragraph builder.
     * @param text The text to identify the component by.
     * @param font The font to identify the component by, if provided.
     * @param size The size to identify the component by, if provided.
     * @param options The options to identify the component by, if provided.
     */
    remove(text: string, font?: PDFFont, size?: number, options?: Omit<PDFPageDrawTextOptions, 'font' | 'size'>): boolean {
        const index = this.#components.findIndex(comp =>
            comp.text === text
            && (!font || comp.font === font)
            && (!size || comp.size === size)
            && (!options || Object.entries(comp.options ?? {}).sort().toString() === Object.entries(options ?? {}).sort().toString())
        );

        if (index !== -1) {
            this.#components.splice(index, 1);
            this.#buildRequired = true;
        }

        return index !== -1;
    }

    /**
     * Writes the paragraph out to the give PDF page.
     * @param page The page to write the paragraph to.
     */
    write(page: PDFPage): void {
        if (!this.#lines || this.#buildRequired)
            this.build();

        const { x, y } = page.getPosition();

        for (let i = 0; i < this.#lines!.length; i++) {
            if (i === 0) {
                if (this.firstLineIndent != null)
                    page.moveTo(x + this.firstLineIndent, y);

                if (this.paddingTop != null)
                    page.moveDown(this.paddingTop);
            } else if (i > 0) {
                const lineHeight = Math.max(...this.#lines![i].map(comp => (comp.font ?? this.font).heightAtSize((comp.size ?? this.size))));
                page.moveTo(x + (this.indent ?? 0), page.getY() - lineHeight - 1);
            }

            for (let j = 0; j < this.#lines![i].length; j++) {
                const comp = this.#lines![i][j];
                const font = comp.font ?? this.font;
                const size = comp.size ?? this.size;

                page.drawText(comp.text, { ...comp.options, font, size, });
                page.moveRight(font.widthOfTextAtSize(comp.text, size));
            }
        }

        page.moveTo(x, y);
    }
}

export interface ParagraphTextComponent {
    text: string;
    font?: PDFFont;
    size?: number;
    options?: Omit<PDFPageDrawTextOptions, 'font' | 'size'>;
}