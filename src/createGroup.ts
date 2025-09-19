import { RouteGroup, UmbrellaRoute, UmbrellaRouteBuilder, CoreRouter } from "./types";
import { assert } from "./assert";
import { createRouter as coreCreateRouter } from "./createRouter";

function createGroup_fromItems<T extends any[]>(groupItems: T): RouteGroup<T> {
  if (__DEV__) {
    assert("createGroup", [
      assert.numArgs([].slice.call(arguments), 1),
      assert.arrayOfType(
        ["RouteGroup", "RouteBuilder"],
        "groupItems",
        groupItems
      ),
    ]);
  }

  const routeNames: Record<string, true> = {};

  groupItems.forEach((item) => {
    if (isRouteGroup(item)) {
      item.routeNames.forEach((name) => {
        routeNames[name] = true;
      });
    } else {
      routeNames[item.name] = true;
    }
  });

  return {
    "~internal": {
      type: "RouteGroup",
      Route: null as any,
    },
    routeNames: Object.keys(routeNames),
    has(route: UmbrellaRoute): route is UmbrellaRoute {
      if (__DEV__) {
        assert("[RouteGroup].has", [
          assert.numArgs([].slice.call(arguments), 1),
          assert.type("object", "route", route),
        ]);
      }

      if (route.name === false) {
        return false;
      }

      return !!routeNames[route.name];
    },
  };
}

function isRouteGroup(
  value: RouteGroup | UmbrellaRouteBuilder
): value is RouteGroup {
  return !!(value as RouteGroup).routeNames;
}

export function createGroup_fromRouteDefs<
  TRouteDefCollection extends { [routeName: string]: any }
>(
  routeDefs: TRouteDefCollection
): RouteGroup<
  CoreRouter<TRouteDefCollection>["routes"][keyof TRouteDefCollection][]
> {
  const core = coreCreateRouter(routeDefs);

  const group= createGroup_fromItems(
    Object.values(core.routes)
  );

  core.stopListening();

  return group;
}

export function createGroup<T extends any[]>(groupItems: T): RouteGroup<T>;
export function createGroup<
  TRouteDefCollection extends { [routeName: string]: any }
>(
  routeDefs: TRouteDefCollection
): RouteGroup<
  CoreRouter<TRouteDefCollection>["routes"][keyof TRouteDefCollection][]
>;
export function createGroup(
  arg: any[] | Record<string, unknown>
): RouteGroup<any> {
  return arg instanceof Array
    ? createGroup_fromItems(arg)
    : createGroup_fromRouteDefs(arg);
}


