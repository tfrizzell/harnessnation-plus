import { PDFPage, PDFPageDrawTextOptions } from 'pdf-lib/ts3.4/es';

export function drawTextCentered(page: PDFPage, text: string, options: PDFPageDrawTextOptions = {}): void {
    const font = options?.font || (page as any).font;
    const size = options?.size || (page as any).fontSize;

    page.drawText(text, {
        ...options,
        x: (page.getWidth() - font.widthOfTextAtSize(text, size)) / 2,
    });
}