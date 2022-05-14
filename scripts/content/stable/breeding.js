(() => {
    function addExportButton() {
        chrome.storage.local.get('breeding.export', ({ 'breeding.export': exportRunning }) => {
            document.querySelectorAll('#breedingHorseTable_3_wrapper').forEach(p => {
                [p.parentNode, p.parentNode.parentNode].forEach(n => {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('hn-plus-button-wrapper');

                    if (n === p.parentNode)
                        n.insertBefore(wrapper, p);
                    else
                        n.append(wrapper);

                    const button = document.createElement('button');
                    button.classList.add('hn-plus-button');
                    button.disabled = exportRunning;
                    button.textContent = 'Report (CSV)';
                    button.type = 'button';

                    button.addEventListener('click', async e => {
                        e.preventDefault();
                        const message = setTimeout(() => alert('Your broodmare report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.'), 50);

                        try {
                            await exportReport(document.querySelector('#breedingHorseTable_3_wrapper').innerHTML);
                        } catch (error) {
                            clearTimeout(message);
                            alert(error);
                        }
                    });

                    const tooltip = document.createElement('hn-plus-tooltip');
                    tooltip.textContent = 'Generate a CSV export of all broodmares listed in this table. This report includes data from their progeny report and may take several minutes to generate.';
                    wrapper.append(tooltip, button);

                    function handleStateChange(changes, areaName) {
                        if (areaName !== 'local' || !('breeding.export' in changes)) return;

                        if (changes['breeding.export']?.newValue)
                            document.querySelectorAll('.hn-plus-button').forEach(el => el.disabled = true);
                        else
                            document.querySelectorAll('.hn-plus-button').forEach(el => el.disabled = false);
                    }

                    chrome.storage.onChanged.addListener(handleStateChange);

                    window.addEventListener('installed.harnessnation-plus', () => {
                        chrome.storage.onChanged.removeListener(handleStateChange);
                    }, { once: true });

                });
            });
        });
    }

    function exportReport(html) {
        return new Promise((resolve, reject) => {
            const pattern = /<tr[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
            const ids = [];
            let id;

            while (id = pattern.exec(html)?.[1])
                ids.push(+id);

            chrome.runtime.sendMessage({
                action: 'BREEDING_REPORT', data: {
                    ids,
                    filename: 'hn-plus-broodmare-report-${timestamp}',
                }
            }, response => {
                if (response['@type'] === '\u2063error')
                    reject(response.message);
                else
                    resolve(response);
            });
        });
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if ([].find.call(m.addedNodes, n => n.id === 'breedingHorseTable_3_wrapper'))
                addExportButton();
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    window.addEventListener('installed.harnessnation-plus', () => {
        observer.disconnect();
        document.querySelectorAll('.hn-plus-button-wrapper').forEach(el => el.remove());
    }, { once: true });

    window.addEventListener('DOMContentLoaded', () => {
        const tooltip = document.createElement('script');
        tooltip.setAttribute('type', 'module');
        tooltip.setAttribute('src', chrome.runtime.getURL('/public/components/tooltip.js'));
        document.body.append(tooltip);
    });

    if (document.querySelector('.horseContentContainer_3'))
        addExportButton();
})();