const { getIcon } = require('../dist');

function benchmark (method) {
  var start = +(new Date);

  method && method(function (callback) {
    var end = +(new Date);
    var difference = end - start;
    callback && callback(start, end, {
      milliseconds: difference,
      seconds: (difference / 1000) % 60,
      minutes: (difference / (1000 * 60)) % 60,
      hours: (difference / (1000 * 60 * 60)) % 24
    });
  });
}

const ITERATIONS = 10000;
const TEST_FILENAME = '.bithoundrc';
const TEST_EXTENSION = 'file.bf';

benchmark(function (next) {
  for (let i = 0; i < ITERATIONS; i++) {
    getIcon(TEST_FILENAME);
  }
  
  next(function (start, end, difference) {
    console.log('Finished filename benchmark with average: ' + (difference.milliseconds / ITERATIONS) + 'ms');
  });
});

benchmark(function (next) {
  for (let i = 0; i < ITERATIONS; i++) {
    getIcon(TEST_EXTENSION);
  }
  
  next(function (start, end, difference) {
    console.log('Finished extension benchmark with average: ' + (difference.milliseconds / ITERATIONS) + 'ms');
  });
});
