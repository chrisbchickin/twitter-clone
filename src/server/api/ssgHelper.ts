import SuperJSON from "superjson";
import { appRouter } from "./root";
import { createServerSideHelpers } from "@trpc/react-query/server"
import { createInnerTRPCContext } from "./trpc";

export function ssgHelper() {
    return createServerSideHelpers({
        router: appRouter,
        ctx: createInnerTRPCContext({ session: null, revalidateSSG: null }),
        transformer: SuperJSON
    })
}