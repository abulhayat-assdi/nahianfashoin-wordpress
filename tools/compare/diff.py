import sys
from PIL import Image, ImageChops
import numpy as np
names = sys.argv[1:]
for n in names:
    a = Image.open(f'cmp/ref/{n}.png').convert('RGB'); b = Image.open(f'cmp/wp/{n}.png').convert('RGB')
    h = min(a.height, b.height)
    print(n, 'ref', a.size, 'wp', b.size, end=' ')
    if a.width != b.width:
        print(); continue
    d = np.asarray(ImageChops.difference(a.crop((0,0,a.width,h)), b.crop((0,0,b.width,h)))).sum(axis=2)
    print('diff px %.2f%%' % (100*(d>40).mean()))
    # side by side of the first 1800px
    H = min(h, 1800)
    sbs = Image.new('RGB', (a.width*2+10, H), 'red'); sbs.paste(a.crop((0,0,a.width,H)),(0,0)); sbs.paste(b.crop((0,0,b.width,H)),(a.width+10,0))
    sbs.save(f'cmp/sbs-{n}.png')
