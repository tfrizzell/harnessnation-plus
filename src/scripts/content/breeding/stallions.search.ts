import { EventType, onInstalled } from '../../../lib/events.js';
import { sleep } from '../../../lib/utils.js';

(($) => {
    $('#saleTable_filter input[type="search"]').unbind();
    let controller: AbortController | null;

    async function bloodlineSearch(this: Window, e: Event, retries: number = 10): Promise<void> {
        controller?.abort();

        try {
            console.debug('Executing bloodline search...');
            $('#saleTable').DataTable().search((e as CustomEvent).detail.pattern, true, false).draw();
            controller = null;
        } catch (e: any) {
            console.error('Error while executing bloodline search:', e.message);
            console.error(e);

            if (retries > 1) {
                console.debug('Retrying in 100ms...');

                try {
                    controller = new AbortController();
                    await sleep(100, controller.signal);
                    bloodlineSearch.call(this, e, retries - 1);
                } catch (e: any) {
                    if (e !== 'Aborted by the user')
                        throw e;
                }
            }
        }
    }

    window.addEventListener(EventType.BloodlineSeach, bloodlineSearch);

    onInstalled(() => {
        window.removeEventListener(EventType.BloodlineSeach, bloodlineSearch);
    });
})((window as any).$ || (window as any).jQuery);