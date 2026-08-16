import { Horse } from './horses.js';
import { StudFeeFormula } from './settings.js';
import { StallionScore } from './stallion-scores.js';

type ActionData<T extends ActionType> = [ActionDataMap[T]] extends [undefined]
    ? []
    : [data: ActionDataMap[T]];

export interface ActionDataMap {
    [ActionType.CalculateStudFee]: CalculateStudFeeData;
    [ActionType.ClearHorseCache]: undefined;
    [ActionType.GenerateBroodmareReport]: BreedingReportData;
    [ActionType.GeneratePedigreeCatalog]: PedigreeCatalogData;
    [ActionType.GenerateStallionReport]: BreedingReportData;
    [ActionType.GetHorse]: HorseIdData;
    [ActionType.GetHorses]: undefined;
    [ActionType.PreviewStallionScore]: HorseIdData;
    [ActionType.SaveHorses]: Array<Horse>;
    [ActionType.SearchHorses]: HorseSearchData;
    [ActionType.UpdateStallionScores]: undefined;
}

type ActionErrorObject = {
    __type: typeof ActionError.name;
    action: ActionObjectUnion;
    message: string;
    stack?: string;
};

type ActionObject<T extends ActionType> = {
    __type: typeof Action.name;
    type: T;
    data: ActionDataMap[T]
};

export type ActionObjectUnion = {
    [T in ActionType]: ActionObject<T>
}[ActionType];

type ActionResponseData<T extends ActionType> = [ActionResponseMap[T]] extends [undefined]
    ? []
    : [data: ActionResponseMap[T]];

type ActionResponseObject<T extends ActionType> = {
    __type: typeof ActionResponse.name;
    action: ActionObject<T>;
    data: ActionResponseMap[T]
};

export interface ActionResponseMap {
    [ActionType.CalculateStudFee]: number;
    [ActionType.ClearHorseCache]: undefined;
    [ActionType.GenerateBroodmareReport]: undefined;
    [ActionType.GeneratePedigreeCatalog]: undefined;
    [ActionType.GenerateStallionReport]: undefined;
    [ActionType.GetHorse]: Horse | undefined;
    [ActionType.GetHorses]: Array<Horse>;
    [ActionType.PreviewStallionScore]: StallionScore | null;
    [ActionType.SaveHorses]: undefined;
    [ActionType.SearchHorses]: RegExp | string;
    [ActionType.UpdateStallionScores]: undefined;
}

export type ActionResponseUnion = {
    [T in ActionType]: ActionResponse<T>
}[ActionType];

export enum ActionType {
    CalculateStudFee = 'ACTION__CALCULATE_STUD_FEE',
    ClearHorseCache = 'ACTION__CLEAR_HORSE_CACHE',
    GenerateBroodmareReport = 'ACTION__GENERATE_BROODMARE_REPORT',
    GeneratePedigreeCatalog = 'ACTION__GENERATE_PEDIGREE_CATALOG',
    GenerateStallionReport = 'ACTION__GENERATE_STALLION_REPORT',
    GetHorse = 'ACTION__GET_HORSE',
    GetHorses = 'ACTION__GET_HORSES',
    PreviewStallionScore = 'ACTION__PREVIEW_STALLION_SCORE',
    SaveHorses = 'ACTION__SAVE_HORSES',
    SearchHorses = 'ACTION__SEARCH_HORSES',
    UpdateStallionScores = 'ACTION__UPDATE_STALLION_SCORES',
}

type ActionUnion = {
    [T in ActionType]: Action<T>
}[ActionType];

export interface BreedingReportData {
    ids: Array<number>;
    headers?: { [key: number]: string };
    filename?: string;
    mode?: BreedingReportMode;
}

export type BreedingReportMode = 'default' | 'enhanced';

export interface CalculateStudFeeData {
    id: number;
    formula?: StudFeeFormula
}

export interface HorseIdData {
    id: number;
}

export interface HorseSearchData {
    term: string;
    maxGenerations?: number;
}

export interface PedigreeCatalogData {
    data: Array<number | [number, string | number]>;
    showHipNumbers?: boolean;
    fullPedigrees?: boolean;
    filename?: string;
}

function isAction(value: unknown): value is ActionUnion {
    return value instanceof Action;
}

function isActionError(value: unknown): value is ActionError {
    return value instanceof ActionError;
}

function isActionResponse(value: unknown): value is ActionResponseUnion {
    return value instanceof ActionResponse;
}

function isActionType(value: unknown): value is ActionType {
    return Object.values(ActionType).includes(value as ActionType);
}

export class Action<T extends ActionType> {
    public static fromJSON(json: string): ActionUnion | null {
        return Action.fromObject(JSON.parse(json));
    }

    public static fromObject(value: unknown): ActionUnion | null {
        if (typeof value != 'object' || value == null)
            return null;

        const object = value as Record<string, unknown>;

        if (object.__type !== Action.name || !isActionType(object.type))
            return null;

        switch (object.type) {
            case ActionType.CalculateStudFee:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.CalculateStudFee]
                );

            case ActionType.ClearHorseCache:
                return new Action(object.type);

