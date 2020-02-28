import { Greeter } from "../index";

test("My greeter", () => {
    expect(Greeter('Tong')).toBe('Hello Tong');
});