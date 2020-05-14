/* jshint esversion: 9 */

export const extract = {
  // return a copy of the first element which starts with 'prefix' in 'array'
  startsWithInArray(prefix, array) {
    return array.find((element) => element.startsWith(prefix));
  },
  // return what's left to column (character: ':') in 'string'
  //  return entire string if no column found
  leftToColumn(string) {
    const result = /^(.*):.*$/.exec(string);
    return result === null ? string : result[1];
  },
};

export function toHex(value, nbDigits) {
  const hex = value.toString(16).toUpperCase();
  let fill = "";
  for (let i = 0; i < nbDigits - hex.length; i++) {
    fill += "0";
  }
  return `${fill}${hex}`;
}

// returns an object whose property, values pairs are given by separate arguments
// example: makeObject("a", 1, "b", 2) returns { a: 1, b: 2 }
export function makeObjectFrom(...args) {
  return args.reduce(
    (acc, element, index) => {
      if (index % 2 === 0) {
        acc.currentProperty = element; // if odd number of args provided, last property will be ignored
      } else {
        acc.object[acc.currentProperty] = element;
      }
      return acc;
    },
    { object: {}, currentProperty: null }
  ).object;
}

export function arrayContainsELement(array, element) {
  return array.some((currentElement) => currentElement === element);
}
