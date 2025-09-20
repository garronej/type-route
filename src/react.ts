import {
  CoreRouter,
  UmbrellaRouteDefCollection,
  RouteDefCollectionRoute,
  RouterOpts,
} from "./types";
import { createRouter as coreCreateRouter, parseArgs } from "./createRouter";
import { TypeRouteError } from "./TypeRouteError";
import * as React from "react";
import { attemptScrollToTop } from "./attemptScrollToTop";
import { createForwardingProxy } from "./tools/createForwardingProxy";
import { assert } from "./tools/assert";

import * as types from "./types";

export type { types };
export { coreCreateRouter };

if (typeof __DEV__ === "boolean" && __DEV__) {
  const [major, minor] = React.version
    .split(".")
    .map((value: string) => parseInt(value, 10));

  if (major < 16 || (major === 16 && minor < 8)) {
    throw TypeRouteError.Invalid_React_version.create(React.version);
  }
}

export { defineRoute } from "./defineRoute";
export { param } from "./param";
export { createGroup } from "./createGroup";
export { noMatch } from "./noMatch";
export { preventDefaultLinkClickBehavior } from "./preventDefaultLinkClickBehavior";
export {
  GetRoute as Route,
  Link,
  ValueSerializer,
  QueryStringSerializer,
  SessionOpts,
  RouterOpts,
} from "./types";

type Router<TRouteDefCollection extends { [routeName: string]: any }> =
  Omit<CoreRouter<TRouteDefCollection>, "stopListening"> & {
    /**
     * React hook for retrieving the current route.
     *
     * @see https://type-route.zilch.dev/api-reference/router/use-route
     */
    useRoute: () => RouteDefCollectionRoute<TRouteDefCollection>;
  };
type UmbrellaRouter = Router<UmbrellaRouteDefCollection>;

const fpRoutes = createForwardingProxy<UmbrellaRouter["routes"]>({
  isFunction: false
});
const fpSession = createForwardingProxy<UmbrellaRouter["session"]>({
  isFunction: false
});
const fpGetRoute = createForwardingProxy<UmbrellaRouter["getRoute"]>({
  isFunction: true
});

const routeUpdateHandlers: (()=> void)[] = [];

let sessionUnlisten: (()=> void) | undefined = undefined;
let effect: (() => void) | undefined = undefined;

export function createRouter<
  TRouteDefCollection extends { [routeName: string]: any }
>(routeDefs: TRouteDefCollection): Router<TRouteDefCollection>;
export function createRouter<
  TRouteDefCollection extends { [routeName: string]: any }
>(
  opts: RouterOpts,
  routeDefs: TRouteDefCollection
): Router<TRouteDefCollection>;
export function createRouter(...args: any[]): UmbrellaRouter {

  const { opts, routeDefs } = parseArgs(args);
  const { routes, session, getRoute } = coreCreateRouter(
    { ...opts, scrollToTop: false },
    routeDefs
  );

  sessionUnlisten?.();
  sessionUnlisten =session.listen((route) => {
    routeUpdateHandlers.forEach((routeUpdateHandler) => routeUpdateHandler());

    if (opts.scrollToTop === true) {
      effect = () => {
        effect = undefined;
        attemptScrollToTop(route);
      };
    }
  });

  fpRoutes.updateTarget(routes);
  fpSession.updateTarget(session);
  fpGetRoute.updateTarget(getRoute);

  return {
    routes: fpRoutes.proxy,
    session: fpSession.proxy,
    getRoute: fpGetRoute.proxy,
    useRoute,
  };
}

function useRoute() {
  const route = fpGetRoute.proxy();

  const [, reRender] = React.useReducer((count) => count + 1, 0);

  React.useLayoutEffect(() => {
    const routeUpdateHandler = () => {
      reRender();
    };

    routeUpdateHandlers.push(routeUpdateHandler);

    return () => {
      const index = routeUpdateHandlers.indexOf(routeUpdateHandler);
      assert(index !== -1);
      routeUpdateHandlers.splice(index, 1);
    };
  }, []);

  React.useEffect(() => {
    effect?.();
  }, [route]);

  return route;
}
