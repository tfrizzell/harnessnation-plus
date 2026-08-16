export type Paths<T> = {
    [K in keyof T & string]:
    T[K] extends object
    ? K | `${K}.${Paths<T[K]>}`
    : K;
}[keyof T & string];

export type ValueAt<T, P extends string> =
    P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? ValueAt<T[K], Rest>
    : never
    : P extends keyof T
    ? T[P]
    : never;