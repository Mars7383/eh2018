# GlassCalc

Live solver for the card/carrots puzzle. Inspired by [aaa_321](https://github.com/aaa-321)'s method and <a href="https://github.com/Ninjabrain1/Ninjabrain-Bot">Ninjabrain Bot</a>.

## Downloads
Download the [latest release](https://github.com/Mars7383/eh2018/releases/latest) for your operating system

## Usage
- Press <strong>Alt/Option + C</strong> to toggle the calculator.
- While the window is visible, use <strong>Control/Command + X</strong> to cut numbers into your clipboard, and they will be added to the sum.
- Press <strong>Alt/Option + V</strong> to reset the calculator
- Press <strong>Alt/Option + N</strong> to close the calculator.

You can change the z-score value to adjust the generated upper and lower bounds for the estimated sum. The default z-score of 1.0 will ensure that the true sum falls within the bounds about 68% of the time when you input less than 28 cards. If you input all 28 cards, you'll get an exact answer every time.

<p>On Mac, if you are unable to grant accessibility permissions to the app, right click GlassCalc.app > Show Package Contents > Contents > MacOS > run GlassCalc through Terminal</p>

## Run from source
1. Install [node.js](https://nodejs.org/en/download)
2. Run `npm i -g electron@10.1.6`
3. `git clone https://github.com/Mars7383/eh2018.git && cd calc && npm i`
4. `electron .`

## Voice Calculator

Currently, the desktop app doesn't support transcribing your voice. If you'd prefer to use speech-to-text, use the web version on your phone: https://mars7383.github.io/eh2018/calc
