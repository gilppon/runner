# Human listening review samples

These files capture the game's Web Audio output from an isolated local production build. They are for listening review only and are not portal assets.

- `lobby-bgm-listen.mp3` — 15.48 seconds of the lobby track; stereo MP3, 44.1 kHz, 132,380 bytes.
- `gameplay-bgm-listen.mp3` — 15.48 seconds of gameplay audio; stereo MP3, 44.1 kHz, 244,578 bytes. It includes the music mix and naturally occurring game sounds.
- `gameplay-bgm-long-listen.mp3` — 62.52 seconds of music from the actual `AudioManager` scheduler, stereo MP3 at 44.1 kHz / 128 kb/s, 1,001,473 bytes. An isolated QA page captured music without sound effects and changed the 2D/3D timbre at 16-second intervals. It loaded no game save or portal SDK; browser console errors/warnings: 0.

The samples make the music available for human review; they do not establish a positive listening assessment. The 62-second music-only sample complements the short gameplay mix, which retains naturally occurring effects for a masking check.

## Objective signal profile

FFmpeg `loudnorm` and true-peak analysis measured the lobby sample at −28.06 LUFS integrated, 1.10 LU LRA, and −5.64 dBTP. The gameplay sample, including sound effects, measured −22.17 LUFS, 6.30 LU LRA, and −2.67 dBTP. Neither sample reaches 0 dBTP; the short gameplay capture is about 5.9 LU louder than the lobby capture. Treat that difference as a listening cue, not an automatic defect: the gameplay file includes effects. These 15.48-second excerpts do not establish long-session repetition, melody quality, perceived balance, or masking. Listen to both at the same device volume and check the lobby-to-game level change, whether effects cover the music, and whether the phrase becomes tiring when repeated.

The 62.52-second music-only gameplay capture measures −25.93 LUFS integrated, 1.00 LU LRA, and −5.91 dBTP. It fully decodes and has no clipping; its final 0.5 seconds are silence after capture stopped. The source browser recording emitted an Opus packet warning at the file boundary, but the converted MP3 is intact through its full reported duration. This profile does not include sound effects, so use the shorter mixed sample for the effects-masking judgment.

From the current Web Audio scheduler, the lobby's 32-step pattern repeats about every 4.62 seconds (104 BPM) and the game's 128-step phrase about every 14.12 seconds (136 BPM). The short samples cover roughly 3.35 lobby cycles and 1.10 gameplay cycles; the longer music-only capture covers about 13.5 lobby cycles or 4.43 game phrases. This makes phrase repetition easier to assess, but it is still only a 62-second excerpt, not a long play session.
