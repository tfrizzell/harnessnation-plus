// src/types/jquery.d.ts
/// <reference types="jquery" />
/// <reference types="datatables.net" />
export { };

declare global {
    interface Window {
        $?: JQueryStatic;
        jQuery: JQueryStatic;
    }
}