import json,sys
from PIL import Image
out,vn,name=sys.argv[1:4]
m=json.load(open(f'{out}/{vn}-{name}.json'))
img=Image.new('RGB',(m['w'],m['H']),'white')
for f,y in m['parts']:
    s=Image.open(f); 
    # last slice is clamped: paste so its bottom aligns with page bottom
    img.paste(s,(0,y))
img.save(f'{out}/{vn}-{name}.png')
