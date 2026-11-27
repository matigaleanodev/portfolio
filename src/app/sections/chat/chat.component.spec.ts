import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ChatComponent } from './chat.component';
import { ApiService } from '../../services/api.service';
import { ChatRequestDto, ChatResponseDto, ChatStartersResponseDto } from '../../models/chat.model';
import { AnalyticsService } from '../../services/analytics.service';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;

  const getChatStartersMock = vi.fn<() => Observable<ChatStartersResponseDto>>();
  const sendChatMessageMock = vi.fn<(dto: ChatRequestDto) => Observable<ChatResponseDto>>();
  const trackEventMock = vi.fn<(eventName: string, params?: Record<string, unknown>) => void>();

  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();

    getChatStartersMock.mockReturnValue(
      of({
        suggestedQuestions: ['¿Qué tecnologías usás?', '¿Cuál es tu experiencia laboral?'],
      }),
    );
    sendChatMessageMock.mockReturnValue(
      of({
        answer: 'Trabajo con TypeScript, Angular y NestJS.',
        suggestedQuestions: ['¿Usás MongoDB?'],
        source: 'faq',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        {
          provide: ApiService,
          useValue: {
            getChatStarters: getChatStartersMock,
            sendChatMessage: sendChatMessageMock,
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackEvent: trackEventMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse y comenzar cerrado con el botón flotante visible', () => {
    expect(component).toBeTruthy();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.chat-fab')).toBeTruthy();
    expect(el.querySelector('.chat-widget')).toBeNull();
  });

  it('debería abrir y cerrar el widget desde los botones', () => {
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.chat-widget')).toBeTruthy();
    expect(el.textContent).toContain('Chatbot Asistente');
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_open',
      expect.objectContaining({ trigger: 'fab' }),
    );

    (el.querySelector('.chat-icon-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.chat-widget')).toBeNull();
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_close',
      expect.objectContaining({ reason: 'button' }),
    );
  });

  it('debería renderizar preguntas sugeridas iniciales al abrir', () => {
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    const chips = Array.from(el.querySelectorAll('.chat-chip')).map((chip) =>
      chip.textContent?.trim(),
    );
    expect(chips).toContain('¿Qué tecnologías usás?');
    expect(chips).toContain('¿Cuál es tu experiencia laboral?');
  });

  it('debería enviar una pregunta sugerida y renderizar mensajes + respuesta', () => {
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    (el.querySelector('.chat-chip') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(sendChatMessageMock).toHaveBeenCalledTimes(1);
    expect(sendChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '¿Qué tecnologías usás?',
        sessionId: expect.any(String),
      }),
    );

    const bubbles = Array.from(el.querySelectorAll('.chat-bubble')).map((node) =>
      node.textContent?.trim(),
    );
    expect(bubbles.some((text) => text?.includes('¿Qué tecnologías usás?'))).toBe(true);
    expect(
      bubbles.some((text) => text?.includes('Trabajo con TypeScript, Angular y NestJS.')),
    ).toBe(true);
    expect(el.textContent).toContain('FAQ');
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_click_suggestion',
      expect.objectContaining({ length: '¿Qué tecnologías usás?'.length }),
    );
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_receive_response',
      expect.objectContaining({ source: 'faq' }),
    );
  });

  it('debería enviar mensaje manual con Enter y limpiar el textarea', () => {
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    const textarea = el.querySelector('#chat-input') as HTMLTextAreaElement;
    textarea.value = '¿Usás NestJS en producción?';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(sendChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: '¿Usás NestJS en producción?' }),
    );
    expect(textarea.value).toBe('');
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_send_message',
      expect.objectContaining({ via: 'manual' }),
    );
  });

  it('envía el diálogo previo en orden, sin bienvenida ni la pregunta actual', () => {
    component['useSuggestion']('¿Dónde trabajás?');
    expect(sendChatMessageMock.mock.calls[0][0].history).toEqual([]);
    component['useSuggestion']('¿Y qué hacés ahí?');
    expect(sendChatMessageMock.mock.calls[1][0].history).toEqual([
      { role: 'user', content: '¿Dónde trabajás?' },
      { role: 'assistant', content: 'Trabajo con TypeScript, Angular y NestJS.' },
    ]);
    expect(
      trackEventMock.mock.calls.every(([, params]) => !params || !('question' in params)),
    ).toBe(true);
  });

  it('no debería enviar con Enter si el draft está vacío', () => {
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    const textarea = el.querySelector('#chat-input') as HTMLTextAreaElement;
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(sendChatMessageMock).not.toHaveBeenCalled();
  });

  it('debería mostrar fallback y mensaje de error si falla la API del chat', () => {
    sendChatMessageMock.mockReturnValueOnce(throwError(() => new Error('boom')));

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    const textarea = el.querySelector('#chat-input') as HTMLTextAreaElement;
    textarea.value = 'Pregunta';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    (el.querySelector('.chat-submit') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.chat-error')?.textContent).toContain(
      'No se pudo obtener respuesta del chatbot',
    );
    expect(el.textContent).toContain('No pude responder en este momento');
    expect(el.textContent).toContain('Fallback');
    expect(trackEventMock).toHaveBeenCalledWith('chat_receive_error');
  });

  it('debería mostrar estado de error y permitir reintentar starters', () => {
    fixture.destroy();
    getChatStartersMock.mockReset();
    getChatStartersMock
      .mockReturnValueOnce(throwError(() => ({ status: 503 })))
      .mockReturnValueOnce(
        of({
          suggestedQuestions: ['¿Qué tecnologías usás?'],
        }),
      );

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.textContent).toContain('No pude cargar las sugerencias ahora');
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_starters_error',
      expect.objectContaining({ status: 503 }),
    );

    const retryButton = Array.from(el.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Reintentar'),
    ) as HTMLButtonElement | undefined;

    retryButton?.click();
    fixture.detectChanges();

    expect(getChatStartersMock).toHaveBeenCalledTimes(2);
    expect(trackEventMock).toHaveBeenCalledWith('chat_retry_starters');
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_starters_loaded',
      expect.objectContaining({ count: 1 }),
    );
  });

  describe('carga de sugerencias', () => {
    const globals = globalThis as { ngServerMode?: boolean };

    afterEach(() => delete globals.ngServerMode);

    it('no llama a la API durante el prerender', async () => {
      fixture.destroy();
      getChatStartersMock.mockClear();
      globals.ngServerMode = true;

      fixture = TestBed.createComponent(ChatComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(getChatStartersMock).not.toHaveBeenCalled();
    });

    it('las pide una sola vez en el navegador, despues del primer render', async () => {
      fixture.destroy();
      getChatStartersMock.mockClear();

      fixture = TestBed.createComponent(ChatComponent);
      expect(getChatStartersMock).not.toHaveBeenCalled();

      fixture.detectChanges();
      await fixture.whenStable();

      expect(getChatStartersMock).toHaveBeenCalledTimes(1);
    });
  });

  it('debería persistir y restaurar mensajes desde localStorage', async () => {
    fixture.destroy();

    window.localStorage.setItem(
      'portfolio-chat-messages',
      JSON.stringify([
        {
          id: 1,
          role: 'assistant',
          text: 'Mensaje persistido',
          source: 'faq',
        },
      ]),
    );

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.chat-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    await Promise.resolve();
    fixture.detectChanges();

    expect(el.textContent).toContain('Mensaje persistido');
    expect(component['messages']()[0]?.text).toBe('Mensaje persistido');
    component['useSuggestion']('¿Y qué más?');
    expect(sendChatMessageMock.mock.calls[0][0].history).toEqual([
      { role: 'assistant', content: 'Mensaje persistido' },
    ]);
  });

  it('debería cerrar con Escape y devolver foco al FAB', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const fab = el.querySelector('.chat-fab') as HTMLButtonElement;
    const originalRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    }) as typeof requestAnimationFrame;

    try {
      fab.click();
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(el.querySelector('.chat-widget')).toBeNull();
      expect(document.activeElement).toBe(fab);
      expect(trackEventMock).toHaveBeenCalledWith(
        'chat_close',
        expect.objectContaining({ reason: 'escape' }),
      );
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
    }
  });

  describe('foco y modalidad', () => {
    let narrow = false;
    let mediaListener: (() => void) | null = null;

    const mount = (isNarrow: boolean) => {
      narrow = isNarrow;
      vi.stubGlobal('matchMedia', () => ({
        get matches() {
          return narrow;
        },
        addEventListener: (_: string, listener: () => void) => (mediaListener = listener),
        removeEventListener: () => (mediaListener = null),
      }));
      fixture.destroy();
      fixture = TestBed.createComponent(ChatComponent);
      component = fixture.componentInstance;
      document.body.appendChild(fixture.nativeElement);
      const changes: boolean[] = [];
      component.modalChange.subscribe((value) => changes.push(value));
      fixture.detectChanges();
      return { el: fixture.nativeElement as HTMLElement, changes };
    };

    const open = async (el: HTMLElement) => {
      (el.querySelector('.chat-fab') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
    };

    const press = (key: string, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', {
        key,
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      (document.activeElement ?? document.body).dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };

    const outsideButton = () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      return button;
    };

    const rect = (left: number, top: number, right: number, bottom: number) =>
      ({ left, top, right, bottom, width: right - left, height: bottom - top }) as DOMRect;

    afterEach(() => {
      vi.unstubAllGlobals();
      document.body.innerHTML = '';
    });

    it('en viewport angosto es un diálogo modal y lo informa al shell', async () => {
      const { el, changes } = mount(true);
      await open(el);
      expect(el.querySelector('#chat-widget')?.getAttribute('aria-modal')).toBe('true');
      expect(changes.at(-1)).toBe(true);
      press('Escape');
      expect(changes.at(-1)).toBe(false);
    });

    it('en viewport ancho es un panel no modal', async () => {
      const { el, changes } = mount(false);
      await open(el);
      expect(el.querySelector('#chat-widget')?.hasAttribute('aria-modal')).toBe(false);
      expect(changes).not.toContain(true);
    });

    it('actualiza la modalidad si cambia el viewport con el chat abierto', async () => {
      const { el, changes } = mount(false);
      await open(el);
      narrow = true;
      mediaListener?.();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(el.querySelector('#chat-widget')?.getAttribute('aria-modal')).toBe('true');
      expect(changes.at(-1)).toBe(true);
    });

    it('en modo modal Tab y Shift+Tab circulan dentro del diálogo', async () => {
      const { el } = mount(true);
      await open(el);
      const first = el.querySelector<HTMLElement>('.chat-icon-btn')!;
      const input = el.querySelector<HTMLTextAreaElement>('#chat-input')!;
      input.focus();
      expect(press('Tab').defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
      expect(press('Tab', true).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(input);
    });

    it('en modo no modal no intercepta Tab', async () => {
      const { el } = mount(false);
      await open(el);
      el.querySelector<HTMLTextAreaElement>('#chat-input')!.focus();
      expect(press('Tab').defaultPrevented).toBe(false);
    });

    it('en modo no modal Escape fuera del panel no lo cierra ni roba el foco', async () => {
      const { el } = mount(false);
      await open(el);
      const button = outsideButton();
      button.focus();
      press('Escape');
      expect(el.querySelector('#chat-widget')).toBeTruthy();
      expect(document.activeElement).toBe(button);
    });

    it('en modo no modal Escape con el foco en el body no cierra el chat', async () => {
      const { el } = mount(false);
      await open(el);
      (document.activeElement as HTMLElement | null)?.blur();
      expect(document.activeElement).toBe(document.body);

      const event = press('Escape');

      expect(event.defaultPrevented).toBe(false);
      expect(el.querySelector('#chat-widget')).toBeTruthy();
      expect(trackEventMock).not.toHaveBeenCalledWith(
        'chat_close',
        expect.objectContaining({ reason: 'escape' }),
      );
    });

    it('en modo no modal Escape con el foco dentro del panel lo cierra', async () => {
      const { el } = mount(false);
      await open(el);
      el.querySelector<HTMLTextAreaElement>('#chat-input')!.focus();

      press('Escape');

      expect(el.querySelector('#chat-widget')).toBeNull();
      expect(trackEventMock).toHaveBeenCalledWith(
        'chat_close',
        expect.objectContaining({ reason: 'escape' }),
      );
    });

    it('en modo no modal cede si un control enfocado queda totalmente tapado', async () => {
      const { el } = mount(false);
      await open(el);
      const button = outsideButton();
      button.scrollIntoView = vi.fn();
      button.getBoundingClientRect = () => rect(700, 500, 760, 540);
      el.querySelector<HTMLElement>('#chat-widget')!.getBoundingClientRect = () =>
        rect(600, 100, 1000, 700);
      button.focus();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(button.scrollIntoView).not.toHaveBeenCalled();
      expect(el.querySelector('#chat-widget')).toBeNull();
      expect(document.activeElement).toBe(button);
      expect(trackEventMock).toHaveBeenCalledWith(
        'chat_close',
        expect.objectContaining({ reason: 'focus_obscured' }),
      );
    });

    it('en modo no modal permanece abierto si el control se ve en parte', async () => {
      const { el } = mount(false);
      await open(el);
      const button = outsideButton();
      button.getBoundingClientRect = () => rect(560, 500, 640, 540);
      el.querySelector<HTMLElement>('#chat-widget')!.getBoundingClientRect = () =>
        rect(600, 100, 1000, 700);
      button.focus();
      fixture.detectChanges();
      expect(el.querySelector('#chat-widget')).toBeTruthy();
    });

    it('conserva el foco en el campo mientras envía', async () => {
      sendChatMessageMock.mockReturnValueOnce(new Observable<ChatResponseDto>());
      const { el } = mount(true);
      await open(el);
      el.querySelector<HTMLButtonElement>('button.chat-chip')!.click();
      fixture.detectChanges();
      const input = el.querySelector<HTMLTextAreaElement>('#chat-input')!;
      expect(input.disabled).toBe(false);
      expect(input.readOnly).toBe(true);
      expect(document.activeElement).toBe(input);
    });

    it('al ceder conserva la solicitud en curso, los mensajes y el borrador', async () => {
      const response = new Subject<ChatResponseDto>();
      sendChatMessageMock.mockReturnValueOnce(response);
      const { el } = mount(false);
      await open(el);
      el.querySelector<HTMLButtonElement>('button.chat-chip')!.click();
      component['updateDraft']('borrador sin enviar');
      fixture.detectChanges();
      const button = outsideButton();
      button.getBoundingClientRect = () => rect(700, 500, 760, 540);
      el.querySelector<HTMLElement>('#chat-widget')!.getBoundingClientRect = () =>
        rect(600, 100, 1000, 700);
      button.focus();
      fixture.detectChanges();
      expect(el.querySelector('#chat-widget')).toBeNull();
      expect(response.observed).toBe(true);

      response.next({ answer: 'Llegó cerrado', source: 'faq', suggestedQuestions: [] });
      response.complete();
      await open(el);
      expect(el.textContent).toContain('¿Qué tecnologías usás?');
      expect(el.textContent).toContain('Llegó cerrado');
      expect(el.querySelector<HTMLTextAreaElement>('#chat-input')!.value).toBe(
        'borrador sin enviar',
      );
    });
  });

  describe('anuncios', () => {
    const openChat = () => {
      const el = fixture.nativeElement as HTMLElement;
      el.querySelector<HTMLButtonElement>('.chat-fab')!.click();
      fixture.detectChanges();
      return el;
    };

    it('anuncia "escribiendo" en una región persistente fuera del log', () => {
      const response = new Subject<ChatResponseDto>();
      sendChatMessageMock.mockReturnValueOnce(response);
      const el = openChat();
      const status = el.querySelector('#chat-status')!;
      expect(status.getAttribute('role')).toBe('status');
      expect(status.textContent?.trim()).toBe('');
      el.querySelector<HTMLButtonElement>('button.chat-chip')!.click();
      fixture.detectChanges();
      expect(el.querySelector('#chat-status')).toBe(status);
      expect(status.textContent?.trim()).toBe('El asistente está escribiendo');
      const log = el.querySelector('[role="log"]')!;
      expect(log.querySelector('[role="status"], [aria-live]')).toBeNull();
      expect(log.contains(status)).toBe(false);
      expect(log.querySelector('.chat-typing')!.closest('[aria-hidden="true"]')).toBeTruthy();
      response.next({ answer: 'ok', source: 'faq', suggestedQuestions: [] });
      response.complete();
      fixture.detectChanges();
      expect(status.textContent?.trim()).toBe('');
    });

    it('anuncia un error de envío una sola vez, desde la conversación', () => {
      sendChatMessageMock.mockReturnValueOnce(throwError(() => new Error('boom')));
      const el = openChat();
      el.querySelector<HTMLButtonElement>('button.chat-chip')!.click();
      fixture.detectChanges();
      const error = el.querySelector('#chat-error')!;
      expect(error.hasAttribute('role')).toBe(false);
      expect(error.hasAttribute('aria-live')).toBe(false);
      expect(el.querySelector('[role="alert"]')).toBeNull();
      expect(el.querySelector('[role="log"]')!.textContent).toContain('No pude responder');
    });
  });

  describe('estados del envío', () => {
    const open = () => {
      const el = fixture.nativeElement as HTMLElement;
      el.querySelector<HTMLButtonElement>('.chat-fab')!.click();
      fixture.detectChanges();
      return el;
    };

    it('usa Loading en Enviar sin disabled nativo e ignora repeticiones', () => {
      sendChatMessageMock.mockReturnValue(new Observable());
      const el = open();
      const input = el.querySelector<HTMLTextAreaElement>('#chat-input')!;
      input.value = 'Hola';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      const button = el.querySelector<HTMLButtonElement>('.chat-submit')!;

      button.click();
      fixture.detectChanges();
      button.click();

      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-label')).toBe('Enviando…');
      expect(sendChatMessageMock).toHaveBeenCalledTimes(1);
    });

    it('anuncia los agregados del log sin marcarlo como ocupado', () => {
      sendChatMessageMock.mockReturnValue(new Observable());
      const el = open();
      el.querySelector<HTMLButtonElement>('button.chat-chip')!.click();
      fixture.detectChanges();

      expect(el.querySelector('[role="log"]')!.hasAttribute('aria-busy')).toBe(false);
      expect(el.querySelector<HTMLButtonElement>('button.chat-chip')?.disabled ?? true).toBe(true);
    });
  });
});
