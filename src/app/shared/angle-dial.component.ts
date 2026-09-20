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

/**
 * Where the arm was last seen, across every dial in the app. A dial coming
 * into view carries on from there instead of snapping back to zero.
 */
let lastDrawn = 0;

/**
 * How long a move takes: a travel time per degree, settled by how far the arm
 * has to go, the way a needle does. A nudge is quick, a sweep across the scale
 * takes its time.
 */
const FOLLOW = 0.55;
const TRAVEL = 1;

const SETTLE_MS = 140;
const MS_PER_DEGREE = 4.4;
const LONGEST_MS = 900;

const travelTime = (degrees: number, pace: number) =>
  Math.min(LONGEST_MS, SETTLE_MS + Math.abs(degrees) * MS_PER_DEGREE * pace);

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
  private readonly drawn = signal(lastDrawn);
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
        // Arm and arc read the same value, so both move over the same time.
        // A live needle follows the hinge closely; anything else takes the
        // longer way round.
        this.sweepTo(target, live && this.arrived ? FOLLOW : TRAVEL);
      });
    });
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

  private draw(degrees: number): void {
    this.drawn.set(degrees);
    lastDrawn = degrees;
  }

  private sweepTo(target: number, pace: number): void {
    cancelAnimationFrame(this.frame);

    const from = this.drawn();
    const duration = travelTime(target - from, pace);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.draw(target);
      this.arrived = true;
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.draw(from + (target - from) * eased);
      if (progress < 1) this.frame = requestAnimationFrame(step);
      else this.arrived = true;
    };

    this.frame = requestAnimationFrame(step);
  }
}
