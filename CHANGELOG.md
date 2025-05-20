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

## [v0.3.0-alpha] - 2025-05-20

### Added
- Improved shortcut menu with draggable component ([#11](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/11))
- Enhanced menu with draggable functionality and RFC component ([#11](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/11))
- Added real-time mission waypoints management in UI via MQTT (exclusion zones WIP) ([#7](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/7))
- Refined drone manager UI with Tailwind transitions and strict button states ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Implemented drone creation manager and various UI fixes and refactors for compatibility ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Added update endpoint and improved drone CRUD API ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Served static multi-mission waypoints and added per-mission API endpoint ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Updated CesiumMap to handle a dynamic list of drones ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Introduced unsubscribe(topic) helper to the MQTT service ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Transmitted gimbal FOV and zoom to Cesium for dynamic vision cone ([#6](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/6))
- Subscribed to gimbal FOV telemetry and exposed it to frontend components ([#6](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/6))
- Included gimbal field of view (FOV) in backend telemetry payload ([#6](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/6))

### Changed
- Simplified navigation logic using `mapSelected` and `v-show` only ([#11](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/11))
- Centralized MQTT event handling in Pinia store and cleaned up component logic

### Fixed
- Ensured MQTT unsubscribe and proper initialization before subscribing ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Removed unnecessary overflow in drone manager component ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Made cone, vision, and waypoint path entities unselectable
- Fixed issue where cone data didn’t update correctly
- Used drone ID from telemetry to update the correct drone on the map ([#8](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/8))
- Added FOV and zoom properties to gimbal updates from the backend
- Increased height of camera/telemetry widget for better visibility
- Ensured content stays within container when resizing and properly deselected elements ([#5](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/5))
- Prevented text selection during window drag
- Replaced CSS-based resizing with JS handling for better stability ([#5](https://github.com/julien-jean-projects/flying-hub-demo-ui/issues/5))