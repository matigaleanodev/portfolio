import { FragmentLinkDirective } from '../../ui/fragment-link.directive';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [FragmentLinkDirective],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {}
