import { describe, expect, it } from 'vitest';
import { TaskQueue } from '@src/lib/task-queue';

describe(`TaskQueue`, () => {
    describe(`add`, () => {
        it(`executes a queued task`, async () => {
            const tq = new TaskQueue(1);
            const result = await tq.add(() => Promise.resolve('Hello World'));
            expect(result).toBe('Hello World');
        });

        it(`limits concurrent execution`, async () => {
            const tq = new TaskQueue(2);
            let running = 0;
            let maxRunning = 0;

            const task = async () => {
                running++;
                maxRunning = Math.max(maxRunning, running);
                await new Promise(r => setTimeout(r, 20));
                running--;
            };

            await Promise.all(Array(10).fill(0).map(() => tq.add(task)));
            expect(maxRunning).toBe(2);
        });

        it(`starts tasks in FIFO order`, async () => {
            const tq = new TaskQueue(1);
            const order: Array<number> = [];

            await Promise.all(Array(3).fill(0).map((_, i) => tq.add(() => {
                order.push(i);
                return Promise.resolve();
            })));

            expect(order).toEqual([0, 1, 2]);
        });

        it(`propagates rejections`, async () => {
            const tq = new TaskQueue(1);

            await expect(tq.add(() => {
                throw new Error('Async Error');
            })).rejects.toThrow('Async Error');
        });

        it(`handles synchronously thrown rejectsion`, async () => {
            const tq = new TaskQueue(1);

            await expect(tq.add(() => {
                throw new Error('Sync Error');
            })).rejects.toThrow('Sync Error');
        });

        it(`continues after a rejection`, async () => {
            const tq = new TaskQueue(1);
            const results: Array<number> = [];

            await Promise.allSettled([
                tq.add(() => {
                    throw new Error();
                }),
                tq.add(() => {
                    results.push(1);
                    return Promise.resolve();
                }),
            ]);

            expect(results).toEqual([1]);
        });
    });

    describe(`onIdle`, () => {
        it(`resolves immediately if the queue is empty`, async () => {
            const tq = new TaskQueue(1);
            await expect(tq.onIdle()).resolves.toBeUndefined();
        });

        it(`supports multiple callers`, async () => {
            const tq = new TaskQueue(1);

            void tq.add(async () => {
                await new Promise(r => setTimeout(r, 10));
            });

            await Promise.all([
                tq.onIdle(),
                tq.onIdle(),
                tq.onIdle(),
            ]);
        });
    });
});