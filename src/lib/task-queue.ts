/**
 * Executes asynchronous tasks while limiting the number of concurrent operations.
 * 
 * Tasks are queued in the order they are added and are started as capacity becomes
 * available. The promise returned by {@link add} resolves or rejects with the
 * result of the queued task.
 */
export class TaskQueue {
    /** The maximum number of concurrently executing tasks. */
    #limit: number;

    /** The number of tasks currently executing. */
    #active: number = 0;

    /** Pending tasks waiting for execution. */
    #queue: Array<() => void> = [];

    /* Promises waiting for the queue to become idle. */
    #idleResolvers: Array<() => void> = [];

    /**
     * Creates a new task queue.
     * 
     * @param limit - The maximum number of tasks that may execute concurrently.
     * @throws RangeError - If the limit is invalid.
     */
    constructor(limit: number) {
        if (!Number.isInteger(limit) || limit < 1)
            throw new RangeError('TaskQueue limit must be a positive integer');

        this.#limit = limit;
    }

    /**
     * Queues an asynchronous task for execution.
     * 
     * The task will begin immediately if the queue has available capacity;
     * otherwise, it will wait until a running task completes.
     * 
     * @typeParam T - The type of the task result.
     * @param task - A function that returns the promise representing the work to perform. 
     * @returns A promise that resolves or rejects with the result of the queued task.
     */
    add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.#queue.push(() => {
                this.#active++;

                Promise
                    .resolve()
                    .then(task)
                    .then(resolve, reject)
                    .finally(() => {
                        this.#active--;
                        this.#next();
                    });
            });

            this.#next();
        });
    }

    /**
     * Returns a promise that resolves when the queue becomes idle.
     *
     * A queue is idle when there are no running tasks and no queued tasks
     * waiting to execute.
     *
     * If the queue is already idle, the returned promise resolves immediately.
     * 
     * @returns  A promise that resolves when all queued work has completed.
     */
    onIdle(): Promise<void> {
        if (this.#active === 0 && this.#queue.length === 0)
            return Promise.resolve();

        return new Promise(resolve => { this.#idleResolvers.push(resolve) });
    }

    /**
     * Starts the next queued task if execution capacity is available.
     * 
     * When the queue becomes completely idle, resolves any pending
     * {@link onIdle} callers.
     */
    #next(): void {
        if (this.#active >= this.#limit)
            return;

        const task = this.#queue.shift();

        if (!task && this.#active === 0) {
            while (this.#idleResolvers.length)
                this.#idleResolvers.shift()?.();
        } else
            task?.();
    }
}