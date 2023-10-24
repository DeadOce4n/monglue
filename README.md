# Monglue

A thin wrapper around MongoDB's official adapter for Node.js with type-safe joins.
Very limited feature set and highly experimental, use under your own risk!

## Installation

Use your favorite package manager:

```sh
pnpm add monglue
```

## To do:

- [ ] A lot of collection methods (`aggregate`, `deleteOne/deleteMany`, etc.)
- [ ] Setting up CI/CD
- [ ] Documentation (typedoc? Docusaurus?)

## Development

Run tests in watch mode:

```sh
pnpm test
```

Run tests with coverage reporting:
```sh
pnpm test:coverage
```

Run typechecking in watch mode:

```sh
pnpm test:types
```

Run and exit typechecking:

```sh
CI=true pnpm test:types
```

Lint and format:

```sh
pnpm lint
pnpm format
```
