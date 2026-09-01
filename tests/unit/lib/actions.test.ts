import { type Mock, describe, expect, it, test } from 'vitest';
import { Action, ActionError, ActionResponse, ActionType, HorseSearchData, sendAction } from '@src/lib/actions';
import { expectInstanceOf } from '@tests/utils';

describe(Action.name, () => {
    const type = ActionType.SearchHorses;
    const data: HorseSearchData = { term: 'Astronomical', maxGenerations: 4 };
    const action = new Action(type, data);
    const actionJson = JSON.stringify(action);
    const actionObj = JSON.parse(actionJson) as Record<string, unknown>;

    it(`correctly constructs new instances`, () => {
        expect(new Action(type, data)).toEqual(action);
    });

    it(`correctly identifies instances`, () => {
        expect(action instanceof Action).toBe(true);
    });

    it(`has the properties 'type' and 'data'`, () => {
        expect(action.type).toBe(type);
        expect(action.data).toEqual(data);
    });

    test(`toJSON() generates a typed JSON object`, () => {
        expect(actionObj.__type).toBe(Action.name);
        expect(actionObj.type).toBe(action.type);
        expect(actionObj.data).toEqual(action.data);
    });

    test(`fromJSON(json) recreates the ${Action.name} instance`, () => {
        const value = Action.fromJSON(actionJson);
        expectInstanceOf(value, Action);
        expect(value.type).toBe(action.type);
        expect(value.data).toEqual(action.data);
    });

    test(`fromObject(object) recreates the ${Action.name} instance`, () => {
        const value = Action.fromObject(actionObj);
        expectInstanceOf(value, Action);
        expect(value.type).toBe(action.type);
        expect(value.data).toEqual(action.data);
    });

    test(`fromObject(object) returns null if it doesn't get an ${Action.name} object`, () => {
        const value = Action.fromObject({});
        expect(value).toBeNull();
    });

    test(`of(${Action.name}) recreates the ${Action.name} instance`, () => {
        const value = Action.of(action);
        expectInstanceOf(value, Action);
        expect(value.type).toBe(action.type);
        expect(value.data).toEqual(action.data);
    });

    test(`of(object) recreates the ${Action.name} instance`, () => {
        const value = Action.of(actionObj);
        expectInstanceOf(value, Action);
        expect(value.type).toBe(action.type);
        expect(value.data).toEqual(action.data);
    });

    test(`of(string) recreates the ${Action.name} instance`, () => {
        const value = Action.of(actionJson);
        expectInstanceOf(value, Action);
        expect(value.type).toBe(action.type);
        expect(value.data).toEqual(action.data);
    });
});

describe(ActionError.name, () => {
    const action = new Action(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 });
    const message = 'Unsupported operation';
    const error = new ActionError(action, message);
    const errorJson = JSON.stringify(error);
    const errorObj = JSON.parse(errorJson) as Record<string, unknown>;

    it(`correctly constructs new instances`, () => {
        expect(new ActionError(action, message)).toEqual(error);
        expect(new ActionError(action, new Error(message))).toEqual(error);
    });

    it(`correctly identifies instances`, () => {
        expect(error instanceof ActionError).toBe(true);
    });

    it(`has the properties 'action', 'message', and 'stack'`, () => {
        expect(error).toBeInstanceOf(ActionError);
        expect(error.action).toEqual(action);
        expect(error.message).toBe(message);
        expect(error.stack).toBeDefined();
    });

    test(`toJSON() generates a typed JSON object`, () => {
        expect(errorObj.__type).toBe(ActionError.name);
        expect(errorObj.action).toEqual(error.action.toJSON());
        expect(errorObj.message).toBe(error.message);
        expect(errorObj.stack).toBe(error.stack);
    });

    test(`fromJSON(json) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.fromJSON(errorJson);
        expectInstanceOf(value, ActionError);
        expect(value.action).toEqual(action);
        expect(value.message).toBe(message);
        expect(value.stack).toBeDefined();
    });

    test(`fromObject(object) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.fromObject(errorObj);
        expectInstanceOf(value, ActionError);
        expect(value.action).toEqual(action);
        expect(value.message).toBe(message);
        expect(value.stack).toBeDefined();
    });

    test(`fromObject(object) returns null if it doesn't get an ${ActionError.name} object`, () => {
        const value = ActionError.fromObject({});
        expect(value).toBeNull();
    });

    test(`of(${ActionError.name}) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.of(error);
        expectInstanceOf(value, ActionError);
        expect(value.action).toEqual(action);
        expect(value.message).toBe(message);
        expect(value.stack).toBeDefined();
    });

    test(`of(object) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.of(errorObj);
        expectInstanceOf(value, ActionError);
        expect(value.action).toEqual(action);
        expect(value.message).toBe(message);
        expect(value.stack).toBeDefined();
    });

    test(`of(string) recreates the ${ActionError.name} instance`, () => {
        const value = ActionError.of(errorJson);
        expectInstanceOf(value, ActionError);
        expect(value.action).toEqual(action);
        expect(value.message).toBe(message);
        expect(value.stack).toBeDefined();
    });
});

