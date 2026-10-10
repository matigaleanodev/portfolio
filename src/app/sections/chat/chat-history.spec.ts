import { describe, it, expect } from 'vitest';
import { buildChatRequest } from './chat-history';

describe('Historial enviado al chat', () => {
  it('limita a seis turnos recientes no vacíos y conserva su orden', () => {
    const turns = Array.from({ length: 9 }, (_, index) => ({
      role: 'user' as const,
      content: `Turno ${index}`,
    }));
    const dto = buildChatRequest('Actual', 'sesion', [
      ...turns,
      { role: 'assistant', content: '  ' },
    ]);
    expect(dto.history?.map((turn) => turn.content)).toEqual(
      turns.slice(-6).map((turn) => turn.content),
    );
  });

  it('respeta el límite HTTP con texto multibyte y caracteres escapados', () => {
    for (const content of ['漢'.repeat(1500), '\\'.repeat(1500), '😀'.repeat(1500)]) {
      const dto = buildChatRequest(
        '漢'.repeat(500),
        'sesion',
        Array.from({ length: 6 }, () => ({ role: 'assistant' as const, content })),
      );
      expect(new TextEncoder().encode(JSON.stringify(dto)).byteLength).toBeLessThan(16 * 1024);
      expect(dto.history?.every((turn) => turn.content.length <= 1500)).toBe(true);
      expect(dto.history?.length).toBeGreaterThan(0);
    }
  });

  it('una conversación nueva no hereda el historial de una llamada anterior', () => {
    buildChatRequest('Seguimiento', 'anterior', [{ role: 'user', content: 'Pregunta anterior' }]);
    expect(buildChatRequest('Nueva', 'nueva', []).history).toEqual([]);
  });
});
