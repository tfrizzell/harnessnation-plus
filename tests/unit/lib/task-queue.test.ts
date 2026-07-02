import { TaskQueue } from "@src/lib/task-queue";

describe(`TaskQueue`, () => {
    describe(`add`, () => {
        it(`executes a queued task`, async () => {
            const tq = new TaskQueue(1);
            const result = await tq.add(async () => 'Hello World');
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
            const order: number[] = [];

            await Promise.all(Array(3).fill(0).map((_, i) => tq.add(async () => order.push(i))));
            expect(order).toEqual([0, 1, 2]);
        });

        it(`propagates rejections`, async () => {
            const tq = new TaskQueue(1);

            await expect(tq.add(async () => {
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
            const results: number[] = [];

            await Promise.allSettled([
                tq.add(async () => {
                    throw new Error();
                }),
                tq.add(async () => results.push(1)),
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

            tq.add(async () => {
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