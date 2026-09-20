# Hinge Guess

Guess the hinge angle. The phone is the controller: fold it until you think you have hit the target angle, then tap to score.

Built with Ionic Angular, Capacitor and [`@erkamyaman/capacitor-foldable`](https://github.com/erkamyaman/capacitor-foldable). Runs on iPhone Duo (iOS 27.1 or later) and on Android foldables with a hinge sensor.

## How it plays

- **Game.** Each round names a target between 30 and 165 degrees. Fold to it, tap **Guess**, and the round scores on how close you were. Accuracy carries over as an average across levels.
- **Meter.** The live hinge angle on a dial, with nothing to score. Useful for seeing what the sensor actually reports while you fold.
- Fold the phone shut and the game asks you to open it: there is no hinge angle to read on the outer display, so the tab bar goes away and a prompt takes the screen.

## What it uses from the plugin

| API | Used for |
| --- | --- |
| `isDeviceFoldable()` | Tell a foldable from a phone that can never play. |
| `getHingeAngle()` and `hingeAngleChange` | The live angle behind the dial and the score. |
| `getFoldState()` and `foldStateChange` | Whether the app is on the display with the fold, which decides between the game and the unfold prompt. |
| `ionic-tabs.css` | Ionic's tab bar as a pill on the side, where iPhone Duo puts native bars. |

The hinge service also polls every 300 ms and refreshes on `visibilitychange`, `focus` and `resize`. iOS pauses the web view while the app moves between displays, so events can be missed while the phone is folding.

The tab bar itself is native, through [`@capgo/capacitor-native-navigation`](https://github.com/Cap-go/capacitor-native-navigation).

## Run it

```bash
npm install
npm run build
npx cap sync
npx cap run ios      # pick the iPhone Duo simulator, Xcode 27.1 or later
```

Fold the simulator from DeviceHub, or use [`hinge`](https://github.com/artemnovichkov/hinge) to drive the angle from the terminal:

```bash
hinge sweep 180 60 2
```

## License

MIT
