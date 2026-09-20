import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeNavigation } from '@capgo/capacitor-native-navigation';
import type { PluginListenerHandle } from '@capacitor/core';

import { FreePage } from '../free/free.page';
import { GamePage } from '../game/game.page';
import { HingeService } from '../game/hinge.service';

const ACTIVE = '#DB3E13';
const INACTIVE = '#5C5F66';

const TINTS = { tint: ACTIVE, inactiveTint: INACTIVE };

const GAME_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M467.51 248.83c-18.4-83.18-45.69-136.24-89.43-149.17A91.5 91.5 0 0 0 352 96c-26.89 0-48.11 16-96 16s-69.15-16-96-16a99 99 0 0 0-27.2 3.66C89 112.59 61.94 165.7 43.33 248.83c-19 84.91-15.56 152 21.58 164.88 26 9 49.25-9.61 71.27-37 25-31.2 55.79-40.8 119.82-40.8s93.62 9.6 118.66 40.8c22 27.41 46.11 45.79 71.42 37.16 41.02-14.01 40.44-79.13 21.43-165.04Z\" fill=\"none\" stroke=\"currentColor\" stroke-miterlimit=\"10\" stroke-width=\"32px\"/><circle cx=\"292\" cy=\"224\" r=\"20\"/><path d=\"M336 288a20 20 0 1 1 20-19.95A20 20 0 0 1 336 288\"/><circle cx=\"336\" cy=\"180\" r=\"20\"/><circle cx=\"380\" cy=\"224\" r=\"20\"/><path d=\"M160 176v96M208 224h-96\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32px\"/></svg>";
const METER_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"m326.1 231.9-47.5 75.5a31 31 0 0 1-7 7 30.11 30.11 0 0 1-35-49l75.5-47.5a10.23 10.23 0 0 1 11.7 0 10.06 10.06 0 0 1 2.3 14\"/><path d=\"M256 64C132.3 64 32 164.2 32 287.9a223.18 223.18 0 0 0 56.3 148.5c1.1 1.2 2.1 2.4 3.2 3.5a25.19 25.19 0 0 0 37.1-.1 173.13 173.13 0 0 1 254.8 0 25.19 25.19 0 0 0 37.1.1l3.2-3.5A223.18 223.18 0 0 0 480 287.9C480 164.2 379.7 64 256 64\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32px\"/><path d=\"M256 128v32M416 288h-32M128 288H96M165.49 197.49l-22.63-22.63M346.51 197.49l22.63-22.63\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"32px\"/></svg>";

/**
 * Icons carry their own colour. iOS 26+ hands template-image tinting to Liquid
 * Glass, which paints the selected tab in the system accent whatever the
 * plugin is told.
 */
const paint = (svg: string, color: string) => ({
  svg: svg.replaceAll('currentColor', color).replace('<svg ', `<svg fill="${color}" `),
  template: false,
});

const TABS = [
  {
    id: 'game',
    title: 'Game',
    icon: paint(GAME_SVG, INACTIVE),
    selectedIcon: paint(GAME_SVG, ACTIVE),
  },
  {
    id: 'free',
    title: 'Meter',
    icon: paint(METER_SVG, INACTIVE),
    selectedIcon: paint(METER_SVG, ACTIVE),
  },
];

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [FreePage, GamePage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hinge = inject(HingeService);

  /** The native bar replaces the HTML one wherever the plugin can run. */
  readonly native = Capacitor.isNativePlatform();

  private listener: PluginListenerHandle | null = null;
  private readonly ready = signal(false);

  /** Which view is on screen. */
  readonly mode = signal<'game' | 'free'>('game');
  private applied: string | null = null;

  private async showTabs(visible: boolean): Promise<void> {
    if (!visible) {
      await NativeNavigation.configure({ enabled: false });
      // The bar is rebuilt from scratch when it comes back.
      this.applied = null;
      return;
    }

    await NativeNavigation.configure({ enabled: true, contentInsetMode: 'css' });
    await this.applyBar(this.currentTab());
  }

  /** Every update carries the whole bar: a partial one empties it. */
  private async applyBar(selectedId: string): Promise<void> {
    if (this.applied === selectedId) return;

    await NativeNavigation.setTabbar({
      tabs: TABS,
      selectedId,
      colors: TINTS,
      labels: false,
    });
    this.applied = selectedId;
  }

  /**
   * Both modes are views of one instrument, so switching swaps the view in
   * place. Routing between them meant mounting a lazy page on every tap, which
   * showed as a blank frame and a sideways slide.
   */
  private switchTo(id: string): void {
    this.applied = id;
    this.mode.set(id === 'free' ? 'free' : 'game');
  }

  private currentTab(): string {
    return this.mode();
  }

  constructor() {
    if (this.native) {
      void this.startNativeTabs();

      // The tab bar has nothing to switch between while the phone is closed.
      effect(() => {
        const open = this.hinge.open();
        if (!this.ready()) return;
        // Capgo's `hidden: true` never comes back, so park the bar off screen instead.
        void this.showTabs(open);
      });
      this.destroyRef.onDestroy(() => void this.listener?.remove());
    }
  }

  private async startNativeTabs(): Promise<void> {
    // Hand the tints over before the bar exists, so it never paints in the
    // platform's default blue first.
    await NativeNavigation.configure({ contentInsetMode: 'css', colors: TINTS });
    await this.showTabs(this.hinge.open());

    this.ready.set(true);

    this.listener = await NativeNavigation.addListener('tabSelect', ({ id }) => {
      this.switchTo(id);
    });
  }
}
