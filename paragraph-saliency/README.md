
Upload

```
find . | entr rsync -a --omit-dir-times --no-perms --exclude node_modules --exclude .git "$PWD" demo@roadtolarissa.com:../../usr/share/nginx/html/colab/paragraph-saliency/
```