import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonButton } from '@ionic/angular/ion-button';
import { IonContent } from '@ionic/angular/ion-content';

import { AngleDialComponent } from '../shared/angle-dial.component';
import { UnfoldPromptComponent } from '../shared/unfold-prompt.component';
import { HingeService } from './hinge.service';

const MIN_GOAL = 30;
const MAX_GOAL = 165;

const QUOTES = {
  poor: ['Have you seen a hinge before?', 'Not quite!', 'Your folding needs work.'],
  fair: ['Not too shabby.', 'Getting sharper.', 'Almost there.'],
  great: ['Your folds are on point!', 'Wow, so precise!', 'Perfect fold!'],
};

interface Result {
  goal: number;
  actual: number;
  accuracy: number;
  quote: string;
}

const pick = (list: string[]): string => list[Math.floor(Math.random() * list.length)];

const quoteFor = (accuracy: number): string => {
  if (accuracy < 50) return pick(QUOTES.poor);
  if (accuracy < 85) return pick(QUOTES.fair);
  return pick(QUOTES.great);
};

const randomGoal = (): number => Math.round(MIN_GOAL + Math.random() * (MAX_GOAL - MIN_GOAL));

@Component({
  selector: 'app-game',
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss'],
  imports: [AngleDialComponent, IonButton, IonContent, UnfoldPromptComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage {
  private readonly hinge = inject(HingeService);

  readonly foldable = this.hinge.foldable;
  readonly liveAngle = this.hinge.angle;
  readonly open = this.hinge.open;

  readonly goal = signal(randomGoal());
  readonly level = signal(1);
  readonly result = signal<Result | null>(null);

  private readonly totalAccuracy = signal(0);

  readonly averageAccuracy = computed(() =>
    this.level() > 1 ? Math.round(this.totalAccuracy() / (this.level() - 1)) : null,
  );

  guess(): void {
    const live = this.liveAngle();
    if (live === null || this.result() !== null) return;

    const actual = Math.round(live);
    const accuracy = Math.max(0, Math.round(100 - (Math.abs(this.goal() - actual) / 90) * 100));

    this.result.set({ goal: this.goal(), actual, accuracy, quote: quoteFor(accuracy) });
    this.totalAccuracy.update((total) => total + accuracy);
  }

  next(): void {
    this.result.set(null);
    this.level.update((level) => level + 1);
    this.goal.set(randomGoal());
  }
}
