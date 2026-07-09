# UI Components

## Header

A reusable top app bar for module screens.

### Props

- `title: string`
- `userName: string`
- `weekLabel?: string`
- `avatarLabel?: string`
- `logoLabel?: string`
- `onBackPress?: () => void`
- `showBackButton?: boolean`
- `testID?: string`

### Preview

Use `HeaderPreview` to see a simple example in a development environment.

### Design notes

- Keeps the visual pattern aligned with the app shell.
- Uses a simple, high-contrast layout for readability.
- Does not contain business logic.
