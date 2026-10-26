import sys
name=sys.argv[1]
fonts=open("src/fonts.css").read(); lib=open("src/lib.js").read(); page=open(f"src/{name}.js").read()
open(f"out/{name}.html","w").write(f"""<!doctype html><html><head><meta charset="utf-8"><title>{name}</title><style>{fonts}
html,body{{margin:0;background:#111}}#stage *{{box-sizing:border-box}}</style></head><body><div id="stage"></div><script>{lib}
{page}</script></body></html>""")
open(f"out/{name}.check.js","w").write(lib+"\n"+page)
print("built out/%s.html"%name)
