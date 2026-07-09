# Sound credits

`correct.wav` and `incorrect.wav` are from Kenney's **Interface Sounds** pack
(https://kenney.nl/assets/interface-sounds), licensed **CC0** (public domain —
no attribution required, credited here anyway).

- `correct.wav` = `confirmation_001.wav`
- `incorrect.wav` = `error_007.wav`

## Note: `incorrect.wav` has 350 ms of trailing silence

`correct.wav` is the unmodified Kenney clip. `incorrect.wav` has 350 ms of
silence appended after the original sound (0.2 s → 0.55 s total).

The raw incorrect buzzer was short enough (~0.2 s) that on Android (ExoPlayer,
via expo-audio) it was intermittently dropped entirely — the clip finished
before the audio path reliably rendered it. Simply making the clip longer fixes
that. The silence goes at the *end*, not the start, so the audible sound still
fires immediately (no perceived delay), and if a rapid next answer restarts the
player mid-clip, the restart lands in the trailing silence instead of cutting off
audible sound (which would click). To regenerate from a fresh CC0 download:

    ffmpeg -i incorrect_original.wav -f lavfi -t 0.35 -i anullsrc=r=44100:cl=mono \
      -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" \
      -map "[out]" -c:a pcm_s16le -ar 44100 -ac 1 incorrect.wav
