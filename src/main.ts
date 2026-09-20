import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/provide';
import { IonicRouteStrategy } from '@ionic/angular/ionic-route-strategy';

import { installFoldablePolyfill } from '@erkamyaman/capacitor-foldable';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

void installFoldablePolyfill({ ionicKeyboard: true });

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(routes),
  ],
}).catch((error: unknown) => console.error(error));