describe(ActionResponse.name, () => {
    const action = new Action(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 });
    const data = 'Astronomical';
    const response = new ActionResponse(action, data);
    const responseJson = JSON.stringify(response);
    const responseObj = JSON.parse(responseJson) as Record<string, unknown>;

    it(`correctly constructs new instances`, () => {
        expect(new ActionResponse(action, data)).toEqual(response);
    });

    it(`correctly identifies instances`, () => {
        expect(response instanceof ActionResponse).toBe(true);
    });

    it(`has the properties 'action' and 'data'`, () => {
        expect(response).toBeInstanceOf(ActionResponse);
        expect(response.action).toEqual(action);
        expect(response.data).toEqual(data);
    });

    test(`toJSON() generates a typed JSON object`, () => {
        expect(responseObj.__type).toBe(ActionResponse.name);
        expect(responseObj.action).toEqual(response.action.toJSON());
        expect(responseObj.data).toEqual(response.data);
    });

    test(`fromJSON(json) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.fromJSON(responseJson);
        expectInstanceOf(value, ActionResponse);
        expect(value.action).toEqual(response.action);
        expect(value.data).toEqual(response.data);
    });

    test(`fromObject(object) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.fromObject(responseObj);
        expectInstanceOf(value, ActionResponse);
        expect(value.action).toEqual(response.action);
        expect(value.data).toEqual(response.data);
    });

    test(`fromObject(object) returns null if it doesn't get an ${ActionResponse.name} object`, () => {
        const value = ActionResponse.fromObject({});
        expect(value).toBeNull();
    });

    test(`of(${ActionError.name}) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.of(response);
        expectInstanceOf(value, ActionResponse);
        expect(value.action).toEqual(response.action);
        expect(value.data).toEqual(response.data);
    });

    test(`of(object) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.of(responseObj);
        expectInstanceOf(value, ActionResponse);
        expect(value.action).toEqual(response.action);
        expect(value.data).toEqual(response.data);
    });

    test(`of(string) recreates the ${ActionResponse.name} instance`, () => {
        const value = ActionResponse.of(responseJson);
        expectInstanceOf(value, ActionResponse);
        expect(value.action).toEqual(response.action);
        expect(value.data).toEqual(response.data);
    });
});

describe(sendAction.name, () => {
    it(`resolves with an ${ActionResponse.name}`, async () => {
        const sendMessageMock = chrome.runtime.sendMessage as Mock;

        sendMessageMock.mockImplementation(
            (
                action: Action<ActionType.SearchHorses>
            ): Promise<ActionResponse<ActionType.SearchHorses>> => {
                const _action = Action.of(action);
                expectInstanceOf(_action, Action);
                return Promise.resolve(new ActionResponse<ActionType.SearchHorses>(_action, 'Astronomical'));
            }
        );

        try {
            await expect(sendAction(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 })).resolves.toBeInstanceOf(ActionResponse);
        } finally {
            sendMessageMock.mockRestore();
        }
    });

    it(`rejects with an ${ActionError.name}`, async () => {
        const sendMessageMock = chrome.runtime.sendMessage as Mock;

        sendMessageMock.mockImplementation(
            (action: unknown): Promise<ActionError> => {
                const _action = Action.of(action);
                expectInstanceOf(_action, Action);
                return Promise.resolve(new ActionError(_action, 'Invalid action'));
            }
        );

        try {
            await expect(sendAction(ActionType.SearchHorses, { term: 'Astronomical', maxGenerations: 4 })).rejects.toBeInstanceOf(ActionError);
        } finally {
            sendMessageMock.mockRestore();
        }
    });
});