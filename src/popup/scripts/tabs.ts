document.querySelectorAll<HTMLAnchorElement>('#page-footer > nav > a').forEach(a => {
    const sectionName = a.getAttribute('href')?.replace(/^#/, '');

    a.addEventListener('click', e => {
        e.preventDefault();

        if (a.classList.contains('active'))
            return;

        document.querySelector('#page-content > section.active')?.classList.remove('active');
        document.querySelector(`#page-content > section#panel-${sectionName}`)?.classList.add('active');

        document.querySelector('#page-footer > nav > a.active')?.classList.remove('active');
        a.classList.add('active');
    });
});