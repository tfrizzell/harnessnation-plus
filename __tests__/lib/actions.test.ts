import { Action, ActionError, ActionResponse, ActionType, HorseSearchData, sendAction } from '../../src/lib/actions';

describe(`ActionType`, (): void => {
    test(`exists`, (): void => {
        expect(ActionType).not.toBeUndefined();
    });
});

describe(Action.name, (): void => {
    const type: ActionType = ActionType.SearchHorses;
    const data: HorseSearchData = { term: 'Astronomical', maxGenerations: 4 };
    const action: Action<HorseSearchData> = new Action(type, data);
    const json: string = JSON.stringify(action);
    const jsonObject: any = JSON.parse(json);
    const jAction: Action<HorseSearchData> | null = Action.fromJSON(json);
    const oAction: Action<HorseSearchData> | null = Action.fromObject(jsonObject);

    test(`exists`, (): void => {
        expect(Action).not.toBeUndefined();
    });

    test(`is a class`, (): void => {
        expect(typeof Action).toEqual('function');
        expect(typeof Action.constructor).toEqual('function');
    });

    test(`has the properties 'type' and 'data'`, (): void => {
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(type);

        expect(action).toHaveProperty('data');
        expect(action.data).toEqual(data);
    });

    test(`toJSON generates a typed JSON object`, (): void => {
        expect(jsonObject).toHaveProperty('__type');
        expect(jsonObject.__type).toEqual(Action.name);

        expect(jsonObject).toHaveProperty('type');
        expect(jsonObject.type).toEqual(action.type);

        expect(jsonObject).toHaveProperty('data');
        expect(jsonObject.data).toEqual(action.data);
    });

    test(`fromJSON recreates the ${Action.name} instance`, (): void => {
        expect(jAction).toBeInstanceOf(Action);

        expect(jAction).toHaveProperty('type');
        expect(jAction!.type).toEqual(action.type);

        expect(jAction).toHaveProperty('data');
        expect(jAction!.data).toEqual(action.data);
    });

    test(`fromObject recreates the ${Action.name} instance`, (): void => {
        expect(oAction).toBeInstanceOf(Action);

        expect(oAction).toHaveProperty('type');
        expect(oAction!.type).toEqual(action.type);

        expect(oAction).toHaveProperty('data');
        expect(oAction!.data).toEqual(action.data);
    });
});

describe(ActionError.name, (): void => {
    const action: Action<HorseSearchData> = new Action(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 });
    const message: string = 'Unsupported operation';
    const error: ActionError = new ActionError(action, message);
    const json: string = JSON.stringify(error);
    const jsonObject: any = JSON.parse(json);
    const errorFromJson: ActionError | null = ActionError.fromJSON(json);
    const errorFromObject: ActionError | null = ActionError.fromObject(jsonObject);

    test(`exists`, (): void => {
        expect(ActionError).not.toBeUndefined();
    });

    test(`is a class`, (): void => {
        expect(typeof ActionError).toEqual('function');
        expect(typeof ActionError.constructor).toEqual('function');
    });

    test(`has the properties 'action', 'message', and 'stack'`, (): void => {
        expect(error).toBeInstanceOf(ActionError);

        expect(error).toHaveProperty('action');
        expect(error.action).toEqual(action);

        expect(error).toHaveProperty('message');
        expect(error.message).toEqual(message);

        expect(error).toHaveProperty('stack');
        expect(error.stack).toBeDefined();
    });

    test(`toJSON generates a typed JSON object`, (): void => {
        expect(jsonObject).toHaveProperty('__type');
        expect(jsonObject.__type).toEqual(ActionError.name);

        expect(jsonObject).toHaveProperty('action');
        expect(jsonObject.action).toEqual(error.action.toJSON());

        expect(jsonObject).toHaveProperty('message');
        expect(jsonObject.message).toEqual(error.message);

        expect(jsonObject).toHaveProperty('stack');
        expect(jsonObject.stack).toEqual(error.stack);
    });

    test(`fromJSON recreates the ${ActionError.name} instance`, (): void => {
        expect(errorFromJson).toBeInstanceOf(ActionError);

        expect(errorFromJson).toHaveProperty('action');
        expect(errorFromJson!.action).toEqual(error.action);

        expect(errorFromJson).toHaveProperty('message');
        expect(errorFromJson!.message).toEqual(error.message);

        expect(errorFromJson).toHaveProperty('stack');
        expect(errorFromJson!.stack).toEqual(error.stack);
    });

    test(`fromObject recreates the ${ActionError.name} instance`, (): void => {
        expect(errorFromObject).toBeInstanceOf(ActionError);

        expect(errorFromObject).toHaveProperty('action');
        expect(errorFromObject!.action).toEqual(error.action);

        expect(errorFromObject).toHaveProperty('message');
        expect(errorFromObject!.message).toEqual(error.message);

        expect(errorFromObject).toHaveProperty('stack');
        expect(errorFromObject!.stack).toEqual(error.stack);
    });
});

describe(`ActionResponse`, (): void => {
    const action: Action<HorseSearchData> = new Action(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 });
    const data: RegExp | string = 'Astronomical';
    const response: ActionResponse<RegExp | string> = new ActionResponse(action, data);
    const json: string = JSON.stringify(response);
    const jsonObject: any = JSON.parse(json);
    const responseFromJson: ActionResponse<RegExp | string> | null = ActionResponse.fromJSON(json);
    const responseFromObject: ActionResponse<RegExp | string> | null = ActionResponse.fromObject(jsonObject);

    test(`exists`, (): void => {
        expect(ActionResponse).not.toBeUndefined();
    });

    test(`is a class`, (): void => {
        expect(typeof ActionResponse).toEqual('function');
        expect(typeof ActionResponse.constructor).toEqual('function');
    });

    test(`has the properties 'action' and 'data'`, (): void => {
        expect(response).toBeInstanceOf(ActionResponse);

        expect(response).toHaveProperty('action');
        expect(response.action).toEqual(action);

        expect(response).toHaveProperty('data');
        expect(response.data).toEqual(data);
    });

    test(`toJSON generates a typed JSON object`, (): void => {
        expect(jsonObject).toHaveProperty('__type');
        expect(jsonObject.__type).toEqual(ActionResponse.name);

        expect(jsonObject).toHaveProperty('action');
        expect(jsonObject.action).toEqual(response.action.toJSON());

        expect(jsonObject).toHaveProperty('data');
        expect(jsonObject.data).toEqual(response.data);
    });

    test(`fromJSON recreates the ${ActionResponse.name} instance`, (): void => {
        expect(responseFromJson).toBeInstanceOf(ActionResponse);

        expect(responseFromJson).toHaveProperty('action');
        expect(responseFromJson!.action).toEqual(response.action);

        expect(responseFromJson).toHaveProperty('data');
        expect(responseFromJson!.data).toEqual(response.data);
    });

    test(`fromObject recreates the ${ActionResponse.name} instance`, (): void => {
        expect(responseFromObject).toBeInstanceOf(ActionResponse);

        expect(responseFromObject).toHaveProperty('action');
        expect(responseFromObject!.action).toEqual(response.action);

        expect(responseFromObject).toHaveProperty('data');
        expect(responseFromObject!.data).toEqual(response.data);
    });
});

describe(`sendAction`, (): void => {
    test(`exists`, (): void => {
        expect(sendAction).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof sendAction).toEqual('function');
    });

    test(`returns a promise`, (): void => {
        expect(sendAction(ActionType.SearchHorses)).toBeInstanceOf(Promise);
    });
});