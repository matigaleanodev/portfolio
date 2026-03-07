import { Component } from '@angular/core';
import { ContactComponent } from '../../sections/contact/contact.component';
import { HeroComponent } from '../../sections/hero/hero.component';
import { ProjectsComponent } from '../../sections/projects/projects.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, ProjectsComponent, ContactComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage {}
