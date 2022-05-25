/// <see cref='https://firebase.google.com/docs/reference/js/firestore_.md' />
declare module '@firebase/firestore' {
    import { FirebaseApp } from '@firebase/app';
    import { LogLevel } from '@firebase/logger';
    import { EmulatorMockTokenOptions, FirebaseError } from '@firebase/util';

    export class Bytes {
        static fromBase64String(base64: string): Bytes;
        static fromUint8Array(array: Uint8Array): Bytes;
        isEqual(other: Bytes): boolean;
        toBase64(): string;
        toString(): string;
        toUint8Array(): Uint8Array;
    }

    export class CollectionReference<T = DocumentData> extends Query<T> {
        get id(): string;
        get parent(): DocumentReference<DocumentData> | null;
        get path(): string;
        readonly type = "collection";
        withConverter<U>(converter: FirestoreDataConverter<U>): CollectionReference<U>;
        withConverter(converter: null): CollectionReference<DocumentData>;
    }

    export interface DocumentChange<T = DocumentData> {
        readonly doc: QueryDocumentSnapshot<T>;
        readonly newIndex: number;
        readonly oldIndex: number;
        readonly type: DocumentChangeType;
    }

    export interface DocumentData {
    }

    export class DocumentReference<T = DocumentData> {
        readonly converter: FirestoreDataConverter<T> | null;
        readonly firestore: Firestore;
        get id(): string;
        get parent(): CollectionReference<T>;
        get path(): string;
        readonly type = "document";
        withConverter<U>(converter: FirestoreDataConverter<U>): DocumentReference<U>;
        withConverter(converter: null): DocumentReference<DocumentData>;
    }

    export class DocumentSnapshot<T = DocumentData> {
        protected constructor();
        get id(): string;
        readonly metadata: SnapshotMetadata;
        get ref(): DocumentReference<T>;
        data(options?: SnapshotOptions): T | undefined;
        exists(): this is QueryDocumentSnapshot<T>;
        get(fieldPath: string | FieldPath, options?: SnapshotOptions): any;
    }

    export class FieldPath {
        constructor(...fieldNames: string[]);
        isEqual(other: FieldPath): boolean;
    }

    export abstract class FieldValue {
        abstract isEqual(other: FieldValue): boolean;
    }

    export class Firestore {
        get app(): FirebaseApp;
        type: 'firestore-lite' | 'firestore';
        toJSON(): object;
    }

