# package-patcher

A small tool to create and apply patches on your node_modules using node resolve and jsdiff

## Features
- Supports all package managers(npm,yarn,pnpm) via node resolve
- Backward compatibility with applying patches from `patch-package`


## Installation
- npm
```npm i -D package-patcher```

## Usage

### Creating patch
1. Update the package inside your node_modules/packages folder
2. Run `npx package-patcher create <package-name>`
3. It will create a patch file in patches folder

### Apply patch
Run `npx package-patcher apply`

You can also add apply patch as your post install script
package.json
```json
{
  "scripts":{
    "apply-patch": "package-patcher apply",
    "postinstall": "npm run apply-patch"
  }
}
```


## Known limitation
- Only supports npm registry for now
- Need to install in project as dev dependency to use it (global installation might not work)
