import { EventType, onInstalled } from '../../../lib/events.js';
import { sleep } from '../../../lib/utils.js';

const $ = window.$ ?? window.jQuery;
$('#saleTable_filter input[type="search"]').off();

let controller: AbortController | null;

function bloodlineSearch(this: Window, evt: Event, retries: number = 10): void {
    void (async () => {
        controller?.abort();

        try {
            console.debug(`%cstallions.search.ts%c     Executing bloodline search`, 'color:#406e8e;font-weight:bold;', '');

            $('#saleTable').DataTable()
                .search(String((evt as CustomEvent).detail), true, false)
                .draw();

            controller = null;
        } catch (e: unknown) {
            console.groupCollapsed(`%cstallions.search.ts%c     Error while executing bloodline search`, 'color:#406e8e;font-weight:bold;', '');

            if (e instanceof Error) {
                console.error('Message:', e.message);
                console.error('Stack Trace:', e);
            } else
                console.error('Unknown Error:', e);

            console.groupEnd();

            if (retries > 1) {
                console.debug(`%cstallions.search.ts%c     Retrying in 100ms...`, 'color:#406e8e;font-weight:bold;', '');

                try {
                    controller = new AbortController();
                    await sleep(100, controller.signal);
                    bloodlineSearch.call(this, evt, retries - 1);
                } catch (e: unknown) {
                    if (e !== 'Aborted by the user')
                        throw e;
                }
            }
        }
    })();
}

window.removeEventListener(EventType.BloodlineSearch, bloodlineSearch);
window.addEventListener(EventType.BloodlineSearch, bloodlineSearch);

onInstalled(() => {
    window.removeEventListener(EventType.BloodlineSearch, bloodlineSearch);
});
