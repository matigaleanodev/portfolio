import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './ui/toast/toast.component';
import { ChatComponent } from './sections/chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ChatComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
