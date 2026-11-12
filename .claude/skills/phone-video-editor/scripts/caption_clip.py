#!/usr/bin/env python3
"""Make a captioned 9:16 clip in the saved brand style. Never touches the input.
usage: caption_clip.py INPUT OUTPUT [--start S] [--dur D] [--words words.json] [--pos 0.62]
words.json = [[start,end,"word"],...] in the INPUT's timeline (from Whisper or pasted captions).
Without --words it tries faster-whisper."""
import argparse, json, os, subprocess, sys, tempfile
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
ap = argparse.ArgumentParser(); ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--start', type=float, default=0); ap.add_argument('--dur', type=float, default=0)
ap.add_argument('--words'); ap.add_argument('--pos', type=float, default=0.62)
a = ap.parse_args()
if os.path.abspath(a.inp) == os.path.abspath(a.out): sys.exit('Refusing to overwrite the original. Use a new file name.')
brand = json.load(open(os.path.join(root, 'brand.json')))
hexrgb = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
ass_col = lambda h: '&H00%02X%02X%02X' % hexrgb(h)[::-1]
if a.words: W = json.load(open(a.words))
else:
    from faster_whisper import WhisperModel
    segs, _ = WhisperModel('small.en', compute_type='int8').transcribe(a.inp, word_timestamps=True)
    W = [[w.start, w.end, w.word.strip()] for s in segs for w in s.words]
end = a.start + a.dur if a.dur else 1e9
W = [[max(0, w[0] - a.start), w[1] - a.start, w[2]] for w in W if w[0] >= a.start - 0.01 and w[0] < end]
# chunks of up to 3 words / 16 chars, break on pauses
chunks, cur = [], []
for i, w in enumerate(W):
    cur.append(w); nxt = W[i + 1] if i + 1 < len(W) else None
    if len(cur) >= 3 or len(' '.join(x[2] for x in cur)) > 16 or (nxt and nxt[0] - w[1] > 0.3) or not nxt: chunks.append(cur); cur = []
ts = lambda t: '%d:%02d:%05.2f' % (int(t // 3600), int(t % 3600 // 60), t % 60)
font = os.path.splitext(os.path.basename(brand['font_file']))[0]
ev = []
for c in chunks:
    for k, w in enumerate(c):
        s = w[0]; e = c[k + 1][0] if k + 1 < len(c) else w[1] + 0.12
        txt = ' '.join(('{\\c%s\\fscx112\\fscy112}%s{\\c&H00FFFFFF&\\fscx100\\fscy100}' % (ass_col(brand['colors']['accent']), x[2].upper())) if j == k else x[2].upper() for j, x in enumerate(c))
        ev.append('Dialogue: 0,%s,%s,Cap,,0,0,0,,%s' % (ts(s), ts(e), txt))
y = int(1920 * a.pos)
hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,Playfair Display Black,104,&H00FFFFFF,&H00FFFFFF,{ass_col(brand['colors']['primary'])},&H80000000,0,0,0,0,100,100,0,0,1,10,3,8,50,50,{y},1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
d = tempfile.mkdtemp(); p = os.path.join(d, 'c.ass'); open(p, 'w').write(hdr + '\n'.join(ev) + '\n')
vf = f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,ass={p}:fontsdir={os.path.join(root, 'fonts')}"
cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', str(a.start)] + (['-t', str(a.dur)] if a.dur else []) + ['-i', a.inp, '-vf', vf, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', a.out]
subprocess.check_call(cmd); print('wrote', a.out)
