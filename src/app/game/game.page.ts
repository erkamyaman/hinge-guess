import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonButton } from '@ionic/angular/ion-button';
import { IonContent } from '@ionic/angular/ion-content';

import { AngleDialComponent } from '../shared/angle-dial.component';
import { UnfoldPromptComponent } from '../shared/unfold-prompt.component';
import { HingeService } from './hinge.service';

const MIN_GOAL = 30;
const MAX_GOAL = 165;

const VERDICTS = {
  poor: ['Way out.', 'Read the scale again.', 'Not this time.'],
  fair: ['Close.', 'Nearly on the mark.', 'Getting sharper.'],
  great: ['On the mark.', 'Dead on.', 'Machined.'],
};

interface Result {
  goal: number;
  actual: number;
  error: number;
  accuracy: number;
  quote: string;
}

const pick = (list: string[]): string => list[Math.floor(Math.random() * list.length)];

const quoteFor = (accuracy: number): string => {
  if (accuracy < 50) return pick(VERDICTS.poor);
  if (accuracy < 85) return pick(VERDICTS.fair);
  return pick(VERDICTS.great);
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

  /** The accuracy the readout is showing: it counts up to the score. */
  readonly shown = signal(0);
  private frame = 0;

  readonly averageAccuracy = computed(() =>
    this.level() > 1 ? Math.round(this.totalAccuracy() / (this.level() - 1)) : null,
  );

  readonly tally = computed(() => {
    const average = this.averageAccuracy();
    return average === null ? `Round ${this.level()}` : `Round ${this.level()}, average ${average}%`;
  });

  guess(): void {
    const live = this.liveAngle();
    if (live === null || this.result() !== null) return;

    const actual = Math.round(live);
    const error = Math.abs(this.goal() - actual);
    const accuracy = Math.max(0, Math.round(100 - (error / 90) * 100));

    this.result.set({ goal: this.goal(), actual, error, accuracy, quote: quoteFor(accuracy) });
    this.totalAccuracy.update((total) => total + accuracy);
    this.countUp(accuracy);
  }

  /** Run the readout up to the score, the way a gauge settles. */
  private countUp(accuracy: number): void {
    cancelAnimationFrame(this.frame);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.shown.set(accuracy);
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 520);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.shown.set(Math.round(accuracy * eased));
      if (progress < 1) this.frame = requestAnimationFrame(step);
    };

    this.shown.set(0);
    this.frame = requestAnimationFrame(step);
  }

  next(): void {
    cancelAnimationFrame(this.frame);
    this.shown.set(0);
    this.result.set(null);
    this.level.update((level) => level + 1);
    this.goal.set(randomGoal());
  }
}
