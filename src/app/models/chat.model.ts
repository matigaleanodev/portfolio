export type ChatSource = 'faq' | 'ai' | 'fallback';

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestDto {
  message: string;
  sessionId?: string;
  history?: ChatHistoryTurn[];
}

export interface ChatResponseDto {
  answer: string;
  suggestedQuestions: string[];
  source: ChatSource;
}

export interface ChatStartersResponseDto {
  suggestedQuestions: string[];
}
