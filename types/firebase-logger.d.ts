/// <see cref="https://github.com/firebase/firebase-js-sdk/blob/master/packages/logger/src/logger.ts" />
declare module '@firebase/logger' {
    export type LogLevelString =
        | 'debug'
        | 'verbose'
        | 'info'
        | 'warn'
        | 'error'
        | 'silent';

    export interface LogOptions {
        level: LogLevelString;
    }

    export type LogCallback = (callbackParams: LogCallbackParams) => void;

    export interface LogCallbackParams {
        level: LogLevelString;
        message: string;
        args: unknown[];
        type: string;
    }

    export enum LogLevel {
        DEBUG,
        VERBOSE,
        INFO,
        WARN,
        ERROR,
        SILENT
    }
}