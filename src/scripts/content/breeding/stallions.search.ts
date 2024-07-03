import { EventType, onInstalled } from '../../../lib/events.js';
import { sleep } from '../../../lib/utils.js';

(($) => {
    $('#saleTable_filter input[type="search"]').unbind();
    let controller: AbortController | null;

    async function bloodlineSearch(this: Window, e: Event, retries: number = 10): Promise<void> {
        controller?.abort();

        try {
            console.debug(`%cstallions.search.ts%c     Executing bloodline search`, 'color:#406e8e;font-weight:bold;', '');
            $('#saleTable').DataTable().search((e as CustomEvent).detail, true, false).draw();
            controller = null;
        } catch (e: any) {
            console.error(`%cstallions.search.ts%c     Error while executing bloodline search: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            console.error(e);

            if (retries > 1) {
                console.debug(`%cstallions.search.ts%c     Retrying in 100ms...`, 'color:#406e8e;font-weight:bold;', '');

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

    window.addEventListener(EventType.BloodlineSearch, bloodlineSearch);

    onInstalled(() => {
        window.removeEventListener(EventType.BloodlineSearch, bloodlineSearch);
    });
})((window as any).$ || (window as any).jQuery);