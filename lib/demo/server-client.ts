import { makeClient } from "./builder";
import { execDemo } from "./exec";
/** Server side: queries run directly against the in-memory demo data. */
export const createDemoServerClient = () => makeClient(execDemo);
