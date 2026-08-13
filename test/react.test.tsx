import React from "react";
import { createRouter, defineRoute } from "../src/react";
import { renderIntoDocument, act } from "react-dom/test-utils";
import { setPath } from "./setPath";

describe("react", () => {
  it("should not miss a redirect made by a descendant during initial render", () => {
    setPath("/");

    const { useRoute, routes } = createRouter({
      bar: defineRoute("/"),
      foo: defineRoute("/foo"),
    });

    const names: (string | false)[] = [];

    function Redirect() {
      routes.foo().replace();
      return null;
    }

    function Test() {
      const route = useRoute();
      names.push(route.name);
      return route.name === "bar" ? <Redirect /> : <>{route.name}</>;
    }

    act(() => {
      renderIntoDocument(<Test />);
    });

    expect(names).toEqual(["bar", "foo"]);
  });
});
