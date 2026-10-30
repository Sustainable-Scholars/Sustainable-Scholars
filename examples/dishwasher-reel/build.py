import json
E=json.load(open("edit_map.json"))
fonts=open("fonts.css").read(); lib=open("lib.js").read()
js=f"const EDIT={json.dumps(E)};\n"+lib+"\n"+open("core.js").read()+"\n"+open("scenes.js").read()+"\n"+open("audio.js").read()
open("reel.html","w").write(f'<!doctype html><html><head><meta charset="utf-8"><title>reel</title><style>{fonts}\nhtml,body{{margin:0;background:#000}}#stage *{{box-sizing:border-box}}</style></head><body><div id="stage"></div><script>{js}</script></body></html>')
open("reel.check.js","w").write(js); print("built", len(js)//1024, "KB")
