// src/types/vendor/pdf-lib.d.ts
import * as PDFLib from 'pdf-lib/ts3.4/es';

declare module '*/vendor/pdf-lib/pdf-lib.min.js' {
    export * from 'pdf-lib/ts3.4/es';
}

declare global {
    interface Window {
        PDFLib: typeof PDFLib;
    }
}