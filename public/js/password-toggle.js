document.querySelectorAll('input[name="password"], input[name="confirmPassword"]').forEach(input => {
    const wrapper = document.createElement('span');

    wrapper.className = 'password-field';

    input.parentNode.insertBefore(wrapper, input);

    wrapper.appendChild(input);

    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'password-toggle';

    button.setAttribute('aria-pressed', 'false');

    const update = () => {
        const visible = input.type === 'text';

        button.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');

        button.title = visible ? 'Ocultar senha' : 'Mostrar senha';

        button.setAttribute('aria-pressed', String(visible));

        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>' + (visible ? '<path d="m3 3 18 18"/>' : '') + '</svg>';
    };

    button.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';

        update();
    });

    update();

    wrapper.appendChild(button);
});
