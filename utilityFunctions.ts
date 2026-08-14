// // Import the 'fs' module (Node.js built-in)
// import * as fs from 'fs';
// /**
//  * Loops through an array of objects and creates a JSON file for each object.
//  * The naming convention is bestiary-part-${i+1}.
//  *
//  * @param beasts Array of objects to be written to separate files.
//  */
// function writeBeastFiles(beasts: any): void {
//   for (let i = 0; i < beasts.length; i++) {
//     const beast = beasts[i];
//     const filename = `bestiary-part-${i + 1}.json`;
//     const content = JSON.stringify([beast]);
//     fs.writeFileSync(filename, content);
//   }
// }

// import fullBestiary from './public/data/5e/bestiary-complete.json';

// writeBeastFiles(fullBestiary);
