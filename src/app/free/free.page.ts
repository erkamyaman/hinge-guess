import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/ion-content';

import { AngleDialComponent } from '../shared/angle-dial.component';
import { HingeService } from '../game/hinge.service';
import { UnfoldPromptComponent } from '../shared/unfold-prompt.component';

@Component({
  selector: 'app-free',
  templateUrl: 'free.page.html',
  styleUrls: ['../game/game.page.scss'],
  imports: [AngleDialComponent, DecimalPipe, IonContent, UnfoldPromptComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreePage {
  private readonly hinge = inject(HingeService);

  readonly foldable = this.hinge.foldable;
  readonly liveAngle = this.hinge.angle;
  readonly open = this.hinge.open;
  readonly ticks = signal(0);

  constructor() {
    effect(() => {
      this.liveAngle();
      this.ticks.update((n) => n + 1);
    });
  }

  /** A playful name for how the phone is being held right now. */
  readonly pose = computed(() => {
    const angle = this.liveAngle();
    if (angle === null) return '';
    if (angle < 25) return 'Nearly shut';
    if (angle < 80) return 'Book mode';
    if (angle < 110) return 'Right angle!';
    if (angle < 165) return 'Wide open';
    return 'Flat out';
  });
}
