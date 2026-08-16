import type { PDFPage, PDFPageDrawTextOptions } from 'pdf-lib';

type DrawTextCenteredOptions = Omit<PDFPageDrawTextOptions, 'font' | 'size'> & {
    font: NonNullable<PDFPageDrawTextOptions['font']>;
    size: NonNullable<PDFPageDrawTextOptions['size']>;
};

export function drawTextCentered(
    page: PDFPage,
    text: string,
    options: DrawTextCenteredOptions
): void {
    page.drawText(text, {
        ...options,
        x: (page.getWidth() - options.font.widthOfTextAtSize(text, options.size)) / 2,
    });
}