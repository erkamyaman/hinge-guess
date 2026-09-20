import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { Foldable } from '@erkamyaman/capacitor-foldable';

@Injectable({ providedIn: 'root' })
export class HingeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listeners: PluginListenerHandle[] = [];

  private readonly angleState = signal<number | null>(null);
  private readonly foldableState = signal(false);
  private readonly openState = signal(false);

  /** Live hinge angle in degrees, or null on a device without a hinge. */
  readonly angle = this.angleState.asReadonly();

  /** Whether this device has a fold at all. */
  readonly foldable = this.foldableState.asReadonly();

  /** Whether the phone is open, so the app is on the display with the fold. */
  readonly open = this.openState.asReadonly();

  constructor() {
    void this.start();

    // Events can be missed while the phone moves between displays, so keep a
    // slow poll as a safety net.
    const poll = setInterval(() => void this.refresh(), 300);

    // iOS pauses the web view while the app moves between displays, which
    // freezes timers. Catch up as soon as it wakes.
    const wake = () => void this.refresh();
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('resize', wake);

    this.destroyRef.onDestroy(() => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
      window.removeEventListener('resize', wake);
      for (const listener of this.listeners) void listener.remove();
    });
  }

  private async refresh(): Promise<void> {
    const { angle } = await Foldable.getHingeAngle();
    if (angle !== this.angleState()) this.angleState.set(angle);

    const { hingeBounds } = await Foldable.getFoldState();
    const open = hingeBounds !== undefined;
    if (open !== this.openState()) this.openState.set(open);
  }

  private async start(): Promise<void> {
    const { foldable } = await Foldable.isDeviceFoldable();
    this.foldableState.set(foldable);

    const { angle } = await Foldable.getHingeAngle();
    this.angleState.set(angle);

    const fold = await Foldable.getFoldState();
    this.openState.set(fold.hingeBounds !== undefined);

    this.listeners.push(
      await Foldable.addListener('hingeAngleChange', ({ angle: next }) => this.angleState.set(next)),
      await Foldable.addListener('foldStateChange', ({ hingeBounds }) => {
        this.openState.set(hingeBounds !== undefined);
        void this.refresh();
      }),
    );
  }
}
