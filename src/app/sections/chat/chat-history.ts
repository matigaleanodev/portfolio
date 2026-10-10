import { ChatHistoryTurn, ChatRequestDto } from '../../models/chat.model';

/** Conserva contexto reciente dentro de los límites de caracteres y bytes de la API. */
export function buildChatRequest(
  message: string,
  sessionId: string,
  turns: readonly ChatHistoryTurn[],
): ChatRequestDto {
  const history = turns
    .map((turn) => ({
      role: turn.role,
      content: turn.content
        .trim()
        .slice(0, 1500)
        .replace(/[\uD800-\uDBFF]$/u, '')
        .trim(),
    }))
    .filter((turn) => turn.content.length > 0)
    .slice(-6);
  const dto = { message, sessionId: sessionId.slice(0, 100), history };
  const encoder = new TextEncoder();
  // El límite HTTP es 16 KiB; dejamos margen y quitamos primero los turnos más antiguos.
  while (history.length > 0 && encoder.encode(JSON.stringify(dto)).byteLength > 15 * 1024) {
    history.shift();
  }
  return dto;
}
