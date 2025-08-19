# Background videos

Place your green-screen football player videos in this folder.

Default filenames expected by the homepage:

- `player_1.webm`
- `player_2.webm`
- `player_3.webm`

You can change these names in `src/pages/Index.tsx` where the `GreenScreenBackground` `sources` prop is defined.

Recommendations:

- Use WebM/VP9 or MP4/H.264 with an even, vibrant green background for best keying results
- Keep files short and loopable; < 10–15s each
- Keep resolution moderate (e.g., 720p); the renderer pixelates and scales, so ultra-high-res is unnecessary

