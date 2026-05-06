const bcrypt = require('bcrypt');

const hash = bcrypt.hashSync('Pass1234', 10);
console.log(hash);
