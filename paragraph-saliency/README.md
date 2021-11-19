How can we visualize saliency across an entire paragraph?

This notebook has rifts on [ecco](https://github.com/jalammar/ecco) visualizations, using gpt2 and gradient x input saliency. 

## Develop 

Python code can be edited directly in colab. 

Interactive diagrams are created by javascript files in the sub-directories here and embedded as iframes in the notebook. To make changes, set `isDev` to `1` when calling `jsViz`:

```
jsViz(outputToSaliency(output), {'type': 'paragraph-minimap', 'isDev': 0})
```

And run a server locally: 

```
npx hot-server
```

## Deploy 

- TODO: set up hosting on github pages or bundle front end assets in a pip package.