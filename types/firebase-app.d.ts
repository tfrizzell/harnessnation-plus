/// <see cref="https://firebase.google.com/docs/reference/js/firestore_.md" />
declare module '@firebase/app' {
    import { LogCallback, LogOptions, LogLevelString } from '@firebase/logger'

    export interface FirebaseApp {
        name: string;
        options: FirebaseOptions;
        automaticDataCollectionEnabled: boolean;
    }

    export interface FirebaseAppSettings {
        name?: string;
        automaticDataCollectionEnabled?: boolean;
    }

    export interface FirebaseOptions {
        apiKey?: string;
        authDomain?: string;
        databaseURL?: string;
        projectId?: string;
        storageBucket?: string;
        messagingSenderId?: string;
        appId?: string;
        measurementId?: string;
    }

    export function deleteApp(app: FirebaseApp): Promise<void>;

    export function getApp(name?: string): FirebaseApp;

    export function getApps(): FirebaseApp[];

    export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;

    export function initializeApp(options: FirebaseOptions, config?: FirebaseAppSettings): FirebaseApp;

    export function onLog(logCallback: LogCallback | null, options?: LogOptions): void;

    export function registerVersion(libraryKeyOrName: string, version: string, variant?: string): void;

    export function setLogLevel(logLevel: LogLevelString): void;
}