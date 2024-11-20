export * from 'pdf-lib/ts3.4/es';
import * as PDFLib from 'pdf-lib/ts3.4/es';

declare global {
    interface Window {
        PDFLib: typeof PDFLib;
    }
}