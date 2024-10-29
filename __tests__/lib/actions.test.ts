import { Action, ActionError, ActionResponse, ActionType, HorseSearchData, sendAction } from '../../src/lib/actions';

afterAll(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
});

describe(`ActionType`, () => {
    test(`exists`, () => {
        expect(ActionType).not.toBeUndefined();
    });
});

describe(Action.name, () => {
    const type = ActionType.SearchHorses;
    const data: HorseSearchData = { term: 'Astronomical', maxGenerations: 4 };
    const action = new Action<HorseSearchData>(type, data);
    const actionJson = JSON.stringify(action);
    const actionObj = JSON.parse(actionJson);

    test(`exists`, () => {
        expect(Action).not.toBeUndefined();
    });

    test(`is a class`, () => {
        expect(typeof Action).toBe('function');
        expect(typeof Action.constructor).toBe('function');
    });

    test(`correctly constructs new instances`, () => {
        expect(new Action<HorseSearchData>(type, data)).toEqual(action);
    });

    test(`correctly identifies instances`, () => {
        expect(action instanceof Action).toBe(true);
        expect({ __type: Action.name } instanceof Action).toBe(true);
    });

    test(`has the properties 'type' and 'data'`, () => {
        expect(action).toHaveProperty('type');
        expect(action.type).toBe(type);

        expect(action).toHaveProperty('data');
        expect(action.data).toEqual(data);
    });

    test(`toJSON generates a typed JSON object`, () => {
        expect(actionObj).toHaveProperty('__type');
        expect(actionObj.__type).toBe(Action.name);

        expect(actionObj).toHaveProperty('type');
        expect(actionObj.type).toBe(action.type);

        expect(actionObj).toHaveProperty('data');
        expect(actionObj.data).toEqual(action.data);
    });

    test(`fromJSON recreates the ${Action.name} instance`, () => {
        const value = Action.fromJSON<HorseSearchData>(actionJson);
        expect(value).toBeInstanceOf(Action);

        expect(value).toHaveProperty('type');
        expect(value!.type).toBe(action.type);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(action.data);
    });

    test(`fromObject recreates the ${Action.name} instance`, () => {
        const value = Action.fromObject<HorseSearchData>(actionObj);
        expect(value).toBeInstanceOf(Action);

        expect(value).toHaveProperty('type');
        expect(value!.type).toBe(action.type);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(action.data);
    });

    test(`fromObject returns null if it doesn't get an ${Action.name} object`, () => {
        const value = Action.fromObject<HorseSearchData>({});
        expect(value).toBeNull();
    });

    test(`of(${Action.name}) recreates the ${Action.name} instance`, () => {
        const value = Action.of<HorseSearchData>(action);
        expect(value).toBeInstanceOf(Action);

        expect(value).toHaveProperty('type');
        expect(value!.type).toBe(action.type);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(action.data);
    });

    test(`of(object) recreates the ${Action.name} instance`, () => {
        const value = Action.of<HorseSearchData>(actionObj);
        expect(value).toBeInstanceOf(Action);

        expect(value).toHaveProperty('type');
        expect(value!.type).toBe(action.type);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(action.data);
    });

    test(`of(string) recreates the ${Action.name} instance`, () => {
        const value = Action.of<HorseSearchData>(actionJson);
        expect(value).toBeInstanceOf(Action);

        expect(value).toHaveProperty('type');
        expect(value!.type).toBe(action.type);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(action.data);
    });
});

