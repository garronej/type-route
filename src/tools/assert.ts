
/** https://docs.tsafe.dev/assert */
export function assert<_T extends true>(
    condition: any,
    msg: string | (() => string) = "Wrong Assertion type-route",
): asserts condition {

    if (!condition) {
        throw new Error(typeof msg === "function" ? msg() : msg);
    }
}
