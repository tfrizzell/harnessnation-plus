export function bindDialogEventListeners(dialog: HTMLDialogElement): void {
    dialog.addEventListener('click', e => {
        if (dialog == e.target)
            dialog.close();
    });

    dialog.addEventListener('keydown', e => {
        e.preventDefault();
    });

    dialog.addEventListener('keyup', e => {
        e.preventDefault();
        dialog.close();
    });
}

document.querySelectorAll<HTMLDialogElement>('dialog').forEach(bindDialogEventListeners);

document.querySelectorAll<HTMLAnchorElement>('a[role="dialog" i]').forEach(a => {
    const dialogName = a.getAttribute('href')?.replace(/^#/, '');

    a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector<HTMLDialogElement>(`dialog#${dialogName}`)?.showModal();
    });
});