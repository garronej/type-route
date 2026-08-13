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
import type { UnionToIntersection } from "./tools/UnionToIntersection";

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

export function mergeRouteDefs<
  TPageCollection extends { [pageName: string]: { routeDefs: { [routeName: string]: any } } }
>(
  params: { pages: TPageCollection; }
): { routeDefs: UnionToIntersection<TPageCollection[keyof TPageCollection]["routeDefs"]> }{

  const { pages } = params;

  const routeDefs = {};

  Object.keys(pages).forEach((pageName) =>
    Object.assign(routeDefs, pages[pageName].routeDefs)
  );

  // @ts-expect-error
  return { routeDefs };
}

// NOTE: For HMR, we want stable reference.  
let router: UmbrellaRouter | undefined = undefined;

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
  if (router !== undefined) {
    return router;
  }

  const { opts, routeDefs } = parseArgs(args);
  const { routes, session, getRoute } = coreCreateRouter(
    { ...opts, scrollToTop: false },
    routeDefs
  );

  let effect: (() => void) | undefined = undefined;

  if (opts.scrollToTop === true) {
    session.listen((route) => {
      effect = () => {
        effect = undefined;
        attemptScrollToTop(route);
      };
    });
  }

  function useRoute() {
    const route = getRoute();

    const [, reRender] = React.useReducer((count) => count + 1, 0);

    // `route` is deliberately the snapshot from the mount render. Once the
    // subscription exists, subsequent route changes are handled by it.
    React.useLayoutEffect(() => {
      const unlisten = session.listen(() => reRender());

      // Navigation may occur while a descendant is rendering, after this hook
      // read the route but before this subscription was registered. Re-read the
      // route after subscribing so that such an update cannot be missed.
      if (getRoute() !== route) {
        reRender();
      }

      return unlisten;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
      effect?.();
    }, [route]);

    return route;
  }

  router = {
    routes,
    session,
    getRoute,
    useRoute,
  };

  return router;
}
