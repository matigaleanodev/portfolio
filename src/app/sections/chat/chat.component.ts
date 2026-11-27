import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ArrowUp, Bot, ChevronRight, LucideAngularModule, X } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { ChatSource } from '../../models/chat.model';
import { AnalyticsService } from '../../services/analytics.service';
import { buildChatRequest } from './chat-history';

type ChatRole = 'user' | 'assistant';
type CloseReason = 'button' | 'overlay' | 'escape' | 'focus_obscured';

/** Por debajo de este ancho el chat cubre la pantalla y se comporta como diálogo modal. */
const MODAL_MEDIA_QUERY = '(max-width: 767.98px)';
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  source?: ChatSource;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  private readonly injector = inject(Injector);
  private readonly api = inject(ApiService);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly idCounter = signal(0);
  private readonly messagesStorageKey = 'portfolio-chat-messages';

  protected readonly moreIcon = ChevronRight;
  private readonly suggestions = viewChild<ElementRef<HTMLDivElement>>('suggestions');
  /** Quedan sugerencias fuera de la vista hacia la derecha. */
  protected readonly moreSuggestions = signal(false);
  private readonly watchSuggestions = afterRenderEffect((onCleanup) => {
    const element = this.suggestions()?.nativeElement;
    this.visibleSuggestions();
    this.loadingStarters();
    this.updateSuggestionsOverflow();
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => this.updateSuggestionsOverflow());
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });
  protected readonly messagesViewport = viewChild<ElementRef<HTMLDivElement>>('messagesViewport');
  readonly modalChange = output<boolean>();

  protected readonly botIcon = Bot;
  protected readonly sendIcon = ArrowUp;
  protected readonly closeIcon = X;

  protected readonly isOpen = signal(false);
  private readonly coversViewport = signal(false);
  protected readonly isModal = computed(() => this.isOpen() && this.coversViewport());
  protected readonly draft = signal('');
  protected readonly messages = signal<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Hola. Soy el asistente del portfolio. Podés preguntarme sobre experiencia, stack, proyectos o disponibilidad.',
    },
  ]);
  protected readonly starters = signal<string[]>([]);
  protected readonly suggestedQuestions = signal<string[]>([]);
  protected readonly loadingStarters = signal(true);
  protected readonly startersError = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly canSend = computed(() => {
    const text = this.draft().trim();
    return !this.sending() && text.length > 0 && text.length <= 500;
  });

  protected readonly hasConversation = computed(() => this.messages().length > 1);

  protected readonly visibleSuggestions = computed(() => {
    const source = this.hasConversation() ? this.suggestedQuestions() : this.starters();
    return source.slice(0, 4);
  });

  private shouldAutoScroll = false;
  private readonly sessionId = this.createSessionId();
  private lastOpenTimestamp: number | null = null;

  constructor() {
    this.restoreMessagesFromStorage();
    this.syncMessageCounter();
    this.setupEffects();
    this.watchViewport();
    this.loadStarters();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent) {
    if (!this.isOpen() || event.defaultPrevented) return;

    if (event.key === 'Tab' && this.isModal()) {
      this.keepTabInside(event);
      return;
    }

    if (event.key !== 'Escape' || event.isComposing) return;
    if (!this.isModal() && !this.isFocusInChat()) return;

    event.preventDefault();
    this.closeChat('escape');
  }

  @HostListener('document:focusin', ['$event'])
  protected onDocumentFocusIn(event: FocusEvent) {
    if (!this.isOpen() || this.isModal()) return;

    const target = event.target;
    if (!(target instanceof HTMLElement) || this.host.contains(target)) return;
    if (!this.isHiddenByPanel(target)) return;

    // El navegador ya desplazó lo necesario; cerrar revela el control sin mover la página.
    this.closeChat('focus_obscured');
  }

  protected openChat() {
    if (this.isOpen()) return;

    this.isOpen.set(true);
    this.shouldAutoScroll = true;
    this.lastOpenTimestamp = Date.now();
    this.analytics.trackEvent('chat_open', {
      trigger: 'fab',
      has_conversation: this.hasConversation(),
      message_count: this.messages().length,
    });
  }

  protected closeChat(reason: CloseReason = 'button') {
    if (!this.isOpen()) return;

    this.isOpen.set(false);
    this.analytics.trackEvent('chat_close', {
      reason,
      message_count: this.messages().length,
      open_duration_ms:
        this.lastOpenTimestamp !== null
          ? Math.max(0, Date.now() - this.lastOpenTimestamp)
          : undefined,
    });
    this.lastOpenTimestamp = null;
    if (reason !== 'focus_obscured') this.scheduleDomTask(() => this.focusFabButton());
  }

  protected toggleChat() {
    this.isOpen.update((current) => !current);
    if (this.isOpen()) this.shouldAutoScroll = true;
  }

  protected updateDraft(value: string) {
    this.draft.set(value);
    if (this.apiError()) this.apiError.set(null);
  }

  protected submit() {
    if (!this.canSend()) return;

    this.sendMessage(this.draft().trim());
    this.focusTextarea();
  }

  protected useSuggestion(question: string) {
    if (this.sending()) return;

    this.analytics.trackEvent('chat_click_suggestion', {
      length: question.length,
      has_conversation: this.hasConversation(),
    });
    this.sendMessage(question);
    this.focusTextarea();
  }

  protected onTextareaKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    if (!this.canSend()) return;

    event.preventDefault();
    this.submit();
  }

  protected sourceLabel(source?: ChatSource): string | null {
    if (!source) return null;

    if (source === 'faq') return 'FAQ';
    if (source === 'ai') return 'IA';
    return 'Fallback';
  }

  private loadStarters() {
    this.loadingStarters.set(true);
    this.startersError.set(null);

    this.api
      .getChatStarters()
      .pipe(finalize(() => this.loadingStarters.set(false)))
      .subscribe({
        next: (response) => {
          const suggestedQuestions = response.suggestedQuestions ?? [];
          this.starters.set(suggestedQuestions);
          this.analytics.trackEvent('chat_starters_loaded', {
            count: suggestedQuestions.length,
          });
        },
        error: (error: unknown) => {
          this.starters.set(this.getFallbackStarters());
          this.startersError.set(
            'No pude cargar las sugerencias ahora. Podés reintentar o escribir directo.',
          );
          this.analytics.trackEvent('chat_starters_error', {
            status: this.getErrorStatus(error),
          });
        },
      });
  }

  private sendMessage(message: string) {
    const request = buildChatRequest(
      message,
      this.sessionId,
      this.messages()
        .filter((turn) => turn.role === 'user' || turn.source === 'faq' || turn.source === 'ai')
        .map((turn) => ({ role: turn.role, content: turn.text })),
    );
    this.analytics.trackEvent('chat_send_message', {
      length: message.length,
      via: this.draft().trim() ? 'manual' : 'suggestion',
    });
    this.appendMessage({ role: 'user', text: message });
    this.draft.set('');
    this.apiError.set(null);
    this.sending.set(true);

    this.api
      .sendChatMessage(request)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (response) => {
          this.analytics.trackEvent('chat_receive_response', {
            source: response.source,
            suggested_count: (response.suggestedQuestions ?? []).length,
          });
          this.appendMessage({
            role: 'assistant',
            text: response.answer,
            source: response.source,
          });
          this.suggestedQuestions.set(response.suggestedQuestions ?? []);
        },
        error: () => {
          this.analytics.trackEvent('chat_receive_error');
          this.apiError.set(this.getChatErrorMessage());
          this.appendMessage({
            role: 'assistant',
            text: 'No pude responder en este momento. Si querés, probá con otra pregunta o usá el formulario de contacto.',
            source: 'fallback',
          });
        },
      });
  }

  private appendMessage(message: Omit<ChatMessage, 'id'>) {
    const id = this.idCounter() + 1;
    this.idCounter.set(id);
    this.messages.update((current) => [...current, { id, ...message }]);
    this.shouldAutoScroll = true;
  }

  protected retryStarters() {
    if (this.loadingStarters()) return;

    this.analytics.trackEvent('chat_retry_starters');
    this.focusTextarea();
    this.loadStarters();
  }

  private get host(): HTMLElement {
    return this.hostRef.nativeElement;
  }

  private watchViewport() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia(MODAL_MEDIA_QUERY);
    const update = () => this.coversViewport.set(query.matches);
    update();
    query.addEventListener('change', update);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', update));
  }

  private keepTabInside(event: KeyboardEvent) {
    const items = Array.from(
      this.host.querySelectorAll<HTMLElement>(`#chat-widget :is(${FOCUSABLE_SELECTOR})`),
    );
    if (items.length === 0) return;

    const index = items.indexOf(document.activeElement as HTMLElement);
    const leavesStart = event.shiftKey && index <= 0;
    const leavesEnd = !event.shiftKey && (index === -1 || index === items.length - 1);
    if (!leavesStart && !leavesEnd) return;

    event.preventDefault();
    items[event.shiftKey ? items.length - 1 : 0].focus();
  }

  private isFocusInChat(): boolean {
    const active = document.activeElement;
    return !!active && this.host.contains(active);
  }

  private isHiddenByPanel(element: HTMLElement): boolean {
    const panel = this.host.querySelector('#chat-widget')?.getBoundingClientRect();
    const target = element.getBoundingClientRect();
    if (!panel || target.width === 0 || target.height === 0) return false;

    return (
      target.left >= panel.left &&
      target.right <= panel.right &&
      target.top >= panel.top &&
      target.bottom <= panel.bottom
    );
  }

  private setupEffects() {
    effect(() => this.modalChange.emit(this.isModal()));

    effect(() => {
      if (!this.isModal()) return;

      this.scheduleDomTask(() => {
        if (!this.host.querySelector('#chat-widget')?.contains(document.activeElement)) {
          this.focusTextarea();
        }
      });
    });

    effect(() => {
      const messages = this.messages();
      this.persistMessages(messages);
    });

    effect(() => {
      this.messages();
      if (!this.isOpen() || !this.shouldAutoScroll) return;

      this.scheduleDomTask(() => this.scrollMessagesToBottom());
    });

    effect(() => {
      if (!this.isOpen()) return;

      this.scheduleDomTask(() => {
        this.focusTextarea();
        if (this.shouldAutoScroll) {
          this.scrollMessagesToBottom();
        }
      });
    });
  }

  private scrollMessagesToBottom() {
    const viewport = this.messagesViewport()?.nativeElement;
    if (!viewport) return;

    viewport.scrollTop = viewport.scrollHeight;
    this.shouldAutoScroll = false;
  }

  private focusTextarea() {
    const host = this.hostRef.nativeElement as HTMLElement;
    const textarea = host.querySelector('#chat-input') as HTMLTextAreaElement | null;
    textarea?.focus();
  }

  private focusFabButton() {
    const host = this.hostRef.nativeElement as HTMLElement;
    const fab = host.querySelector('.chat-fab') as HTMLButtonElement | null;
    fab?.focus();
  }

  private scheduleDomTask(task: () => void) {
    afterNextRender(task, { injector: this.injector });
  }

  private restoreMessagesFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(this.messagesStorageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;

      const restored = parsed.filter((item): item is ChatMessage => this.isChatMessage(item));
      if (restored.length === 0) return;

      this.messages.set(restored);
    } catch {
      // silent on purpose
    }
  }

  private persistMessages(messages: ChatMessage[]) {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(this.messagesStorageKey, JSON.stringify(messages));
    } catch {
      // silent on purpose
    }
  }

  private syncMessageCounter() {
    const maxId = this.messages().reduce((max, message) => Math.max(max, message.id), 0);
    this.idCounter.set(maxId);
  }

  private isChatMessage(value: unknown): value is ChatMessage {
    if (typeof value !== 'object' || value === null) return false;

    const candidate = value as Partial<ChatMessage>;
    const validRole = candidate.role === 'user' || candidate.role === 'assistant';
    const validSource =
      candidate.source === undefined ||
      candidate.source === 'faq' ||
      candidate.source === 'ai' ||
      candidate.source === 'fallback';

    return (
      typeof candidate.id === 'number' &&
      Number.isFinite(candidate.id) &&
      validRole &&
      typeof candidate.text === 'string' &&
      validSource
    );
  }

  private getFallbackStarters(): string[] {
    return [
      '¿Qué tecnologías usás?',
      '¿Qué proyecto destacás?',
      '¿Tenés experiencia con NestJS?',
      '¿Cómo te puedo contactar?',
    ];
  }

  private getChatErrorMessage(): string {
    return 'No se pudo obtener respuesta del chatbot. Probá nuevamente en unos segundos.';
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }

  private createSessionId(): string {
    if (typeof window === 'undefined') {
      return `portfolio-web-${Date.now()}`;
    }

    const storageKey = 'portfolio-chat-session-id';
    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `portfolio-web-${Date.now()}`;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) return stored;
      window.localStorage.setItem(storageKey, generated);
    } catch {
      // El chat conserva una sesión en memoria cuando el navegador bloquea Storage.
    }
    return generated;
  }
  protected updateSuggestionsOverflow() {
    const element = this.suggestions()?.nativeElement;
    this.moreSuggestions.set(
      !!element && element.scrollWidth - element.clientWidth - element.scrollLeft > 1,
    );
  }
}
