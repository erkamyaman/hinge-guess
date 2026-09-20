import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

const PIVOT = 100;
const ARM = 88;
const SCALE = 74;
const SWEEP = 34;

/** Screen-space point for an arm opened `degrees` from the fixed arm. */
const pointAt = (degrees: number, radius: number) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: PIVOT - radius * Math.cos(radians),
    y: PIVOT - radius * Math.sin(radians),
  };
};

const sweepPath = (degrees: number) => {
  const open = Math.max(0.01, Math.min(179.99, degrees));
  const start = pointAt(0, SWEEP);
  const end = pointAt(open, SWEEP);
  return `M ${start.x} ${start.y} A ${SWEEP} ${SWEEP} 0 0 1 ${end.x} ${end.y}`;
};

@Component({
  selector: 'app-angle-dial',
  templateUrl: 'angle-dial.component.html',
  styleUrls: ['angle-dial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngleDialComponent {
  /** The arm this dial is about, in degrees. */
  readonly angle = input.required<number>();

  /** `live` follows the hinge, `goal` sweeps into place like a needle. */
  readonly kind = input<'goal' | 'live'>('goal');

  /** A second arm, drawn in the signal colour: where the phone actually was. */
  readonly compare = input<number | null>(null);

  readonly pivot = PIVOT;
  readonly armLength = ARM;

  /** What the dial draws right now: it sweeps to the angle rather than jumping. */
  private readonly drawn = signal(0);
  private frame = 0;
  private arrived = false;

  readonly shown = this.drawn.asReadonly();
  readonly sweep = computed(() => sweepPath(this.drawn()));

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));

    effect(() => {
      const target = this.angle();
      const live = this.kind() === 'live';

      untracked(() => {
        // A live needle only sweeps on the way in, then it follows the hinge.
        if (live && this.arrived) {
          this.drawn.set(target);
          return;
        }

        this.sweepTo(target, live ? 700 : 600);
      });
    });
  }

  /** Sweep in from zero again, for instance when the page comes back. */
  replay(): void {
    this.arrived = false;
    this.drawn.set(0);
    this.sweepTo(this.angle(), 700);
  }

  readonly marks = computed(() =>
    Array.from({ length: 19 }, (_, index) => index * 10).map((degrees) => {
      const major = degrees % 30 === 0;
      return {
        degrees,
        major,
        numbered: major && degrees > 0 && degrees < 180,
        from: pointAt(degrees, SCALE),
        to: pointAt(degrees, major ? SCALE - 11 : SCALE - 6),
        label: pointAt(degrees, SCALE + 13),
      };
    }),
  );

  readonly scaleArc = computed(() => {
    const start = pointAt(0, SCALE);
    const end = pointAt(180, SCALE);
    return `M ${start.x} ${start.y} A ${SCALE} ${SCALE} 0 0 1 ${end.x} ${end.y}`;
  });

  private sweepTo(target: number, duration: number): void {
    cancelAnimationFrame(this.frame);

    const from = this.drawn();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.drawn.set(target);
      this.arrived = true;
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.drawn.set(from + (target - from) * eased);
      if (progress < 1) this.frame = requestAnimationFrame(step);
      else this.arrived = true;
    };

    this.frame = requestAnimationFrame(step);
  }
}
