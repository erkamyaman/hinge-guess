import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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

  /** A playful name for how the phone is being held right now. */
  readonly pose = computed(() => {
    const angle = this.liveAngle();
    if (angle === null) return '';
    if (angle < 25) return 'Nearly shut';
    if (angle < 80) return 'Acute';
    if (angle < 100) return 'Square';
    if (angle < 165) return 'Obtuse';
    return 'Straight';
  });
}
