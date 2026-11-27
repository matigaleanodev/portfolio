const ICONS = {
  success: ['M20 6 9 17l-5-5'],
  error: ['M18 6 6 18', 'm6 6 12 12'],
} as const;

const MESSAGES = {
  pending: 'Copiando…',
  success: 'Código copiado.',
  error: 'No se pudo copiar. Seleccioná el código y copialo a mano.',
} as const;

/**
 * Copia el bloque del botón. Permanece en Loading hasta que la promesa del portapapeles termina
 * y descarta activaciones repetidas sin usar `disabled`, para conservar el foco.
 */
export async function copyCodeBlock(button: HTMLButtonElement): Promise<void> {
  const block = button.closest('.code-block');
  const status = block?.querySelector<HTMLElement>('.code-status');
  const code = block?.querySelector('pre code');
  if (!status || !code || button.getAttribute('aria-busy') === 'true') return;

  setBusy(button, true);
  report(status, 'pending');
  try {
    await navigator.clipboard.writeText(code.textContent ?? '');
    report(status, 'success');
  } catch {
    report(status, 'error');
  } finally {
    setBusy(button, false);
  }
}

function setBusy(button: HTMLButtonElement, busy: boolean): void {
  const language = button.dataset['language'];
  button.setAttribute('aria-label', `${busy ? 'Copiando…' : 'Copiar'} código ${language}`);
  for (const name of ['aria-busy', 'aria-disabled']) {
    if (busy) button.setAttribute(name, 'true');
    else button.removeAttribute(name);
  }
  const slot = button.querySelector('.btn__slot')!;
  slot.replaceChildren();
  if (busy) {
    const spinner = button.ownerDocument.createElement('span');
    spinner.className = 'btn__spinner';
    slot.appendChild(spinner);
  }
  const [idle, pending] = Array.from(button.querySelectorAll('.btn__label > span'));
  for (const [label, visible] of [
    [idle, !busy],
    [pending, busy],
  ] as const) {
    label.setAttribute('data-idle', String(visible));
    if (visible) label.removeAttribute('aria-hidden');
    else label.setAttribute('aria-hidden', 'true');
  }
}

function report(status: HTMLElement, result: keyof typeof MESSAGES): void {
  status.dataset['result'] = result;
  status.replaceChildren();
  const document = status.ownerDocument;
  if (result !== 'pending') {
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    for (const d of ICONS[result]) {
      const path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', d);
      icon.appendChild(path);
    }
    status.appendChild(icon);
  }
  const text = document.createElement('span');
  text.textContent = MESSAGES[result];
  status.appendChild(text);
}
