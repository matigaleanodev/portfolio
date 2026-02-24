import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';

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
    expect(bubbles.some((text) => text?.includes('Trabajo con TypeScript, Angular y NestJS.'))).toBe(
      true,
    );
    expect(el.textContent).toContain('FAQ');
    expect(trackEventMock).toHaveBeenCalledWith(
      'chat_click_suggestion',
      expect.objectContaining({ question: '¿Qué tecnologías usás?' }),
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
});
