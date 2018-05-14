# Opiskelijakeskus

Source of opiskelijakeskus.fi; using watchify (browserify) to bundle dependecies with source.

Run the following commands for development:
  ```bash
  watchify index.js -o bundle.js
  watchify js/new_idea.js -o js/new_idea_bundle.js
  ```
  
Using php server for development:
  ```bash
  php -S localhost:8000
  ```
