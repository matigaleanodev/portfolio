import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ContactDto } from '../models/contact.model';
import { environment } from '../../environments/environment';
import {
  ChatRequestDto,
  ChatResponseDto,
  ChatStartersResponseDto,
} from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.API_URL;

  sendContact(dto: ContactDto) {
    return this.http.post(`${this.baseUrl}/contact`, dto);
  }

  getChatStarters() {
    return this.http.get<ChatStartersResponseDto>(`${this.baseUrl}/chat/starters`);
  }

  sendChatMessage(dto: ChatRequestDto) {
    return this.http.post<ChatResponseDto>(`${this.baseUrl}/chat`, dto);
  }
}