describe(ActionError.name, () => {
    const action = new Action<HorseSearchData>(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 });
    const message = 'Unsupported operation';
    const error = new ActionError(action, message);
    const errorJson = JSON.stringify(error);
    const errorObj = JSON.parse(errorJson);

    test(`exists`, () => {
        expect(ActionError).not.toBeUndefined();
    });

    test(`is a class`, () => {
        expect(typeof ActionError).toBe('function');
        expect(typeof ActionError.constructor).toBe('function');
    });

    test(`correctly constructs new instances`, () => {
        expect(new ActionError(action, message)).toEqual(error);
        expect(new ActionError(action, new Error(message))).toEqual(error);
    });

    test(`correctly identifies instances`, () => {
        expect(error instanceof ActionError).toBe(true);
        expect({ __type: ActionError.name } instanceof ActionError).toBe(true);
    });

    test(`has the properties 'action', 'message', and 'stack'`, () => {
        expect(error).toBeInstanceOf(ActionError);

        expect(error).toHaveProperty('action');
        expect(error.action).toEqual(action);

        expect(error).toHaveProperty('message');
        expect(error.message).toBe(message);

        expect(error).toHaveProperty('stack');
        expect(error.stack).toBeDefined();
    });

    test(`toJSON generates a typed JSON object`, () => {
        expect(errorObj).toHaveProperty('__type');
        expect(errorObj.__type).toBe(ActionError.name);

        expect(errorObj).toHaveProperty('action');
        expect(errorObj.action).toEqual(error.action.toJSON());

        expect(errorObj).toHaveProperty('message');
        expect(errorObj.message).toBe(error.message);

        expect(errorObj).toHaveProperty('stack');
        expect(errorObj.stack).toBe(error.stack);
    });

    test(`fromJSON recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.fromJSON(errorJson);
        expect(value).toBeInstanceOf(ActionError);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(action);

        expect(value).toHaveProperty('message');
        expect(value!.message).toBe(message);

        expect(value).toHaveProperty('stack');
        expect(value!.stack).toBeDefined();
    });

    test(`fromObject recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.fromObject(errorObj);
        expect(value).toBeInstanceOf(ActionError);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(action);

        expect(value).toHaveProperty('message');
        expect(value!.message).toBe(message);

        expect(value).toHaveProperty('stack');
        expect(value!.stack).toBeDefined();
    });

    test(`fromObject returns null if it doesn't get an ${ActionError.name} object`, () => {
        const value = ActionError.fromObject({});
        expect(value).toBeNull();
    });

    test(`of(${ActionError.name}) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.of(error);
        expect(value).toBeInstanceOf(ActionError);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(action);

        expect(value).toHaveProperty('message');
        expect(value!.message).toBe(message);

        expect(value).toHaveProperty('stack');
        expect(value!.stack).toBeDefined();
    });

    test(`of(object) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.of(errorObj);
        expect(value).toBeInstanceOf(ActionError);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(action);

        expect(value).toHaveProperty('message');
        expect(value!.message).toBe(message);

        expect(value).toHaveProperty('stack');
        expect(value!.stack).toBeDefined();
    });

    test(`of(string) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.of(errorJson);
        expect(value).toBeInstanceOf(ActionError);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(action);

        expect(value).toHaveProperty('message');
        expect(value!.message).toBe(message);

        expect(value).toHaveProperty('stack');
        expect(value!.stack).toBeDefined();
    });
});

describe(ActionResponse.name, () => {
    const action = new Action<HorseSearchData>(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 });
    const data = 'Astronomical';
    const response = new ActionResponse<RegExp | string>(action, data);
    const responseJson = JSON.stringify(response);
    const responseObj: any = JSON.parse(responseJson);

    test(`exists`, () => {
        expect(ActionResponse).not.toBeUndefined();
    });

    test(`is a class`, () => {
        expect(typeof ActionResponse).toBe('function');
        expect(typeof ActionResponse.constructor).toBe('function');
    });

    test(`correctly constructs new instances`, () => {
        expect(new ActionResponse<RegExp | string>(action, data)).toEqual(response);
    });

    test(`correctly identifies instances`, () => {
        expect(response instanceof ActionResponse).toBe(true);
        expect({ __type: ActionResponse.name } instanceof ActionResponse).toBe(true);
    });

    test(`has the properties 'action' and 'data'`, () => {
        expect(response).toBeInstanceOf(ActionResponse);

        expect(response).toHaveProperty('action');
        expect(response.action).toEqual(action);

        expect(response).toHaveProperty('data');
        expect(response.data).toEqual(data);
    });

    test(`toJSON generates a typed JSON object`, () => {
        expect(responseObj).toHaveProperty('__type');
        expect(responseObj.__type).toBe(ActionResponse.name);

        expect(responseObj).toHaveProperty('action');
        expect(responseObj.action).toEqual(response.action.toJSON());

        expect(responseObj).toHaveProperty('data');
        expect(responseObj.data).toEqual(response.data);
    });

    test(`fromJSON recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.fromJSON<RegExp | string>(responseJson);
        expect(value).toBeInstanceOf(ActionResponse);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(response.action);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(response.data);
    });

    test(`fromObject recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.fromObject<RegExp | string>(responseObj);
        expect(value).toBeInstanceOf(ActionResponse);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(response.action);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(response.data);
    });

    test(`fromObject returns null if it doesn't get an ${ActionResponse.name} object`, () => {
        const value = ActionResponse.fromObject<RegExp | string>({});
        expect(value).toBeNull();
    });

    test(`of(${ActionError.name}) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.of<RegExp | string>(response);
        expect(value).toBeInstanceOf(ActionResponse);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(response.action);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(response.data);
    });

    test(`of(object) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.of<RegExp | string>(responseObj);
        expect(value).toBeInstanceOf(ActionResponse);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(response.action);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(response.data);
    });

    test(`of(string) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.of<RegExp | string>(responseJson);
        expect(value).toBeInstanceOf(ActionResponse);

        expect(value).toHaveProperty('action');
        expect(value!.action).toEqual(response.action);

        expect(value).toHaveProperty('data');
        expect(value!.data).toEqual(response.data);
    });
});

describe(sendAction.name, () => {
    test(`exists`, () => {
        expect(sendAction).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof sendAction).toBe('function');
    });

    test(`returns a promise`, () => {
        expect(sendAction(ActionType.SearchHorses)).toBeInstanceOf(Promise);
    });

    test(`resolves with an ${ActionResponse.name}`, async () => {
        global.chrome.runtime.sendMessage = jest.fn((action: any): Promise<ActionResponse<RegExp | string>> => {
            return Promise.resolve(new ActionResponse<RegExp | string>(Action.of<HorseSearchData>(action)!, 'Astronomical'))
        });

        try {
            await expect(sendAction(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 })).resolves.toBeInstanceOf(ActionResponse);
        } finally {
            (<jest.Mock>global.chrome.runtime.sendMessage).mockClear();
        }
    });

    test(`rejects with an ${ActionError.name}`, async () => {
        global.chrome.runtime.sendMessage = jest.fn((action: any): Promise<ActionError> => {
            return Promise.resolve(new ActionError(Action.of<HorseSearchData>(action)!, 'Invalid action'));
        });

        try {
            await expect(sendAction(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 })).rejects.toBeInstanceOf(ActionError);
        } finally {
            (<jest.Mock>global.chrome.runtime.sendMessage).mockClear();
        }
    });
});