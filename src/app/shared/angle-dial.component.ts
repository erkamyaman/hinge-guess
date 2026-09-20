import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-angle-dial',
  templateUrl: 'angle-dial.component.html',
  styleUrls: ['angle-dial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngleDialComponent {
  /** Angle to draw, in degrees. */
  readonly angle = input.required<number>();

  /** `live` follows the hinge, `goal` sweeps into place like a needle. */
  readonly kind = input<'goal' | 'live'>('goal');

  readonly pivot = { x: 110, y: 118 };
  readonly armLength = 78;
}
