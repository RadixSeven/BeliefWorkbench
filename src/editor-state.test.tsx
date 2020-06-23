import { ExpectedValueType } from "./nodes_type";
import { checkConstantValue, checkTitle } from "./editor-state";

function isValidValue(value: string, type: ExpectedValueType): boolean {
  return checkConstantValue(value, type).isValid;
}

test("checkConstantValue accepts normal numbers as Numbers", () => {
  expect(isValidValue("0", "Number")).toBe(true);
  expect(isValidValue("2", "Number")).toBe(true);
  expect(isValidValue(" 2 ", "Number")).toBe(true);
  expect(isValidValue("+1", "Number")).toBe(true);
  expect(isValidValue("-0", "Number")).toBe(true);
  expect(isValidValue("-7", "Number")).toBe(true);
  expect(isValidValue("-7.5", "Number")).toBe(true);
  expect(isValidValue("7.5e2", "Number")).toBe(true);
  expect(isValidValue("7.5e+2", "Number")).toBe(true);
  expect(isValidValue("7.5e-2", "Number")).toBe(true);
  expect(isValidValue("75e+2", "Number")).toBe(true);
  expect(isValidValue("75e-2", "Number")).toBe(true);
});

test("checkConstantValue rejects the empty string as a Number", () => {
  expect(isValidValue("", "Number")).toBe(false);
});

test("checkConstantValue rejects NaN as a Number", () => {
  expect(isValidValue("Nan", "Number")).toBe(false);
  expect(isValidValue("nan", "Number")).toBe(false);
  expect(isValidValue("NaN", "Number")).toBe(false);
});
test("checkConstantValue rejects Infinity as a Number", () => {
  expect(isValidValue("Infinity", "Number")).toBe(false);
  expect(isValidValue("infinity", "Number")).toBe(false);
  expect(isValidValue("inf", "Number")).toBe(false);
});

test("checkConstantValue rejects JSON for other types as a Number", () => {
  expect(isValidValue("[1,2,3]", "Number")).toBe(false);
  expect(isValidValue("{velma: 3}", "Number")).toBe(false);
  expect(isValidValue("schnoz-berry", "Number")).toBe(false);
});

test("checkConstantValue rejects strings starting with numbers as Number", () => {
  expect(isValidValue("1 wonky", "Number")).toBe(false);
  expect(isValidValue("2ugly", "Number")).toBe(false);
  expect(isValidValue("3.1.3", "Number")).toBe(false);
  expect(isValidValue("75e+", "Number")).toBe(false);
});

test("checkConstantValue null as Number", () => {
  expect(isValidValue("null", "Number")).toBe(false);
});

test("checkConstantValue accepts lists for other types as list", () => {
  expect(isValidValue("[1,2,3]", "List")).toBe(true);
  expect(isValidValue("1,2,3", "List")).toBe(true);
  expect(isValidValue("[1]", "List")).toBe(true);
  expect(isValidValue("[]", "List")).toBe(true);
  expect(isValidValue(" [] ", "List")).toBe(true);
  expect(isValidValue(" ", "List")).toBe(true);
  expect(isValidValue("1", "List")).toBe(true);
  expect(isValidValue('"one"', "List")).toBe(true);
  expect(isValidValue('"1", "two", 3', "List")).toBe(true);
  expect(isValidValue("[1,2,3]", "List")).toBe(true);
  expect(isValidValue("[[1,2,3]]", "List")).toBe(true);
  expect(isValidValue('[1,"two",3]', "List")).toBe(true);
});
test("checkConstantValue accepts lists with sub-lists as list", () => {
  expect(isValidValue("[[1,2,3]]", "List")).toBe(true);
  expect(isValidValue('[[1,"one"],[3, "three"]]', "List")).toBe(true);
  expect(isValidValue('[[1,"one"],["three", 3]]', "List")).toBe(true);
});

test("checkConstantValue rejects semi-lists as list", () => {
  expect(isValidValue("1,2,3]", "List")).toBe(false);
  expect(isValidValue("[1,2,3", "List")).toBe(false);
  expect(isValidValue("[1,2,3]]", "List")).toBe(false);
  expect(isValidValue("[[1,2,3]", "List")).toBe(false);
});

test("checkConstantValue rejects unquoted strings as list", () => {
  expect(isValidValue("schnoz", "List")).toBe(false);
});

test("checkConstantValue rejects null as list", () => {
  expect(isValidValue("null", "List")).toBe(false);
});

test("checkConstantValue rejects objects as list", () => {
  expect(isValidValue('{"seven":7}', "List")).toBe(false);
  expect(isValidValue('1,{"seven":7},8', "List")).toBe(false);
});

test("checkConstantValue rejects infinity and NaN as a List", () => {
  expect(isValidValue("Nan", "Number")).toBe(false);
  expect(isValidValue("nan", "Number")).toBe(false);
  expect(isValidValue("NaN", "Number")).toBe(false);
  expect(isValidValue("Infinity", "Number")).toBe(false);
  expect(isValidValue("infinity", "Number")).toBe(false);
  expect(isValidValue("inf", "Number")).toBe(false);
});

test("checkConstantValue accepts everything as text", () => {
  expect(isValidValue("Nan", "Text")).toBe(true);
  expect(isValidValue("nan", "Text")).toBe(true);
  expect(isValidValue("NaN", "Text")).toBe(true);
  expect(isValidValue("Infinity", "Text")).toBe(true);
  expect(isValidValue("infinity", "Text")).toBe(true);
  expect(isValidValue("inf", "Text")).toBe(true);
  expect(isValidValue("1 wonky", "Text")).toBe(true);
  expect(isValidValue("2ugly", "Text")).toBe(true);
  expect(isValidValue("3.1.3", "Text")).toBe(true);
  expect(isValidValue("75e+", "Text")).toBe(true);
  expect(isValidValue("[1,2,3]", "Text")).toBe(true);
  expect(isValidValue("1,2,3]", "Text")).toBe(true);
  expect(isValidValue("[1,2,3", "Text")).toBe(true);
});

test("checkTitle works", () => {
  expect(checkTitle(["foo", "bar", "baz"], "foo", "bar").isValid).toBe(false);
  expect(checkTitle(["foo", "bar", "baz"], "foo", "fo").isValid).toBe(true);
  expect(checkTitle(["foo", "bar", "baz"], "foo", "foo").isValid).toBe(true);
});