    export interface FirestoreDataConverter<T> {
        fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): T;
        toFirestore(modelObject: WithFieldValue<T>): DocumentData;
        toFirestore(modelObject: PartialWithFieldValue<T>, options: SetOptions): DocumentData;
    }

    export class FirestoreError extends FirebaseError {
        readonly code: FirestoreErrorCode;
        readonly message: string;
        readonly stack?: string;
    }

    export interface FirestoreSettings {
        cacheSizeBytes?: number;
        experimentalAutoDetectLongPolling?: boolean;
        experimentalForceLongPolling?: boolean;
        host?: string;
        ignoreUndefinedProperties?: boolean;
        ssl?: boolean;
    }

    export class GeoPoint {
        constructor(latitude: number, longitude: number);
        get latitude(): number;
        get longitude(): number;
        isEqual(other: GeoPoint): boolean;
        toJSON(): {
            latitude: number;
            longitude: number;
        };
    }

    export class LoadBundleTask implements PromiseLike<LoadBundleTaskProgress> {
        catch<R>(onRejected: (a: Error) => R | PromiseLike<R>): Promise<R | LoadBundleTaskProgress>;
        onProgress(next?: (progress: LoadBundleTaskProgress) => unknown, error?: (err: Error) => unknown, complete?: () => void): void;
        then<T, R>(onFulfilled?: (a: LoadBundleTaskProgress) => T | PromiseLike<T>, onRejected?: (a: Error) => R | PromiseLike<R>): Promise<T | R>;
    }

    export interface LoadBundleTaskProgress {
        bytesLoaded: number;
        documentsLoaded: number;
        taskState: TaskState;
        totalBytes: number;
        totalDocuments: number;
    }

    export interface PersistenceSettings {
        forceOwnership?: boolean;
    }

    export class Query<T = DocumentData> {
        protected constructor();
        readonly converter: FirestoreDataConverter<T> | null;
        readonly firestore: Firestore;
        readonly type: 'query' | 'collection';
        withConverter(converter: null): Query<DocumentData>;
        withConverter<U>(converter: FirestoreDataConverter<U>): Query<U>;
    }

    export abstract class QueryConstraint {
        abstract readonly type: QueryConstraintType;
    }

    export class QueryDocumentSnapshot<T = DocumentData> extends DocumentSnapshot<T> {
        /** @override */
        data(options?: SnapshotOptions): T;
    }

    export class QuerySnapshot<T = DocumentData> {
        get docs(): Array<QueryDocumentSnapshot<T>>;
        get empty(): boolean;
        readonly metadata: SnapshotMetadata;
        readonly query: Query<T>;
        get size(): number;
        docChanges(options?: SnapshotListenOptions): Array<DocumentChange<T>>;
        forEach(callback: (result: QueryDocumentSnapshot<T>) => void, thisArg?: unknown): void;
    }

    export interface SnapshotListenOptions {
        readonly includeMetadataChanges?: boolean;
    }

    export class SnapshotMetadata {
        readonly fromCache: boolean;
        readonly hasPendingWrites: boolean;
        isEqual(other: SnapshotMetadata): boolean;
    }

    export interface SnapshotOptions {
        readonly serverTimestamps?: 'estimate' | 'previous' | 'none';
    }

    export class Timestamp {
        constructor(
            seconds: number,
            nanoseconds: number);
        readonly nanoseconds: number;
        readonly seconds: number;
        static fromDate(date: Date): Timestamp;
        static fromMillis(milliseconds: number): Timestamp;
        isEqual(other: Timestamp): boolean;
        static now(): Timestamp;
        toDate(): Date;
        toJSON(): {
            seconds: number;
            nanoseconds: number;
        };
        toMillis(): number;
        toString(): string;
        valueOf(): string;
    }

    export class Transaction {
        delete(documentRef: DocumentReference<unknown>): this;
        get<T>(documentRef: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
        set<T>(documentRef: DocumentReference<T>, data: WithFieldValue<T>): this;
        set<T>(documentRef: DocumentReference<T>, data: PartialWithFieldValue<T>, options: SetOptions): this;
        update<T>(documentRef: DocumentReference<T>, data: UpdateData<T>): this;
        update(documentRef: DocumentReference<unknown>, field: string | FieldPath, value: unknown, ...moreFieldsAndValues: unknown[]): this;
    }

    /// <see cref="https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/lite-api/transaction_options.ts" />
    export interface TransactionOptions {
        readonly maxAttempts?: number;
    }

    export interface Unsubscribe {
    }

    export class WriteBatch {
        commit(): Promise<void>;
        delete(documentRef: DocumentReference<unknown>): WriteBatch;
        set<T>(documentRef: DocumentReference<T>, data: WithFieldValue<T>): WriteBatch;
        set<T>(documentRef: DocumentReference<T>, data: PartialWithFieldValue<T>, options: SetOptions): WriteBatch;
        update<T>(documentRef: DocumentReference<T>, data: UpdateData<T>): WriteBatch;
        update(documentRef: DocumentReference<unknown>, field: string | FieldPath, value: unknown, ...moreFieldsAndValues: unknown[]): WriteBatch;
    }

    export function addDoc<T>(reference: CollectionReference<T>, data: WithFieldValue<T>): Promise<DocumentReference<T>>;

    export function arrayRemove(...elements: unknown[]): FieldValue;

    export function arrayUnion(...elements: unknown[]): FieldValue;

    export function clearIndexedDbPersistence(firestore: Firestore): Promise<void>;

    export function collection(firestore: Firestore, path: string, ...pathSegments: string[]): CollectionReference<DocumentData>;

    export function collection(reference: CollectionReference<unknown>, path: string, ...pathSegments: string[]): CollectionReference<DocumentData>;

    export function collection(reference: DocumentReference, path: string, ...pathSegments: string[]): CollectionReference<DocumentData>;

    export function collectionGroup(firestore: Firestore, collectionId: string): Query<DocumentData>;

    export function connectFirestoreEmulator(firestore: Firestore, host: string, port: number, options?: {
        mockUserToken?: EmulatorMockTokenOptions | string;
    }): void;

    export function deleteDoc(reference: DocumentReference<unknown>): Promise<void>;

    export function deleteField(): FieldValue;

    export function disableNetwork(firestore: Firestore): Promise<void>;

    export function doc(firestore: Firestore, path: string, ...pathSegments: string[]): DocumentReference<DocumentData>;

    export function doc<T>(reference: CollectionReference<T>, path?: string, ...pathSegments: string[]): DocumentReference<T>;

    export function doc(reference: DocumentReference<unknown>, path: string, ...pathSegments: string[]): DocumentReference<DocumentData>;

    export function documentId(): FieldPath;

    export function enableIndexedDbPersistence(firestore: Firestore, persistenceSettings?: PersistenceSettings): Promise<void>;

    export function enableMultiTabIndexedDbPersistence(firestore: Firestore): Promise<void>;

    export function enableNetwork(firestore: Firestore): Promise<void>;

    export function endAt(snapshot: DocumentSnapshot<unknown>): QueryConstraint;

    export function endAt(...fieldValues: unknown[]): QueryConstraint;

    export function endBefore(snapshot: DocumentSnapshot<unknown>): QueryConstraint;

    export function endBefore(...fieldValues: unknown[]): QueryConstraint;

    export function getDoc<T>(reference: DocumentReference<T>): Promise<DocumentSnapshot<T>>;

    export function getDocFromCache<T>(reference: DocumentReference<T>): Promise<DocumentSnapshot<T>>;

    export function getDocFromServer<T>(reference: DocumentReference<T>): Promise<DocumentSnapshot<T>>;

    export function getDocs<T>(query: Query<T>): Promise<QuerySnapshot<T>>;

    export function getDocsFromCache<T>(query: Query<T>): Promise<QuerySnapshot<T>>;

    export function getDocsFromServer<T>(query: Query<T>): Promise<QuerySnapshot<T>>;

    export function getFirestore(app?: FirebaseApp): Firestore;

    export function increment(n: number): FieldValue;

    export function initializeFirestore(app: FirebaseApp, settings: FirestoreSettings): Firestore;

    export function limit(limit: number): QueryConstraint;

    export function limitToLast(limit: number): QueryConstraint;

    export function loadBundle(firestore: Firestore, bundleData: ReadableStream<Uint8Array> | ArrayBuffer | string): LoadBundleTask;

    export function namedQuery(firestore: Firestore, name: string): Promise<Query | null>;

    export function onSnapshot<T>(reference: DocumentReference<T>, observer: {
        next?: (snapshot: DocumentSnapshot<T>) => void;
        error?: (error: FirestoreError) => void;
        complete?: () => void;
    }): Unsubscribe;

    export function onSnapshot<T>(reference: DocumentReference<T>, options: SnapshotListenOptions, observer: {
        next?: (snapshot: DocumentSnapshot<T>) => void;
        error?: (error: FirestoreError) => void;
        complete?: () => void;
    }): Unsubscribe;

    export function onSnapshot<T>(reference: DocumentReference<T>, onNext: (snapshot: DocumentSnapshot<T>) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;

    export function onSnapshot<T>(reference: DocumentReference<T>, options: SnapshotListenOptions, onNext: (snapshot: DocumentSnapshot<T>) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;

    export function onSnapshot<T>(query: Query<T>, observer: {
        next?: (snapshot: QuerySnapshot<T>) => void;
        error?: (error: FirestoreError) => void;
        complete?: () => void;
    }): Unsubscribe;

    export function onSnapshot<T>(query: Query<T>, options: SnapshotListenOptions, observer: {
        next?: (snapshot: QuerySnapshot<T>) => void;
        error?: (error: FirestoreError) => void;
        complete?: () => void;
    }): Unsubscribe;

    export function onSnapshot<T>(query: Query<T>, onNext: (snapshot: QuerySnapshot<T>) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;

    export function onSnapshot<T>(query: Query<T>, options: SnapshotListenOptions, onNext: (snapshot: QuerySnapshot<T>) => void, onError?: (error: FirestoreError) => void, onCompletion?: () => void): Unsubscribe;

    export function onSnapshotsInSync(firestore: Firestore, observer: {
        next?: (value: void) => void;
        error?: (error: FirestoreError) => void;
        complete?: () => void;
    }): Unsubscribe;

    export function onSnapshotsInSync(firestore: Firestore, onSync: () => void): Unsubscribe;

    export function orderBy(fieldPath: string | FieldPath, directionStr?: OrderByDirection): QueryConstraint;

    export function query<T>(query: Query<T>, ...queryConstraints: QueryConstraint[]): Query<T>;

    export function queryEqual<T>(left: Query<T>, right: Query<T>): boolean;

    export function refEqual<T>(left: DocumentReference<T> | CollectionReference<T>, right: DocumentReference<T> | CollectionReference<T>): boolean;

    export function runTransaction<T>(firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<T>, options?: TransactionOptions): Promise<T>;

    export function serverTimestamp(): FieldValue;

    export function setDoc<T>(reference: DocumentReference<T>, data: WithFieldValue<T>): Promise<void>;

    export function setDoc<T>(reference: DocumentReference<T>, data: PartialWithFieldValue<T>, options: SetOptions): Promise<void>;

    export function setLogLevel(logLevel: LogLevel): void;

    export function snapshotEqual<T>(left: DocumentSnapshot<T> | QuerySnapshot<T>, right: DocumentSnapshot<T> | QuerySnapshot<T>): boolean;

    export function startAfter(snapshot: DocumentSnapshot<unknown>): QueryConstraint;

    export function startAfter(...fieldValues: unknown[]): QueryConstraint;

    export function startAt(snapshot: DocumentSnapshot<unknown>): QueryConstraint;

    export function startAt(...fieldValues: unknown[]): QueryConstraint;

    export function terminate(firestore: Firestore): Promise<void>;

    export function updateDoc<T>(reference: DocumentReference<T>, data: UpdateData<T>): Promise<void>;

    export function updateDoc(reference: DocumentReference<unknown>, field: string | FieldPath, value: unknown, ...moreFieldsAndValues: unknown[]): Promise<void>;

    export function waitForPendingWrites(firestore: Firestore): Promise<void>;

    export function where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown): QueryConstraint;

    export function writeBatch(firestore: Firestore): WriteBatch;

    export type AddPrefixToKeys<Prefix extends string, T extends Record<string, unknown>> = {
        [K in keyof T & string as `${Prefix}.${K}`]+?: T[K];
    };

    export type ChildUpdateFields<K extends string, V> = V extends Record<string, unknown> ? AddPrefixToKeys<K, UpdateData<V>> : never;

    export type DocumentChangeType = 'added' | 'removed' | 'modified';

    export type FirestoreErrorCode = 'cancelled' | 'unknown' | 'invalid-argument' | 'deadline-exceeded' | 'not-found' | 'already-exists' | 'permission-denied' | 'resource-exhausted' | 'failed-precondition' | 'aborted' | 'out-of-range' | 'unimplemented' | 'internal' | 'unavailable' | 'data-loss' | 'unauthenticated';

    export type NestedUpdateFields<T extends Record<string, unknown>> = UnionToIntersection<{
        [K in keyof T & string]: ChildUpdateFields<K, T[K]>;
    }[keyof T & string]>;

    export type OrderByDirection = 'desc' | 'asc';

    export type PartialWithFieldValue<T> = Partial<T> | (T extends Primitive ? T : T extends {} ? {
        [K in keyof T]?: PartialWithFieldValue<T[K]> | FieldValue;
    } : never);

    export type Primitive = string | number | boolean | undefined | null;

    export type QueryConstraintType = 'where' | 'orderBy' | 'limit' | 'limitToLast' | 'startAt' | 'startAfter' | 'endAt' | 'endBefore';

    export type SetOptions = {
        readonly merge?: boolean;
    } | {
        readonly mergeFields?: Array<string | FieldPath>;
    };

    export type TaskState = 'Error' | 'Running' | 'Success';

    export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

    export type UpdateData<T> = T extends Primitive ? T : T extends {} ? {
        [K in keyof T]?: UpdateData<T[K]> | FieldValue;
    } & NestedUpdateFields<T> : Partial<T>;

    export type WhereFilterOp = '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';

    export type WithFieldValue<T> = T | (T extends Primitive ? T : T extends {} ? {
        [K in keyof T]: WithFieldValue<T[K]> | FieldValue;
    } : never);
}