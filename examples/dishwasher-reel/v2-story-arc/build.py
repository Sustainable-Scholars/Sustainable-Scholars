import json
E=json.load(open("edit_map.json"))
js=f"const EDIT={json.dumps(E)};\n"+open("lib.js").read()+"\n"+open("reel.js").read()
open("reel.html","w").write(f'<!doctype html><html><head><meta charset="utf-8"><title>reel</title><style>{open("fonts.css").read()}\nhtml,body{{margin:0;background:#000}}#stage *{{box-sizing:border-box}}</style></head><body><div id="stage"></div><script>{js}</script></body></html>')
open("reel.check.js","w").write(js); print("built", len(js)//1024, "KB")
