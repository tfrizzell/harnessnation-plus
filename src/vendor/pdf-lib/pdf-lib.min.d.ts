// src/vendor/pdf-lib.d.ts
export * from 'pdf-lib';

import * as PDFLib from 'pdf-lib';

declare global {
    interface Window {
        PDFLib: typeof PDFLib;
    }
}