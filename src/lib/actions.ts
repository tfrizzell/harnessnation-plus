import { Horse, StallionScore } from './horses.js';
import { StudFeeFormula } from './settings.js';

export enum ActionType {
    CalculateStudFee = 'ACTION__CALCULATE_STUD_FEE',
    ClearHorseCache = 'ACTION__CLEAR_HORSE_CACHE',
    GenerateBreedingReport = 'ACTION__GENERATE_BREEDING_REPORT',
    GetHorse = 'ACTION__GET_HORSE',
    GetHorses = 'ACTION__GET_HORSES',
    PreviewStallionScore = 'ACTION__PREVIEW_STALLION_SCORE',
    SaveHorses = 'ACTION__SAVE_HORSES',
    SearchHorses = 'ACTION__SEARCH_HORSES',
    UpdateStallionScores = 'ACTION__UPDATE_STALLION_SCORES',
}

export type BreedingReportData = {
    ids: number[];
    headers?: { [key: number]: string };
}

export type CalculateStudFeeData = {
    id: number;
    formula?: StudFeeFormula
}

export type HorseIdData = {
    id: number;
}

export type HorseSearchData = {
    term: string;
    maxGenerations?: number;
}

export type SendResponse = {
    (data: ActionResponse<any> | ActionError): void;
}

export class Action<T> {
    static [Symbol.hasInstance](instance: any): boolean {
        return instance?.constructor === Action.prototype.constructor || instance?.__type === Action.name;
    }

    public static fromJSON<T>(json: string): Action<T> | null {
        return Action.fromObject(JSON.parse(json));
    }

    public static fromObject<T>(value: any): Action<T> | null {
        return value?.__type !== Action.name ? null : new Action(value.type, value.data);
    }

    public static of<T>(value: any): Action<T> | null {
        if (typeof value === 'string')
            return Action.fromJSON(value);

        if (value?.constructor === Action.prototype.constructor)
            return value;

        return Action.fromObject(value);
    }

    #type: ActionType;
    #data: T;

    public get type(): ActionType {
        return this.#type;
    }

    public get data(): T {
        return this.#data;
    }

    public constructor(type: ActionType.CalculateStudFee, data: CalculateStudFeeData);
    public constructor(type: ActionType.GenerateBreedingReport, data: BreedingReportData);
    public constructor(type: ActionType.GetHorse, data: HorseIdData);
    public constructor(type: ActionType.GetHorses, data: void);
    public constructor(type: ActionType.PreviewStallionScore, data: HorseIdData);
    public constructor(type: ActionType.SaveHorses, data: Horse[]);
    public constructor(type: ActionType.SearchHorses, data: HorseSearchData);
    public constructor(type: ActionType.UpdateStallionScores, data: void);
    public constructor(type: ActionType, data: T);
    public constructor(type: ActionType, data: T) {
        this.#type = type;
        this.#data = data;
    }

    public toJSON(): object {
        return {
            '__type': this.constructor.name,
            'type': this.type,
            'data': this.data,
        };
    }
}

export class ActionError extends Error {
    static [Symbol.hasInstance](instance: any): boolean {
        return instance?.constructor === ActionError.prototype.constructor || instance?.__type === ActionError.name;
    }

    public static fromJSON(json: string): ActionError | null {
        return ActionError.fromObject(JSON.parse(json));
    }

    public static fromObject(value: any): ActionError | null {
        if (value?.__type === ActionError.name) {
            const actionError: ActionError = new ActionError(Action.of(value.action)!, value.message);
            actionError.stack = value.stack;
            return actionError;
        } else
            return null;
    }

    public static of(value: any): ActionError | null {
        if (typeof value === 'string')
            return ActionError.fromJSON(value);

        if (value?.constructor === ActionError.prototype.constructor)
            return value;

        return ActionError.fromObject(value);
    }

    #action: Action<any>;

    public get action(): Action<any> {
        return this.#action;
    }

    public constructor(action: Action<any>);
    public constructor(action: Action<any>, error: Error);
    public constructor(action: Action<any>, message: string);
    public constructor(action: Action<any>, errorOrMessage?: Error | string);
    public constructor(action: Action<any>, errorOrMessage?: Error | string) {
        super((errorOrMessage instanceof Error) ? errorOrMessage.message : errorOrMessage);
        this.#action = action;
        this.name = ActionError.name;
    }

    public toJSON(): object {
        return {
            '__type': this.constructor.name,
            'action': this.action,
            'message': this.message,
            'stack': this.stack,
        };
    }
}

export class ActionResponse<T> {
    static [Symbol.hasInstance](instance: any): boolean {
        return instance?.constructor === ActionResponse.prototype.constructor || instance?.__type === ActionResponse.name;
    }

    public static fromJSON<T>(json: string): ActionResponse<T> | null {
        return ActionResponse.fromObject(JSON.parse(json));
    }

    public static fromObject<T>(value: any): ActionResponse<T> | null {
        return value?.__type !== ActionResponse.name ? null : new ActionResponse(Action.of(value.action)!, value.data);
    }

    public static of<T>(value: any): ActionResponse<T> | null {
        if (typeof value === 'string')
            return ActionResponse.fromJSON(value);

        if (value?.constructor === ActionResponse.prototype.constructor)
            return value;

        return ActionResponse.fromObject(value);
    }

    #action: Action<any>;
    #data: T | undefined;

    public get action(): Action<any> {
        return this.#action;
    }

    public get data(): T | undefined {
        return this.#data;
    }

    public constructor(action: Action<any>, data?: T | undefined) {
        this.#action = action;
        this.#data = data;
    }

    public toJSON(): object {
        return {
            '__type': this.constructor.name,
            'action': this.action,
            'data': this.data,
        };
    }
}

export async function sendAction(type: ActionType.CalculateStudFee, data: CalculateStudFeeData): Promise<ActionResponse<number>>;
export async function sendAction(type: ActionType.GenerateBreedingReport, data: BreedingReportData): Promise<ActionResponse<string>>;
export async function sendAction(type: ActionType.GetHorse, data: HorseIdData): Promise<ActionResponse<Horse>>;
export async function sendAction(type: ActionType.GetHorses): Promise<ActionResponse<Horse[]>>;
export async function sendAction(type: ActionType.PreviewStallionScore, data: HorseIdData): Promise<ActionResponse<StallionScore | null>>;
export async function sendAction(type: ActionType.SaveHorses, data: Horse[]): Promise<ActionResponse<void>>;
export async function sendAction(type: ActionType.SearchHorses, data: HorseSearchData): Promise<ActionResponse<RegExp | string>>;
export async function sendAction(type: ActionType.UpdateStallionScores): Promise<ActionResponse<void>>;
export async function sendAction<T>(type: ActionType, data?: any): Promise<ActionResponse<T>>;
export async function sendAction<T>(type: ActionType, data?: any): Promise<ActionResponse<T>> {
    const response: ActionResponse<T> | ActionError = await chrome.runtime.sendMessage(new Action(type, data));

    if (response instanceof ActionError)
        throw ActionError.fromObject(response);

    return response;
}