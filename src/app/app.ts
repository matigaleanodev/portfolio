import { Component, signal } from '@angular/core';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ProjectsComponent } from './sections/projects/projects.component';
import { HeroComponent } from './sections/hero/hero.component';
import { ContactComponent } from './sections/contact/contact.component';
import { ToastComponent } from './ui/toast/toast.component';
import { ChatComponent } from './sections/chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    FooterComponent,
    ProjectsComponent,
    ChatComponent,
    HeroComponent,
    ContactComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('portfolio');
}
