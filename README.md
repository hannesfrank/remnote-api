# RemNote API

The official RemNote API just provides the most basic functionality to add content to RemNote.
This project aims to provide an easy to use wrapper around this API to make developing plugins more productive.

**Features:**

- [x] commonly used functions (get Rem text, add image, add link, add tag)
- [ ] docstrings and type definitions to improve editor support
- [ ] polyfills for things that are not possible yet with the API, but can be somehow be emulated (subscribe to changes on a Rem, adding specific elements)
- [ ] transparent interface
  - iterate all children loading them from the database automatically
- [ ] Experimental: Communicate with the parent window when it runs user scripts.
  - Queries

I try to use SemVer to indicate breaking changes.

## TODO

- [ ] Documentation
  - [ ] Add docstrings functions including type definitions to enable auto-complete/IntelliSenses.
- [ ] Testing
  - [ ] Make a separate RemNote account with a demo documents which include all data. Export raw JSON.
  - [ ] Make an adapter to work with the raw export.
- [ ] Publish to npm. This is more long term if people start using this. Currently I include it as submodule which provides more flexibility for me since I can edit the API wrapper, test and use the changes and publish them directly from the repository.
