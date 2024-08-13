# Scoop fast

This package is a wrapper to speed up `scoop` commands

## Install
```cmd
scoop install git
scoop install https://github.com/tachibana-shin/scoop-fast/releases/download/v0.0.4/scoopf.json
```

## Preview

### `scoop search vscode` vs `scoopf search vscode`
> [!IMPORTANT]
> `scoopf search` only searches for packages in official `buckets` and authenticated custom `buckets`

**`scoopf search` faster ~x11.74**

![image](https://github.com/user-attachments/assets/9ec599ac-110a-4046-9c58-202dbe643eae)


## To be on

- [ ] `alias` - Manage scoop aliases
- [ ] `bucket` - Manage Scoop buckets
- [ ] `cache` - Show or clear the download cache
- [ ] `cat` - Show content of specified manifest.
- [ ] `checkup` - Check for potential problems
- [ ] `cleanup` - Cleanup apps by removing old versions
- [ ] `config` - Get or set configuration values
- [ ] `create` - Create a custom app manifest
- [ ] `depends` - List dependencies for an app, in the order they'll be installed
- [ ] `download` - Download apps in the cache folder and verify hashes
- [ ] `export` - Exports installed apps, buckets (and optionally configs) in JSON format
- [ ] `help` - Show help for a command
- [ ] `hold` - Hold an app to disable updates
- [ ] `home` - Opens the app homepage
- [ ] `import` - Imports apps, buckets and configs from a Scoopfile in JSON format
- [ ] `info` - Display information about an app
- [x] `add / install` - Install apps
- [ ] `list` - List installed apps
- [ ] `prefix` - Returns the path to the specified app
- [ ] `reset` - Reset an app to resolve conflicts
- [x] `search` - Search available apps
- [ ] `shim` - Manipulate Scoop shims
- [ ] `status` - Show status and check for new app versions
- [ ] `unhold` - Unhold an app to enable updates
- [x] `remove / uninstall` - Uninstall an app
- [ ] `update` - Update apps, or Scoop itself
- [ ] `virustotal` - Look for app's hash or url on virustotal.com
- [ ] `which` - Locate a shim/executable (similar to 'which' on Linux)

## Development
### Build
```bash
deno task build
```