            case ActionType.GenerateBroodmareReport:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.GenerateBroodmareReport]
                );

            case ActionType.GeneratePedigreeCatalog:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.GeneratePedigreeCatalog]
                );

            case ActionType.GenerateStallionReport:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.GenerateStallionReport]
                );

            case ActionType.GetHorse:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.GetHorse]
                );

            case ActionType.GetHorses:
                return new Action(object.type);

            case ActionType.PreviewStallionScore:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.PreviewStallionScore]
                );

            case ActionType.SaveHorses:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.SaveHorses]
                );

            case ActionType.SearchHorses:
                return new Action(
                    object.type,
                    object.data as ActionDataMap[ActionType.SearchHorses]
                );

            case ActionType.UpdateStallionScores:
                return new Action(object.type);

            default:
                return null;
        }
    }

    public static of(value: unknown): ActionUnion | null {
        if (isAction(value))
            return value;

        if (typeof value === 'string')
            return Action.fromJSON(value);

        return Action.fromObject(value);
    }

    #type: T;
    #data: ActionDataMap[T];

    public get type(): T {
        return this.#type;
    }

    public get data(): ActionDataMap[T] {
        return this.#data;
    }

    public constructor(type: T, ...data: ActionData<T>) {
        this.#type = type;
        this.#data = data[0] as ActionDataMap[T];
    }

    public toJSON(): ActionObject<T> {
        return {
            '__type': this.constructor.name,
            'type': this.type,
            data: this.data
        };
    }
}

export class ActionError extends Error {
    public static fromJSON(json: string): ActionError | null {
        return ActionError.fromObject(JSON.parse(json));
    }

    public static fromObject(value: unknown): ActionError | null {
        if (typeof value != 'object' || value == null)
            return null;

        const object = value as Record<string, unknown>;

        if (object.__type !== ActionError.name)
            return null;

        const action = Action.of(object.action);

        if (action == null)
            return null;

        const actionError = new ActionError(
            action,
            object.message as string | Error | undefined
        );

        if (typeof object.stack === 'string')
            actionError.stack = object.stack;

        return actionError;
    }

    public static of(value: unknown): ActionError | null {
        if (isActionError(value)) {
            const action = Action.of(value.action);

            if (action == null)
                return null;

            const error = new ActionError(action, value.message);

            if (value.stack)
                error.stack = value.stack;

            return error;
        }

        if (typeof value === 'string')
            return ActionError.fromJSON(value);

        return ActionError.fromObject(value);
    }

    #action: ActionUnion;

    public get action(): ActionUnion {
        return this.#action;
    }

    public constructor(action: ActionUnion, errorOrMessage?: Error | string) {
        super(errorOrMessage instanceof Error ? errorOrMessage.message : errorOrMessage);
        this.#action = action;
        this.name = ActionError.name;
    }

    public toJSON(): ActionErrorObject {
        return {
            '__type': this.constructor.name,
            'action': this.action.toJSON(),
            'message': this.message,
            'stack': this.stack,
        };
    }
}

export class ActionResponse<T extends ActionType> {
    public static fromJSON(json: string): ActionResponseUnion | null {
        return ActionResponse.fromObject(JSON.parse(json));
    }

    public static fromObject(value: unknown): ActionResponseUnion | null {
        if (typeof value != 'object' || value == null)
            return null;

        const object = value as Record<string, unknown>;

        if (object.__type !== ActionResponse.name)
            return null;

        const action = Action.of(object.action);

        if (action == null)
            return null;

        switch (action.type) {
            case ActionType.CalculateStudFee:
                return new ActionResponse(
                    action,
                    object.data as ActionResponseMap[ActionType.CalculateStudFee]
                );

            case ActionType.ClearHorseCache:
                return new ActionResponse(action);

            case ActionType.GenerateBroodmareReport:
                return new ActionResponse(action);

            case ActionType.GeneratePedigreeCatalog:
                return new ActionResponse(action);

            case ActionType.GenerateStallionReport:
                return new ActionResponse(action);

            case ActionType.GetHorse:
                return new ActionResponse(
                    action,
                    object.data as ActionResponseMap[ActionType.GetHorse]
                );

            case ActionType.GetHorses:
                return new ActionResponse(
                    action,
                    object.data as ActionResponseMap[ActionType.GetHorses]
                );

            case ActionType.PreviewStallionScore:
                return new ActionResponse(
                    action,
                    object.data as ActionResponseMap[ActionType.PreviewStallionScore]
                );

            case ActionType.SaveHorses:
                return new ActionResponse(action);

            case ActionType.SearchHorses:
                return new ActionResponse(
                    action,
                    object.data as ActionResponseMap[ActionType.SearchHorses]
                );

            case ActionType.UpdateStallionScores:
                return new ActionResponse(action);

            default:
                return null;
        }
    }

    public static of(value: unknown): ActionResponseUnion | null {
        if (isActionResponse(value)) {
            const action = Action.of(value.action);

            if (action == null)
                return null;

            return ActionResponse.fromObject({
                __type: ActionResponse.name,
                action,
                data: value.data,
            });
        }

        if (typeof value === 'string')
            return ActionResponse.fromJSON(value);

        return ActionResponse.fromObject(value);
    }

    #action: Action<T>;
    #data: ActionResponseMap[T];

    public get action(): Action<T> {
        return this.#action;
    }

    public get data(): ActionResponseMap[T] {
        return this.#data;
    }

    public constructor(action: Action<T>, ...data: ActionResponseData<T>) {
        this.#action = action;
        this.#data = data[0] as ActionResponseMap[T];
    }

    public toJSON(): ActionResponseObject<T> {
        return {
            '__type': this.constructor.name,
            'action': this.action.toJSON(),
            'data': this.data,
        };
    }
}

export async function sendAction<T extends ActionType>(
    type: T,
    ...data: ActionData<T>
): Promise<ActionResponse<T>> {
    const response = await chrome.runtime.sendMessage<
        ActionObject<T>,
        ActionResponseObject<T> | ActionErrorObject
    >(new Action(type, ...data).toJSON());

    const actionError = ActionError.of(response);
    console.log(response);

    if (actionError != null)
        throw actionError;

    const actionResponse = ActionResponse.of(response);

    if (actionResponse == null || actionResponse.action.type !== type)
        throw new Error(`Invalid response to action ${type}`);

    return actionResponse as ActionResponse<T>;
}