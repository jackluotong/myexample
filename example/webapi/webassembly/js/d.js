/**
 * @date
 */
function performOperations() {
  let result = 0;
  for (let i = 0; i < 5000000; i++) {
    result += i;
  }
}

const start = new Date().getTime();
performOperations();
const stop = new Date().getTime();
const duration = stop - start;
console.log(`JavaScript Execution Time: ${duration} milliseconds`);
