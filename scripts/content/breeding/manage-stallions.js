(() => {
    document.querySelectorAll('#inputStudFee, #inputStudFeeUpdate').forEach(input => {
        const button = document.createElement('i');
        button.classList.add('hn-plus-calculate-button');
        button.textContent = 'calculate';

        input.classList.add('hn-plus-calculate-input');
        input.parentNode.append(button);

        let calculating = false;

        button.addEventListener('click', () => {
            if (calculating) {
                return;
            }

            chrome.storage.sync.get('stallions', async ({ stallions }) => {
                input.classList.add('hn-plus-calculating');
                calculating = true;

                try {
                    await new Promise(resolve => {
                        chrome.runtime.sendMessage({
                            action: 'CALCULATE_STUD_FEE',
                            data: {
                                id: input.form.elements.horse.value,
                                formula: stallions?.management?.formula,
                            },
                        }, fee => {
                            input.value = fee;
                            resolve();
                        });
                    });
                } finally {
                    calculating = false;
                    input.classList.remove('hn-plus-calculating');
                }
            });
        });
    });

    window.addEventListener('installed.harnessnation-plus', () => {
        document.querySelectorAll('.hn-plus-calculate-button').forEach(el => el.remove());
        document.querySelectorAll('.hn-plus-calculate-input').forEach(el => el.classList.remove('hn-plus-calculate-input', 'hn-plus-calculating'));
    }, { once: true });
})();