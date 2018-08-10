# Opiskelijakeskus

Source of opiskelijakeskus.fi; using browserify to bundle dependecies with source.

Run the following to get required modules and bundled JS files:
  ```bash
  npm install
  browserify index.js -o bundle.js
  ```
  
Or alternatively use watchify for development:
  ```bash
  watchify index.js -o bundle.js
  ```
  
Local PHP server can be run for development:
  ```bash
  php -S localhost:8000
  ```
