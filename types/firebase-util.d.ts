/// <see cref="https://github.com/firebase/firebase-js-sdk/blob/master/packages/util/src/emulator.ts" />
declare module '@firebase/util' {
    export type FirebaseSignInProvider =
        | 'custom'
        | 'email'
        | 'password'
        | 'phone'
        | 'anonymous'
        | 'google.com'
        | 'facebook.com'
        | 'github.com'
        | 'twitter.com'
        | 'microsoft.com'
        | 'apple.com';

    interface FirebaseIdToken {
        iss: string;
        aud: string;
        sub: string;
        iat: number;
        exp: number;
        user_id: string;
        auth_time: number;
        provider_id?: 'anonymous';
        email?: string;
        email_verified?: boolean;
        phone_number?: string;
        name?: string;
        picture?: string;
        firebase: {
            sign_in_provider: FirebaseSignInProvider;
            identities?: { [provider in FirebaseSignInProvider]?: string[] };
        };
        [claim: string]: unknown;
        uid?: never;
    }

    export type EmulatorMockTokenOptions = ({ user_id: string } | { sub: string }) &
        Partial<FirebaseIdToken>;
}

/// <see cref="https://github.com/firebase/firebase-js-sdk/blob/master/packages/util/src/errors.ts" />
declare module '@firebase/util' {
    export type ErrorMap<ErrorCode extends string> = {
        readonly [K in ErrorCode]: string;
    };

    export interface ErrorData {
        [key: string]: unknown;
    }

    export class FirebaseError extends Error {
        readonly name: string;

        constructor(
            code: string,
            message: string,
            customData?: Record<string, unknown>
        );
    }

    export class ErrorFactory<
        ErrorCode extends string,
        ErrorParams extends { readonly [K in ErrorCode]?: ErrorData } = {}
        > {
        constructor(
            service: string,
            serviceName: string,
            errors: ErrorMap<ErrorCode>
        );

        create<K extends ErrorCode>(
            code: K,
            ...data: K extends keyof ErrorParams ? [ErrorParams[K]] : []
        ): FirebaseError;
    }
}
