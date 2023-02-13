# Figma plugins and widgets

A set of Figma plugins and widgets to enhance design workflows.

## Local Development

You need node.js and Figma desktop app to run the plugins locally.

```
npm install
npm run build
```

Each folder within `packages` is a standalone plugin which you can import and run. You will need to import `packages/<plugin>/manifest.json` in Figma desktop app first, refer to Figma's [plugin development guide](https://www.figma.com/plugin-docs/) for further information.
