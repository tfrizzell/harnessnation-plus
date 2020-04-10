chrome.runtime.onInstalled.addListener(data => {
    if (data.reason !== 'install' && data.reason !== 'update') {
        return;
    }

    chrome.storage.sync.get((data = {}) => {
        chrome.storage.sync.set({
            'breedingStable.stateDuration.control': data['breedingStable.stateDuration.control'] ?? 1,
            'breedingStable.stateDuration.units': data['breedingStable.stateDuration.units'] ?? 31557600,
            'breedingStable.stateDuration.value': data['breedingStable.stateDuration.value'] ?? 1,

            'mainStable.stateDuration.control': data['mainStable.stateDuration.control'] ?? 1,
            'mainStable.stateDuration.units': data['mainStable.stateDuration.units'] ?? 31557600,
            'mainStable.stateDuration.value': data['mainStable.stateDuration.value'] ?? 1,

            'progenyList.stateDuration.control': data['progenyList.stateDuration.control'] ?? 1,
            'progenyList.stateDuration.units': data['progenyList.stateDuration.units'] ?? 31557600,
            'progenyList.stateDuration.value': data['progenyList.stateDuration.value'] ?? 1
        });
    });
});