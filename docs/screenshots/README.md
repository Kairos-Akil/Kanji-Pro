# Screenshots

These are the app screenshots shown in the main [`README.md`](../../README.md).

| File | Shows |
| --- | --- |
| `homePage.jpeg` | Home screen |
| `quizPage.jpeg` | A quiz in progress |
| `learningPage.jpeg` | Learning Mode revealing an answer |
| `infoPage.jpeg` | Kanji info modal (with radicals) |
| `searchPage.jpeg` | Search |
| `settingsPage.jpeg` | Settings sheet |


`ffmpeg` (values are for a 712×1600 capture; adjust the height/offset):

    ffmpeg -i raw.jpeg -vf "crop=712:1440:0:100" -q:v 2 homePage.jpeg

`crop=W:H:X:Y` keeps a `W×H` region starting at `(X, Y)` from the top-left, so
`0:100` drops the top 100 px (status bar) and the reduced height drops the pill.
