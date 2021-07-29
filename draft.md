# Role-Based Access Control Staging Area

**Note**: this pull request is not initiated to be merged, but to have a single point status check of the project progress.


## Summary
- since multiple developers are working on this repository during GSoC, and the scope of the projects are often intersecting, therefore merge conflicts are destined to arise. 
- Ideally, this could have been resolved with Pull Request Stacking, but since Github does not provide this out of the box, it can become a bit troublesome. As any conflict in one PR will require manual fixes in the rest of the stack.
- Due to this, I believe that instead of creating PRs that'd require repeated merge-conflict fixes to track the progress, i'd push commits on this draft branch to track the program progress, and have one pull request open at a time for merging.

## Changes
- [x]  Linting and Styling
    - [x] Remove existing non-working esllit config
    - [x] Add fresh eslint config folllowing a pre-defined guide
    - [x] Add a formatter (prettier) which is in sync with eslint
    - [x] Configure tasks for linting
    - [x] Lint and format existing codebasec
- [ ] Refactoring Handlers
  - [ ] ...pending


## Todo
- add a structured list of components for visibility.