document.querySelectorAll('#inputStudFee, #inputStudFeeUpdate').forEach(input => {
    const button = document.createElement('i');
    button.classList.add('plus-calculate-button');
    button.textContent = 'calculate';

    input.classList.add('plus-calculate-input');
    input.parentNode.appendChild(button);

    let calculating = false;

    button.addEventListener('click', () => {
        if (calculating) {
            return;
        }

        chrome.storage.sync.get('stallions', async ({ stallions }) => {
            input.classList.add('plus-calculating');
            calculating = true;

            try {
                input.value = '';

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
                input.classList.remove('plus-calculating');
            }
        });
    });
});

window.addEventListener(`${chrome.runtime.id}.installed`, function handleInstalled() {
    window.removeEventListener(`${chrome.runtime.id}.installed`, handleInstalled);
    document.querySelectorAll('.plus-calculate-button').forEach(el => el.remove());
    document.querySelectorAll('.plus-calculate-input').forEach(el => el.classList.remove('plus-calculate-input', 'plus-calculating'));
});
