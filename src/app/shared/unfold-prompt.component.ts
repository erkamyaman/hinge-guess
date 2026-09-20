import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-unfold-prompt',
  templateUrl: 'unfold-prompt.component.html',
  styleUrls: ['unfold-prompt.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnfoldPromptComponent {
  readonly frames = [1, 2, 3, 4];
  readonly message = input('Guess the Angle uses the inside screen.');
}
