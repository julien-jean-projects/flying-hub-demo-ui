# Changelog

All notable changes to this project will be documented in this file.

## [v.0.1.0]
### Added
- Initial project setup with Vue 3, CesiumJS, TypeScript, and Tailwind CSS.
- Components for drone-specific UI interfaces.
- Support for 3D mapping and geospatial visualizations.
- Components specifically designed for drone-related user interfaces (UI).
- Updated README to reflect the inclusion of drone-specific UI components and their adaptability for other contexts.

### Changed
- Updated README to include drone-related UI components and their adaptability to other contexts.

### Fixed
- N/A

## [v0.2.1]

### Fixed
- Prevented the `vue-builder` container from exiting immediately after build by appending `tail -f /dev/null` to the entrypoint. (#1)
- Fixed `cesium:preinstall` script failure when `node_modules` was not present, ensuring robust dependency setup during container build. (#2)
- Added `.pnpm-store` to `.gitignore` to prevent accidental version control tracking of local package cache. (#3)
- Solved startup blocking issue in `vue-builder` when `node_modules` directory already existed by forcing `CI=true` during `pnpm install`. (#4)
