export type ChatSource = 'faq' | 'ai' | 'fallback';

export interface ChatRequestDto {
  message: string;
  sessionId?: string;
}

export interface ChatResponseDto {
  answer: string;
  suggestedQuestions: string[];
  source: ChatSource;
}

export interface ChatStartersResponseDto {
  suggestedQuestions: string[];
}

