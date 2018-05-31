# Opiskelijakeskus

Source of opiskelijakeskus.fi; using browserify to bundle dependecies with source.

Run the following to get required modules and bundled JS files:
  ```bash
  npm install
  browserify index.js -o bundle.js
  browserify js/new_idea.js -o js/new_idea_bundle.js
  ```
