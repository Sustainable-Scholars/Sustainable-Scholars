import json
E=json.load(open("edit_map.json"))
fonts=open("fonts.css").read(); lib=open("lib.js").read()
core=open("core.js").read(); sc=open("scenes.js").read(); au=open("audio.js").read()
js=f"const EDIT={json.dumps(E)};\n"+lib+"\n"+core+"\n"+sc+"\n"+au
open("short.html","w").write(f'<!doctype html><html><head><meta charset="utf-8"><title>short</title><style>{fonts}\nhtml,body{{margin:0;background:#000}}#stage *{{box-sizing:border-box}}</style></head><body><div id="stage"></div><script>{js}</script></body></html>')
open("short.check.js","w").write(js)
print("built short.html", len(js)//1024, "KB js")
